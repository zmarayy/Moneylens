import { Context } from "telegraf";

export async function handleRouletteMath(ctx: Context): Promise<void> {
  const args = ctx.message && "text" in ctx.message
    ? ctx.message.text.split(" ").slice(1)
    : [];

  if (args.length === 0) {
    // Free basic version
    const result = `
🎲 **Roulette Math (European Wheel)** 🆓

**Basic Probability:**
• Red/Black: 18/37 ≈ 48.65%
• Even/Odd: 18/37 ≈ 48.65%
• High/Low (1-18 / 19-36): 18/37 ≈ 48.65%
• Single Number: 1/37 ≈ 2.70%

**House Edge:**
• European Roulette: 2.70% (1/37)
• This means the casino has a statistical advantage of 2.70% on even-money bets

**📚 Educational Note:**
Each spin is independent. The probability of red or black is always 18/37 on a European wheel (which has one green zero). The house edge comes from the zero pocket, which doesn't pay out on red/black bets.

**🔓 Want More?**
For extended analysis with specific bet types and expected value calculations, try:
\`/roulette_math extended <mode>\`
Available modes: red, black, even, odd, high, low, straight, split, street

**⚠️ Important:**
This is mathematical information only and does not provide gambling strategies or advice.
    `.trim();

    await ctx.reply(result, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔓 Get Premium for Extended Analysis",
              callback_data: "buy_monthly",
            },
          ],
        ],
      },
    });
    return;
  }

  if (args[0] === "extended" && args.length >= 2) {
    // Premium extended version
    const betType = args[1].toLowerCase();
    let prob = 0;
    let payout = 0;
    let betName = "";

    switch (betType) {
      case "red":
      case "black":
        prob = 18 / 37;
        payout = 1; // 1:1
        betName = "Red/Black";
        break;
      case "even":
      case "odd":
        prob = 18 / 37;
        payout = 1;
        betName = "Even/Odd";
        break;
      case "high":
      case "low":
        prob = 18 / 37;
        payout = 1;
        betName = "High (19-36) / Low (1-18)";
        break;
      case "straight":
        prob = 1 / 37;
        payout = 35; // 35:1
        betName = "Single Number";
        break;
      case "split":
        prob = 2 / 37;
        payout = 17; // 17:1
        betName = "Split (2 numbers)";
        break;
      case "street":
        prob = 3 / 37;
        payout = 11; // 11:1
        betName = "Street (3 numbers)";
        break;
      default:
        await ctx.reply(
          "Available bet types: red, black, even, odd, high, low, straight, split, street"
        );
        return;
    }

    const ev = prob * payout - (1 - prob) * 1; // Assuming 1 unit bet
    const expectedLoss = -ev;

    const result = `
🎲 **Extended Roulette Analysis**

**Bet Type:** ${betName}
**Probability of Win:** ${(prob * 100).toFixed(2)}%
**Payout Ratio:** ${payout}:1

**Expected Value (per unit bet):**
• EV: ${ev.toFixed(4)}
• Expected Loss: ${expectedLoss.toFixed(4)} units per bet

**House Edge:**
• European Wheel: 2.70% (1/37)

**Educational Note:**
This shows the mathematical expected value of this bet type. A negative EV indicates a statistical disadvantage. This is probability analysis only and does not provide gambling strategies or advice.
    `.trim();

    await ctx.reply(result, { parse_mode: "Markdown" });
  } else {
    await ctx.reply(
      "Usage: /roulette_math - Basic info (free)\n" +
      "/roulette_math extended <bet_type> - Extended analysis (premium)\n\n" +
      "Bet types: red, black, even, odd, high, low, straight, split, street"
    );
  }
}

export async function handleBlackjackMath(ctx: Context): Promise<void> {
  const args = ctx.message && "text" in ctx.message
    ? ctx.message.text.split(" ").slice(1)
    : [];

  if (args.length < 1) {
    await ctx.reply(
      "Usage: /blackjack_math <total>\n\n" +
      "Example: /blackjack_math 15\n" +
      "Calculates the probability of busting when hitting on a given total."
    );
    return;
  }

  const total = parseInt(args[0], 10);

  if (isNaN(total) || total < 4 || total > 20) {
    await ctx.reply("Please provide a valid total between 4 and 20.");
    return;
  }

  // Simplified bust probability calculation
  // Assuming infinite deck (each card has equal probability)
  // Cards 2-10 have value equal to face, J/Q/K = 10, A = 1 or 11
  // For bust calculation, we need to go over 21
  const cards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]; // A, 2-9, 10, J, Q, K
  const needed = 22 - total; // Minimum card value that would cause bust

  let bustCount = 0;
  for (const card of cards) {
    if (card >= needed) {
      bustCount++;
    }
  }

  const bustProb = bustCount / cards.length;

  const result = `
🃏 **Blackjack Bust Probability**

**Current Total:** ${total}

**Probability of Bust (on next hit):**
• Bust Probability: ${(bustProb * 100).toFixed(2)}%
• Safe Probability: ${((1 - bustProb) * 100).toFixed(2)}%

**Calculation Method:**
This uses a simplified model assuming equal probability for all card values (2-10, face cards = 10, Ace = 1 or 11). In actual play, card counting and deck composition affect probabilities.

**Educational Note:**
This is a mathematical probability calculation based on simplified assumptions. Actual blackjack probabilities vary based on deck composition, dealer's up card, and game rules. This does not provide gambling strategies or advice.
  `.trim();

  await ctx.reply(result, { parse_mode: "Markdown" });
}

export async function handleBankrollModel(ctx: Context): Promise<void> {
  const args = ctx.message && "text" in ctx.message
    ? ctx.message.text.split(" ").slice(1)
    : [];

  if (args.length < 4) {
    await ctx.reply(
      "Usage: /bankroll_model <bankroll> <avgBet> <houseEdge> <rounds>\n\n" +
      "Example: /bankroll_model 1000 10 0.027 100\n" +
      "Shows statistical survival estimate and expected loss distribution."
    );
    return;
  }

  const bankroll = parseFloat(args[0]);
  const avgBet = parseFloat(args[1]);
  const houseEdge = parseFloat(args[2]);
  const rounds = parseInt(args[3], 10);

  if (
    isNaN(bankroll) ||
    isNaN(avgBet) ||
    isNaN(houseEdge) ||
    isNaN(rounds) ||
    bankroll <= 0 ||
    avgBet <= 0 ||
    houseEdge < 0 ||
    houseEdge > 1 ||
    rounds < 1
  ) {
    await ctx.reply("Please provide valid positive values. House edge should be 0-1 (e.g., 0.027 for 2.7%).");
    return;
  }

  const expectedLossPerRound = avgBet * houseEdge;
  const expectedLossTotal = expectedLossPerRound * rounds;
  const expectedBankrollAfter = bankroll - expectedLossTotal;

  // Simplified survival probability (using normal approximation)
  // This is a rough estimate
  const variancePerRound = avgBet * avgBet * 0.25; // Simplified variance
  const stdDevTotal = Math.sqrt(variancePerRound * rounds);
  const zScore = bankroll / stdDevTotal;
  // Rough survival probability (simplified)
  const survivalProb = Math.max(0, Math.min(1, 1 - Math.exp(-zScore * 0.5)));

  const result = `
💰 **Bankroll Model Analysis**

**Parameters:**
• Starting Bankroll: ${bankroll}
• Average Bet: ${avgBet}
• House Edge: ${(houseEdge * 100).toFixed(2)}%
• Number of Rounds: ${rounds}

**Expected Results:**
• Expected Loss per Round: ${expectedLossPerRound.toFixed(2)}
• Expected Total Loss: ${expectedLossTotal.toFixed(2)}
• Expected Bankroll After: ${expectedBankrollAfter.toFixed(2)}

**Statistical Survival Estimate:**
• Approximate Survival Probability: ${(survivalProb * 100).toFixed(2)}%

**Educational Note:**
This model provides statistical estimates based on expected value calculations. Actual outcomes will vary significantly due to variance. The survival probability is a rough approximation and does not account for all factors. This is educational analysis only and does not provide gambling strategies or bankroll management advice.
  `.trim();

  await ctx.reply(result, { parse_mode: "Markdown" });
}

export async function handleLossStreak(ctx: Context): Promise<void> {
  const args = ctx.message && "text" in ctx.message
    ? ctx.message.text.split(" ").slice(1)
    : [];

  if (args.length < 3) {
    await ctx.reply(
      "Usage: /lossstreak <loss_probability> <streak_length> <rounds>\n\n" +
      "Example: /lossstreak 0.52 5 200\n" +
      "Calculates the probability of experiencing a losing streak of the specified length."
    );
    return;
  }

  const lossProb = parseFloat(args[0]);
  const streakLength = parseInt(args[1], 10);
  const rounds = parseInt(args[2], 10);

  if (
    isNaN(lossProb) ||
    isNaN(streakLength) ||
    isNaN(rounds) ||
    lossProb < 0 ||
    lossProb > 1 ||
    streakLength < 1 ||
    rounds < 1
  ) {
    await ctx.reply(
      "Please provide valid values:\n" +
      "• loss_probability: 0 to 1\n" +
      "• streak_length: positive integer\n" +
      "• rounds: positive integer"
    );
    return;
  }

  // Probability of a single streak of the given length
  const singleStreakProb = Math.pow(lossProb, streakLength);
  // Probability of at least one such streak in N rounds
  const probAtLeastOne = 1 - Math.pow(1 - singleStreakProb, rounds - streakLength + 1);

  const result = `
📉 **Loss Streak Probability**

**Parameters:**
• Loss Probability per Round: ${(lossProb * 100).toFixed(2)}%
• Streak Length: ${streakLength}
• Number of Rounds: ${rounds}

**Results:**
• Probability of Single Streak: ${(singleStreakProb * 100).toFixed(4)}%
• Probability of At Least One Streak: ${(probAtLeastOne * 100).toFixed(2)}%

**Educational Note:**
This calculates the statistical probability of encountering a losing streak of a given length, assuming independent rounds with a constant loss probability. This is a mathematical probability model only and does not predict actual outcomes or provide gambling strategies.
  `.trim();

  await ctx.reply(result, { parse_mode: "Markdown" });
}

