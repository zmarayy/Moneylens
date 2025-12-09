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
      "🔒 This is a premium feature. Use /buy to unlock all tools."
    );
    return;
  }

  return next();
}

