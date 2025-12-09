import { Context } from "telegraf";
import { userService } from "./firebase";

export async function requirePremium(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.reply("Unable to identify user.");
    return;
  }

  // Get or create user
  await userService.getOrCreateUser(
    telegramId.toString(),
    ctx.from.username
  );

  // Check premium status
  const isPremium = await userService.checkPremiumStatus(
    telegramId.toString()
  );

  if (!isPremium) {
    await ctx.reply(
      "🔒 **Premium Feature Required**\n\n" +
      "This tool is available for **premium users only**.\n\n" +
      "**✨ What You Get with Premium:**\n" +
      "✅ All probability & risk analysis tools\n" +
      "✅ Extended casino math calculations\n" +
      "✅ Crypto analytics & market insights\n" +
      "✅ Advanced Monte Carlo simulations\n" +
      "✅ Priority support\n\n" +
      "**💰 Pricing:**\n" +
      "• Monthly: £20/month (auto-renews)\n" +
      "• Lifetime: £200 (one-time payment)\n\n" +
      "**🚀 Get Started:**\n" +
      "Click the button below to unlock all premium features!",
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
            [
              {
                text: "💰 View Pricing",
                callback_data: "menu_pricing",
              },
            ],
          ],
        },
      }
    );
    return;
  }

  return next();
}

