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
      "This tool is available for premium users only.\n\n" +
      "**What you get with Premium:**\n" +
      "✅ All probability & risk tools\n" +
      "✅ Extended casino math analysis\n" +
      "✅ Crypto analytics & insights\n" +
      "✅ Advanced simulations\n\n" +
      "**Get Premium:**\n" +
      "Type /buy to see pricing and purchase premium access.\n\n" +
      "💡 Tip: Some features are free! Try /roulette_math to get started."
    );
    return;
  }

  return next();
}

