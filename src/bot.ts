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
    const telegramId = ctx.from?.id;
    let isPremium = false;
    if (telegramId) {
      const userService = (await import("./firebase")).userService;
      await userService.getOrCreateUser(telegramId.toString(), ctx.from.username);
      isPremium = await userService.checkPremiumStatus(telegramId.toString());
    }

    const premiumStatus = isPremium 
      ? "✅ **You are a Premium Member!**\n\n" 
      : "🔓 **Unlock Premium Access**\n\n";

    const pricingText = `
${premiumStatus}💰 **MoneyLens Premium Pricing**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**⭐ Monthly Premium:** £20.00/month
• ✅ All premium features unlocked
• 🔄 Automatically renews monthly
• 🚫 Cancel anytime
• 📊 All probability & risk tools
• 🎲 Extended casino math analysis
• 📈 Crypto analytics & insights
• 🔬 Advanced simulations
• 🎯 Priority support

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**👑 Lifetime Premium:** £200.00 (one-time)
• ✅ Lifetime access to all features
• 🔒 Pay once, access forever
• 💎 Best value for long-term users
• 📊 All probability & risk tools
• 🎲 Extended casino math analysis
• 📈 Crypto analytics & insights
• 🔬 Advanced simulations
• 🎯 Priority support
• 🎁 No recurring charges

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${isPremium ? "**You already have premium!** Enjoy all features. 🎉" : "**Ready to upgrade?** Click below to get started!"}
    `.trim();

    await ctx.reply(pricingText, {
      parse_mode: "Markdown",
      reply_markup: isPremium ? undefined : {
        inline_keyboard: [
          [
            {
              text: "💳 Monthly - £20/month",
              callback_data: "buy_monthly",
            },
          ],
          [
            {
              text: "👑 Lifetime - £200",
              callback_data: "buy_lifetime",
            },
          ],
        ],
      },
    });
  });

  bot.command("buy", async (ctx) => {
    const telegramId = ctx.from?.id;
    let isPremium = false;
    if (telegramId) {
      const userService = (await import("./firebase")).userService;
      await userService.getOrCreateUser(telegramId.toString(), ctx.from.username);
      isPremium = await userService.checkPremiumStatus(telegramId.toString());
    }

    if (isPremium) {
      await ctx.reply(
        "✅ **You Already Have Premium!**\n\n" +
        "You're all set! All premium features are unlocked.\n\n" +
        "**Your Premium Includes:**\n" +
        "✅ All probability & risk tools\n" +
        "✅ Extended casino math analysis\n" +
        "✅ Crypto analytics & insights\n" +
        "✅ Advanced simulations\n" +
        "✅ Priority support\n\n" +
        "Enjoy your premium experience! 🎉",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📊 Explore Premium Tools",
                  callback_data: "menu_probability",
                },
              ],
            ],
          },
        }
      );
      return;
    }

    await ctx.reply(
      "💳 **Choose Your Premium Plan**\n\n" +
      "Select the plan that works best for you:\n\n" +
      "**⭐ Monthly Premium**\n" +
      "£20/month • Auto-renews • Cancel anytime\n\n" +
      "**👑 Lifetime Premium**\n" +
      "£200 one-time • Access forever • Best value\n\n" +
      "Both plans include all premium features!",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💳 Monthly - £20/month",
                callback_data: "buy_monthly",
              },
            ],
            [
              {
                text: "👑 Lifetime - £200",
                callback_data: "buy_lifetime",
              },
            ],
          ],
        },
      }
    );
  });

  // Premium status command
  bot.command("status", async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply("Unable to identify user.");
      return;
    }

    const userService = (await import("./firebase")).userService;
    await userService.getOrCreateUser(telegramId.toString(), ctx.from.username);
    const user = await userService.getUser(telegramId.toString());
    const isPremium = await userService.checkPremiumStatus(telegramId.toString());

    if (!isPremium || !user) {
      await ctx.reply(
        "📊 **Your Account Status**\n\n" +
        "**Membership:** Free User\n" +
        "**Premium Access:** ❌ Not Active\n\n" +
        "**Available Features:**\n" +
        "🆓 Free casino math tools\n" +
        "🔒 Premium features locked\n\n" +
        "**Upgrade to Premium:**\n" +
        "Get access to all tools and features!",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "💳 Get Premium",
                  callback_data: "buy_monthly",
                },
              ],
            ],
          },
        }
      );
      return;
    }

    // Premium user
    const premiumSince = user.premiumSince?.toDate();
    const premiumUntil = user.premiumUntil?.toDate();
    const isLifetime = !premiumUntil;

    let statusText = `
⭐ **Premium Account Status** ⭐

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Membership:** Premium User 👑
**Status:** ✅ Active

**Plan Type:** ${isLifetime ? "👑 Lifetime" : "⭐ Monthly"}

`;

    if (premiumSince) {
      statusText += `**Member Since:** ${premiumSince.toLocaleDateString()}\n`;
    }

    if (!isLifetime && premiumUntil) {
      const daysLeft = Math.ceil((premiumUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      statusText += `**Expires:** ${premiumUntil.toLocaleDateString()}\n`;
      statusText += `**Days Remaining:** ${daysLeft} days\n`;
    } else if (isLifetime) {
      statusText += `**Expires:** Never (Lifetime) ✨\n`;
    }

    statusText += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**✅ Premium Features Unlocked:**
📊 Probability & Risk Tools
🎲 Extended Casino Math
📈 Crypto Analytics
🔬 Advanced Simulations
🎯 Priority Support

**🎉 Enjoy your premium experience!**
    `.trim();

    await ctx.reply(statusText, { parse_mode: "Markdown" });
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
      "**What You'll Get:**\n" +
      "✅ All premium features unlocked\n" +
      "✅ Auto-renewal each month\n" +
      "✅ Cancel anytime\n" +
      "✅ Priority support\n\n" +
      "**Price:** £20.00/month\n\n" +
      "**Next Steps:**\n" +
      "Click the button below to securely complete your payment. You'll be redirected back here after payment.\n\n" +
      "🔒 Secure payment via Stripe",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💳 Pay £20/month - Secure Checkout",
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
      "👑 **Lifetime Premium**\n\n" +
      "**What You'll Get:**\n" +
      "✅ Lifetime access to all features\n" +
      "✅ Pay once, access forever\n" +
      "✅ All premium tools unlocked\n" +
      "✅ Priority support\n" +
      "✅ No recurring charges\n\n" +
      "**Price:** £200.00 (one-time payment)\n\n" +
      "**Best Value:** Save £40/year compared to monthly!\n\n" +
      "**Next Steps:**\n" +
      "Click the button below to securely complete your payment. You'll be redirected back here after payment.\n\n" +
      "🔒 Secure payment via Stripe",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "👑 Pay £200 - Secure Checkout",
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
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.answerCbQuery();
      return;
    }

    // Check if user has premium
    const userService = (await import("./firebase")).userService;
    await userService.getOrCreateUser(telegramId.toString(), ctx.from.username);
    const isPremium = await userService.checkPremiumStatus(telegramId.toString());

    if (!isPremium) {
      await ctx.reply(
        "📊 **Probability Tools** (🔒 Premium)\n\n" +
        "These advanced tools require premium access:\n\n" +
        "**Available Commands:**\n" +
        "• /streak_risk <streak> <rounds>\n" +
        "• /expected_value <p> <payout> <loss> <rounds>\n" +
        "• /variance_model <p> <payout> <loss> <rounds>\n\n" +
        "**💡 Example:**\n" +
        "`/streak_risk 5 200` - Calculate probability of a 5-loss streak in 200 rounds\n\n" +
        "**🔓 Unlock Premium:**\n" +
        "Get access to all probability tools and more!",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "💳 Get Premium Access",
                  callback_data: "buy_monthly",
                },
              ],
            ],
          },
        }
      );
    } else {
      await ctx.reply(
        "📊 **Probability Tools** ✅\n\n" +
        "**Available Commands:**\n" +
        "• /streak_risk <streak> <rounds>\n" +
        "  Example: `/streak_risk 5 200`\n\n" +
        "• /expected_value <p> <payout> <loss> <rounds>\n" +
        "  Example: `/expected_value 0.5 2 1 100`\n\n" +
        "• /variance_model <p> <payout> <loss> <rounds>\n" +
        "  Example: `/variance_model 0.5 2 1 100`\n\n" +
        "💡 Type any command to get started!",
        { parse_mode: "Markdown" }
      );
    }
    await ctx.answerCbQuery();
  });

  bot.action("menu_casino", async (ctx) => {
    await ctx.reply(
      "🎲 **Casino Math Tools**\n\n" +
      "**🆓 Free Tools:**\n" +
      "• /roulette_math - Basic roulette probability\n" +
      "  Try it now: `/roulette_math`\n\n" +
      "**🔒 Premium Tools:**\n" +
      "• /roulette_math extended <mode>\n" +
      "  Example: `/roulette_math extended red`\n\n" +
      "• /blackjack_math <total>\n" +
      "  Example: `/blackjack_math 15`\n\n" +
      "• /bankroll_model <bankroll> <avgBet> <houseEdge> <rounds>\n" +
      "  Example: `/bankroll_model 1000 10 0.027 100`\n\n" +
      "• /lossstreak <prob> <streak> <rounds>\n" +
      "  Example: `/lossstreak 0.52 5 200`\n\n" +
      "💡 Start with the free tool, then upgrade for advanced analysis!",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💳 Get Premium for Advanced Tools",
                callback_data: "buy_monthly",
              },
            ],
          ],
        },
      }
    );
    await ctx.answerCbQuery();
  });

  bot.action("menu_crypto", async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.answerCbQuery();
      return;
    }

    const userService = (await import("./firebase")).userService;
    await userService.getOrCreateUser(telegramId.toString(), ctx.from.username);
    const isPremium = await userService.checkPremiumStatus(telegramId.toString());

    if (!isPremium) {
      await ctx.reply(
        "📈 **Crypto Analytics** (🔒 Premium)\n\n" +
        "These market analysis tools require premium access:\n\n" +
        "**Available Commands:**\n" +
        "• /token_activity <token>\n" +
        "• /holder_trend <token>\n" +
        "• /top_activity\n" +
        "• /sentiment <keyword>\n\n" +
        "**💡 Example:**\n" +
        "`/token_activity BTC` - View Bitcoin activity metrics\n\n" +
        "**🔓 Unlock Premium:**\n" +
        "Get access to all crypto analytics tools!",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "💳 Get Premium Access",
                  callback_data: "buy_monthly",
                },
              ],
            ],
          },
        }
      );
    } else {
      await ctx.reply(
        "📈 **Crypto Analytics** ✅\n\n" +
        "**Available Commands:**\n" +
        "• /token_activity <token>\n" +
        "  Example: `/token_activity BTC`\n\n" +
        "• /holder_trend <token>\n" +
        "  Example: `/holder_trend ETH`\n\n" +
        "• /top_activity\n" +
        "  View top tokens by activity\n\n" +
        "• /sentiment <keyword>\n" +
        "  Example: `/sentiment bitcoin`\n\n" +
        "💡 Type any command to get started!",
        { parse_mode: "Markdown" }
      );
    }
    await ctx.answerCbQuery();
  });

  bot.action("menu_pricing", async (ctx) => {
    await ctx.reply(
      "💰 **Premium Pricing**\n\n" +
      "**Monthly Premium:** £20/month\n" +
      "• Auto-renews monthly\n" +
      "• Cancel anytime\n\n" +
      "**Lifetime Premium:** £200 (one-time)\n" +
      "• Pay once, access forever\n" +
      "• Best value for long-term users\n\n" +
      "**Get Started:**\n" +
      "Type /buy to see payment options!",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💳 Purchase Premium",
                callback_data: "buy_monthly",
              },
            ],
          ],
        },
      }
    );
    await ctx.answerCbQuery();
  });

  // Simulation menu
  bot.action("menu_simulation", async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.answerCbQuery();
      return;
    }

    const userService = (await import("./firebase")).userService;
    await userService.getOrCreateUser(telegramId.toString(), ctx.from.username);
    const isPremium = await userService.checkPremiumStatus(telegramId.toString());

    if (!isPremium) {
      await ctx.reply(
        "🔬 **Simulations** (🔒 Premium)\n\n" +
        "Advanced simulation tools require premium access:\n\n" +
        "**Available Commands:**\n" +
        "• /montecarlo_model <trials>\n" +
        "• /variance_model <p> <payout> <loss> <rounds>\n\n" +
        "**💡 Example:**\n" +
        "`/montecarlo_model 10000` - Run Monte Carlo simulation\n\n" +
        "**🔓 Unlock Premium:**\n" +
        "Get access to all simulation tools!",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "💳 Get Premium Access",
                  callback_data: "buy_monthly",
                },
              ],
            ],
          },
        }
      );
    } else {
      await ctx.reply(
        "🔬 **Simulations** ✅\n\n" +
        "**Available Commands:**\n" +
        "• /montecarlo_model <trials>\n" +
        "  Example: `/montecarlo_model 10000`\n\n" +
        "• /variance_model <p> <payout> <loss> <rounds>\n" +
        "  Example: `/variance_model 0.5 2 1 100`\n\n" +
        "💡 Type any command to get started!",
        { parse_mode: "Markdown" }
      );
    }
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
    
    const errorMsg = err instanceof Error ? err.message : String(err);
    
    if (errorMsg.includes("Firestore")) {
      errorMessage += "There was a database error. Please try again in a moment.";
    } else if (errorMsg.includes("premium") || errorMsg.includes("Premium")) {
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

