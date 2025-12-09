import dotenv from "dotenv";

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
  },
  renderExternalUrl: process.env.RENDER_EXTERNAL_URL || "",
  port: parseInt(process.env.PORT || "10000", 10),
  currency: process.env.CURRENCY || "GBP",
};

// Validate required config
if (!config.botToken) {
  throw new Error("BOT_TOKEN is required");
}
if (!config.stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required");
}
if (!config.firebase.projectId) {
  throw new Error("FIREBASE_PROJECT_ID is required");
}

