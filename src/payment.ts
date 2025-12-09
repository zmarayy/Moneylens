import Stripe from "stripe";
import { Context } from "telegraf";
import { config } from "./config";
import { userService, paymentService } from "./firebase";

const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: "2023-10-16",
});

export const PREMIUM_PLANS = {
  monthly: {
    id: "monthly",
    title: "Monthly Premium",
    description: "Access all premium features - automatically renews monthly",
    amount: 2000, // £20.00 in pence
    duration: 30,
  },
  lifetime: {
    id: "lifetime",
    title: "Lifetime Premium",
    description: "Lifetime access to all premium features",
    amount: 20000, // £200.00 in pence
    duration: null,
  },
};

// Create Stripe Checkout Session
export async function createCheckoutSession(
  telegramId: string,
  planType: "monthly" | "lifetime"
): Promise<{ url: string; sessionId: string } | null> {
  try {
    const plan = PREMIUM_PLANS[planType];
    const botUrl = `https://t.me/MoneyLens_bot?start=paid_${planType}`;

    if (planType === "monthly") {
      // Create a subscription for monthly recurring billing
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: config.currency.toLowerCase(),
              product_data: {
                name: plan.title,
                description: plan.description,
              },
              unit_amount: plan.amount,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          telegramId: telegramId.toString(),
          planType: planType,
        },
        success_url: botUrl,
        cancel_url: botUrl,
        subscription_data: {
          metadata: {
            telegramId: telegramId.toString(),
            planType: planType,
          },
        },
      });

      return { url: session.url || "", sessionId: session.id };
    } else {
      // One-time payment for lifetime
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: config.currency.toLowerCase(),
              product_data: {
                name: plan.title,
                description: plan.description,
              },
              unit_amount: plan.amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          telegramId: telegramId.toString(),
          planType: planType,
        },
        success_url: botUrl,
        cancel_url: botUrl,
      });

      return { url: session.url || "", sessionId: session.id };
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return null;
  }
}

export async function handleStripeWebhook(
  req: { body: Buffer | string; headers: { [key: string]: string | string[] | undefined } }
): Promise<{ success: boolean; message: string }> {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig) {
    return { success: false, message: "No signature found" };
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    
    if (!webhookSecret) {
      console.warn("STRIPE_WEBHOOK_SECRET not set. Webhook verification skipped.");
      const bodyString = typeof req.body === "string" ? req.body : req.body.toString();
      event = JSON.parse(bodyString);
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return { success: false, message: `Webhook Error: ${err.message}` };
  }

  try {
    // Handle one-time payment (lifetime)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only process if it's a one-time payment (not subscription)
      if (session.mode === "payment") {
        const telegramId = session.metadata?.telegramId;
        const planType = session.metadata?.planType;

        if (!telegramId || !planType || planType !== "lifetime") {
          return { success: true, message: "Event handled (not lifetime)" };
        }

        // Record payment
        await paymentService.createPayment({
          telegramId,
          amount: (session.amount_total || 0) / 100,
          currency: (session.currency || "gbp").toUpperCase(),
          provider: "stripe",
          status: "successful",
          rawData: session,
        });

        // Activate lifetime premium
        await userService.setPremium(telegramId, null);
        console.log(`Lifetime premium activated for user ${telegramId}`);
      }
    }

    // Handle subscription created (first payment)
    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      const telegramId = subscription.metadata?.telegramId;
      const planType = subscription.metadata?.planType;

      if (telegramId && planType === "monthly") {
        // Activate premium for 30 days (will be renewed via invoice.payment_succeeded)
        await userService.setPremium(telegramId, 30);
        console.log(`Monthly subscription created for user ${telegramId}`);
      }
    }

    // Handle subscription renewals and updates
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );
        
        const telegramId = subscription.metadata?.telegramId;
        const planType = subscription.metadata?.planType;

        if (telegramId && planType === "monthly") {
          // Record payment
          await paymentService.createPayment({
            telegramId,
            amount: (invoice.amount_paid || 0) / 100,
            currency: (invoice.currency || "gbp").toUpperCase(),
            provider: "stripe",
            status: "successful",
            rawData: { invoice: invoice.id, subscription: subscription.id },
          });

          // Renew premium for another 30 days
          await userService.setPremium(telegramId, 30);
          console.log(`Monthly subscription renewed for user ${telegramId}`);
        }
      }
    }

    // Handle subscription cancellation or failure
    if (event.type === "customer.subscription.deleted" || 
        event.type === "invoice.payment_failed") {
      const subscription = event.type === "customer.subscription.deleted"
        ? (event.data.object as Stripe.Subscription)
        : await stripe.subscriptions.retrieve(
            (event.data.object as Stripe.Invoice).subscription as string
          );
      
      const telegramId = subscription.metadata?.telegramId;
      
      if (telegramId) {
        // Don't immediately revoke - let it expire naturally
        // The checkPremiumStatus function will handle expiration
        console.log(`Subscription issue for user ${telegramId}: ${event.type}`);
      }
    }

    return { success: true, message: "Event handled" };
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    return { success: false, message: "Error processing webhook" };
  }
}

export async function activatePremiumFromStartPayload(
  telegramId: string,
  planType: "monthly" | "lifetime"
): Promise<{ success: boolean; message: string }> {
  try {
    const plan = PREMIUM_PLANS[planType];

    // Update user premium status
    await userService.setPremium(telegramId, plan.duration);

    // Record payment (may have been recorded via webhook already)
    await paymentService.createPayment({
      telegramId,
      amount: planType === "monthly" ? 20 : 200,
      currency: "GBP",
      provider: "stripe",
      status: "successful",
      rawData: { source: "start_payload", planType },
    });

    return { success: true, message: "Premium activated" };
  } catch (error) {
    console.error("Error activating premium from start payload:", error);
    return { success: false, message: "Error activating premium" };
  }
}
