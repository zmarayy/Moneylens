# Render Deployment Guide

## Step-by-Step Instructions

### 1. Connect Repository
- Push your code to GitHub/GitLab/Bitbucket
- In Render, connect your repository

### 2. Create Web Service
- Click "New +" → **"Web Service"**
- Select your repository

### 3. Configure Service Settings

**Basic Settings:**
- **Name:** `moneylens-bot` (or your preferred name)
- **Region:** Choose closest to you
- **Branch:** `main` (or `master`)

**Build & Deploy:**
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Plan:**
- Choose **Free** (for testing) or **Starter** ($7/month) for production

### 4. Set Environment Variables

Go to **Environment** tab and add these variables:

```
BOT_TOKEN=YOUR_BOT_TOKEN_HERE

STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE

FIREBASE_PROJECT_ID=your-firebase-project-id

FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

CURRENCY=GBP

PORT=10000
```

**IMPORTANT:** 
- For `FIREBASE_PRIVATE_KEY`, copy the ENTIRE value including the quotes and `\n` characters
- Render will automatically set `PORT`, but you can override it
- **DO NOT** set `RENDER_EXTERNAL_URL` yet - we'll do that after deployment

### 5. Deploy

Click **"Create Web Service"** and wait for deployment.

### 6. Get Your Render URL

After deployment completes:
- Your service URL will be: `https://moneylens-bot.onrender.com` (or similar)
- Copy this URL

### 7. Set RENDER_EXTERNAL_URL

1. Go to **Environment** tab
2. Add new variable:
   ```
   RENDER_EXTERNAL_URL=https://your-service-name.onrender.com
   ```
   (Replace with your actual Render URL)
3. Click **"Save Changes"**
4. Service will automatically redeploy

### 8. Verify Deployment

1. Check **Logs** tab - you should see:
   - "Server running on port 10000"
   - "Webhook set to: https://your-url.onrender.com/webhook"

2. Test your bot:
   - Send `/start` to your bot on Telegram
   - It should respond with the welcome message

### 9. Set Up Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://your-render-url.onrender.com/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **"Signing secret"** (starts with `whsec_`)
7. Add to Render Environment Variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```
8. Save and redeploy

## Troubleshooting

- **Build fails:** Check logs for errors, ensure all dependencies are in package.json
- **Bot not responding:** Check logs, verify BOT_TOKEN is correct
- **Webhook not working:** Verify RENDER_EXTERNAL_URL is set correctly
- **Stripe webhook fails:** Check STRIPE_WEBHOOK_SECRET is set correctly

