import { Context } from "telegraf";
import { userService } from "../firebase";
import { activatePremiumFromStartPayload } from "../payment";

export async function handleStart(ctx: Context): Promise<void> {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply("Unable to identify user. Please try again.");
      return;
    }

    const telegramIdStr = telegramId.toString();

    // Check for start payload (from Stripe redirect)
    // In Telegraf, start parameters come after /start in the message text
    const messageText = ctx.message && "text" in ctx.message ? ctx.message.text : "";
    const startPayload = messageText.split(" ")[1]; // Get parameter after /start
    if (startPayload && startPayload.startsWith("paid_")) {
      const planType = startPayload.replace("paid_", "") as "monthly" | "lifetime";
      
      if (planType === "monthly" || planType === "lifetime") {
        try {
          // Activate premium
          const result = await activatePremiumFromStartPayload(telegramIdStr, planType);
          
          if (result.success) {
            const durationText = planType === "lifetime" ? "✨ LIFETIME ✨" : "30 days";
            const emoji = planType === "lifetime" ? "👑" : "⭐";
            
            await ctx.reply(
              `${emoji} **🎉 Welcome to Premium!** ${emoji}\n\n` +
              `**Payment Confirmed** ✅\n` +
              `Your premium access has been activated!\n\n` +
              `**Your Plan:**\n` +
              `• ${durationText} Premium Access\n` +
              `• All premium features unlocked\n` +
              `• Priority support\n\n` +
              `**🚀 What's Next?**\n` +
              `Explore all premium tools using the buttons below or type /help to see all commands.\n\n` +
              `**Premium Features Available:**\n` +
              `📊 Probability & Risk Tools\n` +
              `🎲 Extended Casino Math\n` +
              `📈 Crypto Analytics\n` +
              `🔬 Advanced Simulations\n\n` +
              `Enjoy your premium experience! 🎊`,
              {
                parse_mode: "Markdown",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "📊 Probability Tools",
                        callback_data: "menu_probability",
                      },
                    ],
                    [
                      {
                        text: "🎲 Casino Math Tools",
                        callback_data: "menu_casino",
                      },
                    ],
                    [
                      {
                        text: "📈 Crypto Analytics",
                        callback_data: "menu_crypto",
                      },
                    ],
                    [
                      {
                        text: "🔬 Simulations",
                        callback_data: "menu_simulation",
                      },
                    ],
                  ],
                },
              }
            );
            return; // Exit early after payment success message
          } else {
            await ctx.reply(
              "⚠️ **Payment Detected**\n\n" +
              "We detected your payment but encountered an issue activating premium.\n\n" +
              "**Don't worry!** Your payment was successful. Please:\n" +
              "1. Wait a few moments and try again\n" +
              "2. If the issue persists, contact support with your payment receipt\n\n" +
              "We'll make sure you get your premium access! 💪"
            );
          }
        } catch (error) {
          console.error("Error processing payment:", error);
          await ctx.reply(
            "⚠️ **Payment Processing**\n\n" +
            "We're processing your payment. Please wait a moment and try /start again.\n\n" +
            "If the issue persists, your payment was successful and we'll activate premium shortly."
          );
        }
      }
    }

    // Ensure user exists in database (with error handling)
    let isPremium = false;
    try {
      await userService.getOrCreateUser(telegramIdStr, ctx.from.username);
      // Check premium status for personalized welcome
      isPremium = await userService.checkPremiumStatus(telegramIdStr);
    } catch (error) {
      console.error("Error accessing database:", error);
      // Continue with default (non-premium) welcome if database fails
      isPremium = false;
    }

    const premiumBadge = isPremium ? "⭐ **PREMIUM USER** ⭐\n\n" : "";

    const welcomeMessage = `
${premiumBadge}🎯 **Welcome to MoneyLens!**

Hi! I'm your educational analytics assistant. I help you understand probability, risk, and statistical analysis through easy-to-use tools.

**📚 What I Do:**
I provide mathematical calculations and educational insights. All tools are for **learning purposes only** - I don't give gambling advice, strategies, predictions, or financial guidance.

**🛠️ What You Can Do:**

📊 **Probability & Risk Tools** ${isPremium ? "✅" : "🔒 Premium"}
Calculate streak probabilities, expected values, and variance models

🎲 **Casino Math Tools** 🆓
Learn about roulette, blackjack, and bankroll mathematics

📈 **Crypto Analytics** ${isPremium ? "✅" : "🔒 Premium"}
View token activity, holder trends, and market sentiment

🔬 **Simulations** ${isPremium ? "✅" : "🔒 Premium"}
Run Monte Carlo simulations and variance analysis

${isPremium ? "**✨ You have full premium access!** All features are unlocked.\n\n" : "**💡 Getting Started:**\n• Try the free /roulette_math tool\n• Type /buy to unlock premium features\n\n"}

**Quick Actions:**
• Tap buttons below to explore
• Type /help for all commands
• Type /pricing for premium plans

**Ready to start?** Choose a tool below or type a command! 🚀
  `.trim();

    await ctx.reply(welcomeMessage, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📊 Probability Tools",
              callback_data: "menu_probability",
            },
          ],
          [
            {
              text: "🎲 Casino Math Tools",
              callback_data: "menu_casino",
            },
          ],
          [
            {
              text: "📈 Crypto Analytics",
              callback_data: "menu_crypto",
            },
          ],
          [
            {
              text: "💰 Pricing",
              callback_data: "menu_pricing",
            },
          ],
        ],
      },
    });
  } catch (error) {
    console.error("Error in handleStart:", error);
    // Fallback welcome message if everything fails
    await ctx.reply(
      "🎯 **Welcome to MoneyLens!**\n\n" +
      "I'm your educational analytics assistant.\n\n" +
      "**Quick Start:**\n" +
      "• Type /help to see all commands\n" +
      "• Type /roulette_math for a free tool\n" +
      "• Type /buy for premium access\n\n" +
      "Let's get started! 🚀"
    ).catch(() => {
      // If even the fallback fails, do nothing
      console.error("Failed to send fallback message");
    });
  }
}

export async function handleHelp(ctx: Context): Promise<void> {
  const helpText = `
📚 **MoneyLens - Complete Command Guide**

**🔹 General Commands:**
/start - Show welcome message and menu
/help - Show this help message
/pricing - View premium pricing plans
/buy - Purchase premium access

**📊 Probability Tools** (🔒 Premium):
/streak_risk <streak> <rounds>
  Example: /streak_risk 5 200
  Calculates probability of a losing streak

/expected_value <probability> <payout> <loss> <rounds>
  Example: /expected_value 0.5 2 1 100
  Calculates expected value and variance

/variance_model <probability> <payout> <loss> <rounds>
  Example: /variance_model 0.5 2 1 100
  Advanced variance analysis

**🎲 Casino Math Tools:**
/roulette_math
  Free basic roulette probability info

/roulette_math extended <mode>
  Example: /roulette_math extended red
  Premium extended analysis (modes: red, black, even, odd, straight, split, street)

/blackjack_math <total>
  Example: /blackjack_math 15
  Calculate bust probability (Premium)

/bankroll_model <bankroll> <avgBet> <houseEdge> <rounds>
  Example: /bankroll_model 1000 10 0.027 100
  Bankroll survival analysis (Premium)

/lossstreak <probability> <streak> <rounds>
  Example: /lossstreak 0.52 5 200
  Loss streak probability (Premium)

**📈 Crypto Analytics** (🔒 Premium):
/token_activity <token>
  Example: /token_activity BTC
  View token activity metrics

/holder_trend <token>
  Example: /holder_trend ETH
  Analyze holder trends

/top_activity
  View top tokens by activity

/sentiment <keyword>
  Example: /sentiment bitcoin
  Analyze market sentiment

**🔬 Simulations** (🔒 Premium):
/montecarlo_model <trials>
  Example: /montecarlo_model 10000
  Run Monte Carlo simulation

**💡 Tips:**
• Replace values in examples with your own numbers
• Premium features are marked with 🔒
• All tools are for educational purposes only

**Need help?** Type any command without parameters to see usage examples!
  `.trim();

  await ctx.reply(helpText, { parse_mode: "Markdown" });
}

