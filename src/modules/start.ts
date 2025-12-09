import { Context } from "telegraf";
import { userService } from "../firebase";
import { activatePremiumFromStartPayload } from "../payment";

export async function handleStart(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const telegramIdStr = telegramId.toString();

  // Check for start payload (from Stripe redirect)
  // In Telegraf, start parameters come after /start in the message text
  const messageText = ctx.message && "text" in ctx.message ? ctx.message.text : "";
  const startPayload = messageText.split(" ")[1]; // Get parameter after /start
  if (startPayload && startPayload.startsWith("paid_")) {
    const planType = startPayload.replace("paid_", "") as "monthly" | "lifetime";
    
    if (planType === "monthly" || planType === "lifetime") {
      // Activate premium
      const result = await activatePremiumFromStartPayload(telegramIdStr, planType);
      
      if (result.success) {
        const durationText = planType === "lifetime" ? "lifetime" : "30 days";
        await ctx.reply(
          `✅ Payment successful! You now have ${durationText} premium access.\n\n` +
          `Use the buttons below to explore all premium features.`
        );
      } else {
        await ctx.reply(
          "Payment detected but there was an error activating premium. Please contact support."
        );
      }
    }
  }

  // Ensure user exists in database
  await userService.getOrCreateUser(telegramIdStr, ctx.from.username);

  const welcomeMessage = `
🎯 Welcome to **MoneyLens** - Educational Analytics Bot

MoneyLens provides educational tools for understanding probability, risk, and statistical analysis. All tools are designed for **educational purposes only** and do not provide gambling advice, strategies, predictions, or financial guidance.

**Available Tools:**

📊 **Probability & Risk Tools**
• Streak risk analysis
• Expected value calculations
• Variance modeling

🎲 **Casino Math Tools** (Educational)
• Roulette probability analysis
• Blackjack math
• Bankroll modeling
• Loss streak calculations

📈 **Crypto Public-Data Analytics**
• Token activity metrics
• Holder trend analysis
• Top activity rankings
• Sentiment analysis

🔬 **Advanced Simulations**
• Monte Carlo modeling
• Variance analysis

Use the buttons below to explore, or type /help for command list.
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
}

export async function handleHelp(ctx: Context): Promise<void> {
  const helpText = `
📚 **MoneyLens Commands**

**General:**
/start - Show welcome message and menu
/help - Show this help message
/pricing - View premium pricing
/buy - Purchase premium access

**Probability Tools** (Premium):
/streak_risk <streak> <rounds> - Calculate streak risk probability
/expected_value <p> <payout> <loss> <rounds> - Calculate EV and variance
/variance_model <p> <payout> <loss> <rounds> - Advanced variance analysis

**Casino Math** (Educational):
/roulette_math - Basic roulette probability (Free)
/roulette_math extended <mode> - Extended analysis (Premium)
/blackjack_math <total> - Bust probability (Premium)
/bankroll_model <bankroll> <avgBet> <houseEdge> <rounds> - Survival analysis (Premium)
/lossstreak <prob> <streak> <rounds> - Loss streak probability (Premium)

**Crypto Analytics** (Premium):
/token_activity <token> - Token activity metrics
/holder_trend <token> - Holder trend analysis
/top_activity - Top tokens by activity
/sentiment <keyword> - Sentiment analysis

**Simulations** (Premium):
/montecarlo_model <trials> - Monte Carlo simulation
/variance_model <p> <payout> <loss> <rounds> - Variance modeling

**Note:** All tools are for educational purposes only.
  `.trim();

  await ctx.reply(helpText, { parse_mode: "Markdown" });
}

