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
🎯 **Welcome to MoneyLens!**

Hi! I'm your educational analytics assistant. I help you understand probability, risk, and statistical analysis through easy-to-use tools.

**📚 What I Do:**
I provide mathematical calculations and educational insights. All tools are for **learning purposes only** - I don't give gambling advice, strategies, predictions, or financial guidance.

**🛠️ What You Can Do:**

📊 **Probability & Risk Tools** (Premium)
Calculate streak probabilities, expected values, and variance models

🎲 **Casino Math Tools** (Educational)
Learn about roulette, blackjack, and bankroll mathematics

📈 **Crypto Analytics** (Premium)
View token activity, holder trends, and market sentiment

🔬 **Simulations** (Premium)
Run Monte Carlo simulations and variance analysis

**💡 Getting Started:**
• Tap the buttons below to explore features
• Type /help to see all commands with examples
• Type /pricing to view premium plans

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

