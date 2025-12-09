import express from "express";
import { config } from "./config";
import { createBot } from "./bot";
import { handleStripeWebhook } from "./payment";

const app = express();
const bot = createBot();

// Stripe webhook endpoint (needs raw body for signature verification)
// Must be registered BEFORE express.json() middleware
app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const result = await handleStripeWebhook({
        body: req.body,
        headers: req.headers,
      });
      if (result.success) {
        res.status(200).send("OK");
      } else {
        res.status(400).send(result.message);
      }
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(500).send("Error processing webhook");
    }
  }
);

// Middleware for other routes (JSON parsing)
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Error processing webhook");
  }
});

// Start server
const PORT = config.port;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Set webhook if RENDER_EXTERNAL_URL is configured
  if (config.renderExternalUrl) {
    try {
      const webhookUrl = `${config.renderExternalUrl}/webhook`;
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`Webhook set to: ${webhookUrl}`);
    } catch (error) {
      console.error("Error setting webhook:", error);
    }
  } else {
    console.warn("RENDER_EXTERNAL_URL not set. Webhook not configured.");
    console.warn("For local development, use polling mode or set RENDER_EXTERNAL_URL.");
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

