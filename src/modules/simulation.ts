import { Context } from "telegraf";

export async function handleMonteCarloModel(ctx: Context): Promise<void> {
  const args = ctx.message && "text" in ctx.message
    ? ctx.message.text.split(" ").slice(1)
    : [];

  if (args.length < 1) {
    await ctx.reply(
      "Usage: /montecarlo_model <trials>\n\n" +
      "Example: /montecarlo_model 10000\n" +
      "Runs a Monte Carlo random walk simulation and returns statistical summary."
    );
    return;
  }

  const trials = parseInt(args[0], 10);

  if (isNaN(trials) || trials < 100 || trials > 1000000) {
    await ctx.reply(
      "Please provide a valid number of trials (100 to 1,000,000).\n" +
      "More trials provide more accurate results but take longer to compute."
    );
    return;
  }

  // Monte Carlo simulation: random walk
  // Each step: +1 with probability 0.5, -1 with probability 0.5
  const results: number[] = [];

  for (let i = 0; i < trials; i++) {
    let position = 0;
    const steps = 100; // Number of steps in each walk

    for (let j = 0; j < steps; j++) {
      position += Math.random() < 0.5 ? 1 : -1;
    }

    results.push(position);
  }

  // Calculate statistics
  const mean = results.reduce((a, b) => a + b, 0) / results.length;
  const variance =
    results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    results.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...results);
  const max = Math.max(...results);

  // Distribution summary (percentiles)
  const sorted = [...results].sort((a, b) => a - b);
  const p25 = sorted[Math.floor(sorted.length * 0.25)];
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];

  const result = `
🎲 **Monte Carlo Simulation Results**

**Simulation Parameters:**
• Number of Trials: ${trials.toLocaleString()}
• Steps per Trial: 100
• Step Distribution: ±1 with equal probability

**Statistical Summary:**
• Mean: ${mean.toFixed(4)}
• Standard Deviation: ${stdDev.toFixed(4)}
• Variance: ${variance.toFixed(4)}
• Minimum: ${min}
• Maximum: ${max}

**Distribution Percentiles:**
• 25th Percentile: ${p25}
• 50th Percentile (Median): ${p50}
• 75th Percentile: ${p75}

**Educational Note:**
This Monte Carlo simulation demonstrates a random walk process. The results show the distribution of outcomes over many trials. This is a mathematical modeling tool for educational purposes and does not predict actual outcomes or provide strategies.
  `.trim();

  await ctx.reply(result, { parse_mode: "Markdown" });
}

