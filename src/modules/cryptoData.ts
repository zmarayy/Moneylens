import { Context } from "telegraf";

// Mock data for demonstration - in production, replace with actual API calls
const MOCK_TOKEN_DATA: Record<string, any> = {
  BTC: {
    volume24h: 28500000000,
    holderCountDelta: 1250,
    activityScore: 0.85,
  },
  ETH: {
    volume24h: 15200000000,
    holderCountDelta: 3200,
    activityScore: 0.78,
  },
  SOL: {
    volume24h: 3200000000,
    holderCountDelta: 8900,
    activityScore: 0.92,
  },
};

const MOCK_TOP_TOKENS = [
  { token: "BTC", volume24h: 28500000000, activityScore: 0.85 },
  { token: "ETH", volume24h: 15200000000, activityScore: 0.78 },
  { token: "SOL", volume24h: 3200000000, activityScore: 0.92 },
  { token: "BNB", volume24h: 1800000000, activityScore: 0.71 },
  { token: "ADA", volume24h: 450000000, activityScore: 0.65 },
];

export async function handleTokenActivity(ctx: Context): Promise<void> {
  const args = ctx.message && "text" in ctx.message
    ? ctx.message.text.split(" ").slice(1)
    : [];

  if (args.length < 1) {
    await ctx.reply(
      "Usage: /token_activity <token_symbol>\n\n" +
      "Example: /token_activity BTC\n" +
      "Shows 24h volume, holder count delta, and activity score."
    );
    return;
  }

  const token = args[0].toUpperCase();
  const data = MOCK_TOKEN_DATA[token];

  if (!data) {
    await ctx.reply(
      `Token "${token}" not found in database.\n\n` +
      `Available tokens: ${Object.keys(MOCK_TOKEN_DATA).join(", ")}\n\n` +
      `Note: This is a demonstration. In production, this would fetch real-time data from public APIs.`
    );
    return;
  }

  const volumeFormatted = formatCurrency(data.volume24h);

  const result = `
📊 **Token Activity: ${token}**

**24-Hour Metrics:**
• Trading Volume: ${volumeFormatted}
• Holder Count Delta: ${data.holderCountDelta > 0 ? "+" : ""}${data.holderCountDelta.toLocaleString()}
• Activity Score: ${(data.activityScore * 100).toFixed(1)}/100

**Activity Score Interpretation:**
The activity score is a derived metric combining volume, holder changes, and transaction frequency. Higher scores indicate increased market activity.

**Educational Note:**
This data is for informational and educational purposes only. It does not constitute financial advice, investment recommendations, or predictions about future price movements.
  `.trim();

  await ctx.reply(result, { parse_mode: "Markdown" });
}

export async function handleHolderTrend(ctx: Context): Promise<void> {
  const args = ctx.message && "text" in ctx.message
    ? ctx.message.text.split(" ").slice(1)
    : [];

  if (args.length < 1) {
    await ctx.reply(
      "Usage: /holder_trend <token_symbol>\n\n" +
      "Example: /holder_trend BTC\n" +
      "Shows holder trend: up, down, or flat."
    );
    return;
  }

  const token = args[0].toUpperCase();
  const data = MOCK_TOKEN_DATA[token];

  if (!data) {
    await ctx.reply(
      `Token "${token}" not found.\n\n` +
      `Available: ${Object.keys(MOCK_TOKEN_DATA).join(", ")}`
    );
    return;
  }

  let trend: string;
  let emoji: string;
  if (data.holderCountDelta > 100) {
    trend = "UP";
    emoji = "📈";
  } else if (data.holderCountDelta < -100) {
    trend = "DOWN";
    emoji = "📉";
  } else {
    trend = "FLAT";
    emoji = "➡️";
  }

  const result = `
📈 **Holder Trend: ${token}**

**Trend:** ${emoji} ${trend}

**Details:**
• 24h Holder Change: ${data.holderCountDelta > 0 ? "+" : ""}${data.holderCountDelta.toLocaleString()}

**Educational Note:**
Holder count changes reflect net changes in unique addresses holding the token. This is public on-chain data and does not indicate price direction or investment value.
  `.trim();

  await ctx.reply(result, { parse_mode: "Markdown" });
}

export async function handleTopActivity(ctx: Context): Promise<void> {
  const result = `
🏆 **Top Tokens by 24h Activity**

${MOCK_TOP_TOKENS.map((t, i) => 
  `${i + 1}. **${t.token}**\n   • Volume: ${formatCurrency(t.volume24h)}\n   • Activity Score: ${(t.activityScore * 100).toFixed(1)}/100`
).join("\n\n")}

**Educational Note:**
Rankings are based on 24-hour trading volume and activity metrics. This is public market data for informational purposes only and does not constitute investment advice.
  `.trim();

  await ctx.reply(result, { parse_mode: "Markdown" });
}

export async function handleSentiment(ctx: Context): Promise<void> {
  const args = ctx.message && "text" in ctx.message
    ? ctx.message.text.split(" ").slice(1)
    : [];

  if (args.length < 1) {
    await ctx.reply(
      "Usage: /sentiment <keyword>\n\n" +
      "Example: /sentiment bitcoin\n" +
      "Shows mention count and sentiment analysis from public sources."
    );
    return;
  }

  const keyword = args.join(" ").toLowerCase();
  
  // Mock sentiment data
  const mockMentions = Math.floor(Math.random() * 50000) + 1000;
  const mockSentiment = (Math.random() * 0.4 + 0.3).toFixed(2); // 0.3 to 0.7

  const result = `
💬 **Sentiment Analysis: ${keyword}**

**Public Mentions (24h):**
• Mention Count: ${mockMentions.toLocaleString()}

**Sentiment Score:**
• Score: ${mockSentiment}/1.0
  ${parseFloat(mockSentiment) > 0.6 ? "🟢 Positive" : parseFloat(mockSentiment) < 0.4 ? "🔴 Negative" : "🟡 Neutral"}

**Educational Note:**
Sentiment analysis is derived from public mentions and social media data. This is informational only and does not predict price movements or provide investment guidance.
  `.trim();

  await ctx.reply(result, { parse_mode: "Markdown" });
}

function formatCurrency(value: number): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

