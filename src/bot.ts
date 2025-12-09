import { Telegraf, Context } from "telegraf";
import { config } from "./config";
import { requirePremium } from "./accessControl";
import { createCheckoutSession, PREMIUM_PLANS } from "./payment";
import {
  handleStart,
  handleHelp,
} from "./modules/start";
import {
  handleStreakRisk,
  handleExpectedValue,
  handleVarianceModel,
} from "./modules/probability";
import {
  handleRouletteMath,
  handleBlackjackMath,
  handleBankrollModel,
  handleLossStreak,
} from "./modules/casinoMath";
import {
  handleTokenActivity,
  handleHolderTrend,
  handleTopActivity,
  handleSentiment,
} from "./modules/cryptoData";
import {
  handleMonteCarloModel,
} from "./modules/simulation";

export function createBot(): Telegraf {
  const bot = new Telegraf(config.botToken);

  // General commands
  bot.command("start", handleStart);
  bot.command("help", handleHelp);

  // Pricing and payment
  bot.command("pricing", async (ctx) => {
    const pricingText = `
💰 **MoneyLens Premium Pricing**

**Monthly Premium:** £20.00/month
• Access all premium features
• Automatically renews monthly
• All probability tools
• Extended casino math tools
• Crypto analytics
• Advanced simulations

**Lifetime Premium:** £200.00 (one-time)
• Lifetime access to all premium features
• All tools unlocked forever
• Priority support

Use /buy to purchase premium access.
    `.trim();

    await ctx.reply(pricingText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "💳 Monthly Premium - £20/month",
              callback_data: "buy_monthly",
            },
          ],
          [
            {
              text: "💳 Lifetime Premium - £200",
              callback_data: "buy_lifetime",
            },
          ],
        ],
      },
    });
  });

  bot.command("buy", async (ctx) => {
    await ctx.reply("Select a premium plan:", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "💳 Monthly Premium - £20/month",
              callback_data: "buy_monthly",
            },
          ],
          [
            {
              text: "💳 Lifetime Premium - £200",
              callback_data: "buy_lifetime",
            },
          ],
        ],
      },
    });
  });

  // Handle buy callbacks - create Stripe Checkout session
  bot.action("buy_monthly", async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply("Unable to identify user.");
      await ctx.answerCbQuery();
      return;
    }

    await ctx.answerCbQuery("Creating payment link...");

    const checkout = await createCheckoutSession(telegramId.toString(), "monthly");
    
    if (!checkout || !checkout.url) {
      await ctx.reply("Error creating payment session. Please try again later.");
      return;
    }

    await ctx.reply(
      "💳 **Monthly Premium Subscription**\n\n" +
      "Click the button below to complete your payment. Your subscription will automatically renew each month.\n\n" +
      "After payment, you'll be redirected back to the bot.",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💳 Pay £20/month",
                url: checkout.url,
              },
            ],
          ],
        },
      }
    );
  });

  bot.action("buy_lifetime", async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply("Unable to identify user.");
      await ctx.answerCbQuery();
      return;
    }

    await ctx.answerCbQuery("Creating payment link...");

    const checkout = await createCheckoutSession(telegramId.toString(), "lifetime");
    
    if (!checkout || !checkout.url) {
      await ctx.reply("Error creating payment session. Please try again later.");
      return;
    }

    await ctx.reply(
      "💳 **Lifetime Premium**\n\n" +
      "Click the button below to complete your one-time payment of £200.\n\n" +
      "After payment, you'll be redirected back to the bot.",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💳 Pay £200 (One-time)",
                url: checkout.url,
              },
            ],
          ],
        },
      }
    );
  });

  // Menu callbacks
  bot.action("menu_probability", async (ctx) => {
    await ctx.reply(
      "📊 **Probability Tools** (Premium)\n\n" +
      "Available commands:\n" +
      "/streak_risk <streak> <rounds>\n" +
      "/expected_value <p> <payout> <loss> <rounds>\n" +
      "/variance_model <p> <payout> <loss> <rounds>",
      { parse_mode: "Markdown" }
    );
    await ctx.answerCbQuery();
  });

  bot.action("menu_casino", async (ctx) => {
    await ctx.reply(
      "🎲 **Casino Math Tools**\n\n" +
      "Free:\n" +
      "/roulette_math\n\n" +
      "Premium:\n" +
      "/roulette_math extended <mode>\n" +
      "/blackjack_math <total>\n" +
      "/bankroll_model <bankroll> <avgBet> <houseEdge> <rounds>\n" +
      "/lossstreak <prob> <streak> <rounds>",
      { parse_mode: "Markdown" }
    );
    await ctx.answerCbQuery();
  });

  bot.action("menu_crypto", async (ctx) => {
    await ctx.reply(
      "📈 **Crypto Analytics** (Premium)\n\n" +
      "Available commands:\n" +
      "/token_activity <token>\n" +
      "/holder_trend <token>\n" +
      "/top_activity\n" +
      "/sentiment <keyword>",
      { parse_mode: "Markdown" }
    );
    await ctx.answerCbQuery();
  });

  bot.action("menu_pricing", async (ctx) => {
    await ctx.reply(
      "💰 Use /pricing to view pricing details or /buy to purchase premium.",
      { parse_mode: "Markdown" }
    );
    await ctx.answerCbQuery();
  });


  // Probability commands (Premium)
  bot.command("streak_risk", requirePremium, handleStreakRisk);
  bot.command("expected_value", requirePremium, handleExpectedValue);
  bot.command("variance_model", requirePremium, handleVarianceModel);

  // Casino math commands
  bot.command("roulette_math", handleRouletteMath);
  bot.command("blackjack_math", requirePremium, handleBlackjackMath);
  bot.command("bankroll_model", requirePremium, handleBankrollModel);
  bot.command("lossstreak", requirePremium, handleLossStreak);

  // Crypto commands (Premium)
  bot.command("token_activity", requirePremium, handleTokenActivity);
  bot.command("holder_trend", requirePremium, handleHolderTrend);
  bot.command("top_activity", requirePremium, handleTopActivity);
  bot.command("sentiment", requirePremium, handleSentiment);

  // Simulation commands (Premium)
  bot.command("montecarlo_model", requirePremium, handleMonteCarloModel);

  // Error handling
  bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    
    // Provide helpful error messages
    let errorMessage = "❌ **Oops! Something went wrong.**\n\n";
    
    if (err.message?.includes("Firestore")) {
      errorMessage += "There was a database error. Please try again in a moment.";
    } else if (err.message?.includes("premium") || err.message?.includes("Premium")) {
      errorMessage += "This feature requires premium access. Type /buy to upgrade.";
    } else {
      errorMessage += "Please try again. If the problem persists, check:\n";
      errorMessage += "• Did you use the correct command format?\n";
      errorMessage += "• Type /help to see command examples\n";
      errorMessage += "• Make sure you have premium if needed (type /buy)";
    }
    
    ctx.reply(errorMessage, { parse_mode: "Markdown" }).catch(() => {
      // Fallback if markdown fails
      ctx.reply("An error occurred. Please try again or type /help for assistance.");
    });
  });

  return bot;
}

