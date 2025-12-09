import { Context } from "telegraf";

export async function handleStreakRisk(ctx: Context): Promise<void> {
  const args = ctx.message && "text" in ctx.message
    ? ctx.message.text.split(" ").slice(1)
    : [];

  if (args.length < 2) {
    await ctx.reply(
      "📊 **Streak Risk Calculator**\n\n" +
      "**How to use:**\n" +
      "/streak_risk <streak_length> <rounds>\n\n" +
      "**Example:**\n" +
      "/streak_risk 5 200\n\n" +
      "**What it does:**\n" +
      "Calculates the probability of experiencing at least one losing streak of a specific length over a given number of rounds.\n\n" +
      "**Parameters:**\n" +
      "• streak_length - How long the streak is (e.g., 5)\n" +
      "• rounds - Total number of rounds to analyze (e.g., 200)\n\n" +
      "💡 **Tip:** This is a mathematical probability calculation for educational purposes only."
    );
    return;
  }

  const streakLength = parseInt(args[0], 10);
  const rounds = parseInt(args[1], 10);

  if (isNaN(streakLength) || isNaN(rounds) || streakLength < 1 || rounds < 1) {
    await ctx.reply(
      "❌ **Invalid Input**\n\n" +
      "Please provide valid positive numbers:\n" +
      "• Streak length must be 1 or greater\n" +
      "• Rounds must be 1 or greater\n\n" +
      "**Example:** /streak_risk 5 200"
    );
    return;
  }

  // Simplified calculation: probability of at least one streak of length L in N rounds
  // Using approximation: P ≈ 1 - (1 - 0.5^L)^(N - L + 1)
  const singleStreakProb = Math.pow(0.5, streakLength);
  const probAtLeastOne = 1 - Math.pow(1 - singleStreakProb, rounds - streakLength + 1);

  const result = `
📊 **Streak Risk Analysis Results**

**Your Input:**
• Streak Length: ${streakLength}
• Number of Rounds: ${rounds}

**📈 Result:**
The probability of experiencing at least one streak of length **${streakLength}** in **${rounds}** rounds is:

**${(probAtLeastOne * 100).toFixed(2)}%**

**📚 What This Means:**
This shows the statistical likelihood based on mathematical probability models. Each round is treated as independent, meaning past results don't affect future outcomes.

**⚠️ Important:**
This is an educational calculation only. It does not predict actual outcomes or provide gambling strategies or advice.
  `.trim();

  await ctx.reply(result, { parse_mode: "Markdown" });
}

export async function handleExpectedValue(ctx: Context): Promise<void> {
  const args = ctx.message && "text" in ctx.message
    ? ctx.message.text.split(" ").slice(1)
    : [];

  if (args.length < 4) {
    await ctx.reply(
      "Usage: /expected_value <probability> <payout> <loss> <rounds>\n\n" +
      "Example: /expected_value 0.5 2 1 100\n" +
      "Calculates expected value, variance, and provides educational interpretation."
    );
    return;
  }

  const p = parseFloat(args[0]);
  const payout = parseFloat(args[1]);
  const loss = parseFloat(args[2]);
  const rounds = parseInt(args[3], 10);

  if (
    isNaN(p) ||
    isNaN(payout) ||
    isNaN(loss) ||
    isNaN(rounds) ||
    p < 0 ||
    p > 1 ||
    rounds < 1
  ) {
    await ctx.reply(
      "Please provide valid values:\n" +
      "• probability: 0 to 1\n" +
      "• payout: positive number\n" +
      "• loss: positive number\n" +
      "• rounds: positive integer"
    );
    return;
  }

  // Expected value per round
  const evPerRound = p * payout - (1 - p) * loss;
  const evTotal = evPerRound * rounds;

  // Variance calculation
  const winOutcome = payout;
  const lossOutcome = -loss;
  const mean = evPerRound;
  const variance =
    p * Math.pow(winOutcome - mean, 2) +
    (1 - p) * Math.pow(lossOutcome - mean, 2);
  const stdDev = Math.sqrt(variance);
  const varianceTotal = variance * rounds;
  const stdDevTotal = Math.sqrt(varianceTotal);

  const result = `
📈 **Expected Value Analysis**

**Parameters:**
• Win Probability: ${(p * 100).toFixed(2)}%
• Payout (on win): ${payout}
• Loss (on loss): ${loss}
• Number of Rounds: ${rounds}

**Results:**

**Per Round:**
• Expected Value: ${evPerRound.toFixed(4)}
• Variance: ${variance.toFixed(4)}
• Standard Deviation: ${stdDev.toFixed(4)}

**Total (${rounds} rounds):**
• Expected Value: ${evTotal.toFixed(4)}
• Variance: ${varianceTotal.toFixed(4)}
• Standard Deviation: ${stdDevTotal.toFixed(4)}

**Educational Interpretation:**
Expected value represents the average outcome over many trials. A negative EV indicates a statistical disadvantage over time. Variance measures the spread of possible outcomes around the expected value. Higher variance means more volatility, but this describes statistical properties only, not actual outcomes or strategies.
  `.trim();

  await ctx.reply(result, { parse_mode: "Markdown" });
}

export async function handleVarianceModel(ctx: Context): Promise<void> {
  const args = ctx.message && "text" in ctx.message
    ? ctx.message.text.split(" ").slice(1)
    : [];

  if (args.length < 4) {
    await ctx.reply(
      "Usage: /variance_model <probability> <payout> <loss> <rounds>\n\n" +
      "Example: /variance_model 0.5 2 1 100\n" +
      "Provides detailed variance analysis and interpretation."
    );
    return;
  }

  const p = parseFloat(args[0]);
  const payout = parseFloat(args[1]);
  const loss = parseFloat(args[2]);
  const rounds = parseInt(args[3], 10);

  if (
    isNaN(p) ||
    isNaN(payout) ||
    isNaN(loss) ||
    isNaN(rounds) ||
    p < 0 ||
    p > 1 ||
    rounds < 1
  ) {
    await ctx.reply("Please provide valid values.");
    return;
  }

  const evPerRound = p * payout - (1 - p) * loss;
  const evTotal = evPerRound * rounds;

  const winOutcome = payout;
  const lossOutcome = -loss;
  const mean = evPerRound;
  const variance = p * Math.pow(winOutcome - mean, 2) + (1 - p) * Math.pow(lossOutcome - mean, 2);
  const stdDev = Math.sqrt(variance);
  const varianceTotal = variance * rounds;
  const stdDevTotal = Math.sqrt(varianceTotal);

  // Coefficient of variation
  const cv = evTotal !== 0 ? (stdDevTotal / Math.abs(evTotal)) * 100 : Infinity;

  const result = `
🔬 **Variance Model Analysis**

**Parameters:**
• Win Probability: ${(p * 100).toFixed(2)}%
• Payout: ${payout}
• Loss: ${loss}
• Rounds: ${rounds}

**Expected Return:**
• Per Round: ${evPerRound.toFixed(4)}
• Total: ${evTotal.toFixed(4)}

**Variance Metrics:**
• Variance (per round): ${variance.toFixed(4)}
• Standard Deviation (per round): ${stdDev.toFixed(4)}
• Total Variance: ${varianceTotal.toFixed(4)}
• Total Standard Deviation: ${stdDevTotal.toFixed(4)}
• Coefficient of Variation: ${cv !== Infinity ? cv.toFixed(2) + "%" : "N/A"}

**Interpretation:**
This model describes the statistical volatility of outcomes. The standard deviation indicates how much results may vary from the expected value. A higher standard deviation means greater uncertainty in outcomes. This describes volatility only, not outcomes. These are mathematical properties of the probability distribution and do not predict actual results or provide strategies.
  `.trim();

  await ctx.reply(result, { parse_mode: "Markdown" });
}

