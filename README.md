# MoneyLens - Educational Analytics Telegram Bot

MoneyLens is an educational analytics Telegram bot that provides probability modeling, casino math (purely mathematical, no strategy), risk simulations, and public crypto analytics. **All tools are for educational purposes only** and do not provide gambling advice, strategies, predictions, or financial guidance.

## Features

- 📊 **Probability & Risk Tools** - Streak risk analysis, expected value calculations, variance modeling
- 🎲 **Casino Math Tools** - Educational probability analysis for roulette, blackjack, bankroll modeling
- 📈 **Crypto Public-Data Analytics** - Token activity metrics, holder trends, sentiment analysis
- 🔬 **Advanced Simulations** - Monte Carlo modeling, variance analysis
- 💰 **Premium Gating** - Stripe payment integration via Telegram Native Payments

## Tech Stack

- **Node.js** + **TypeScript**
- **Telegraf** - Telegram bot framework
- **Firebase Firestore** - Database
- **Stripe** - Payment processing (via Telegram Native Payments)
- **Express** - Web server for webhook mode
- **Render** - Deployment platform compatible

## Project Structure

```
root/
  package.json
  tsconfig.json
  .env.example
  README.md
  src/
    index.ts                # Express server + webhook
    bot.ts                  # Bot init + command wiring
    config.ts               # Load env vars
    firebase.ts             # Firebase admin init
    payment.ts              # Stripe + Telegram payments
    accessControl.ts        # requirePremium middleware
    modules/
      start.ts              # /start message + menu
      probability.ts        # Risk + EV + streak tools
      casinoMath.ts         # Roulette + blackjack + bankroll models
      cryptoData.ts         # Public data analytics
      simulation.ts         # Monte Carlo + variance models
    types/                  # TypeScript types
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Telegram Bot Token from [@BotFather](https://t.me/botfather)
- Firebase project with Firestore enabled
- Stripe account with Telegram payment provider token
- Render account (for deployment)

### 2. Clone and Install

```bash
git clone <repository-url>
cd MoneyLens
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
BOT_TOKEN=YOUR_BOT_TOKEN
PAYMENT_PROVIDER_TOKEN=YOUR_TELEGRAM_STRIPE_PROVIDER_TOKEN
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
FIREBASE_PROJECT_ID=xxxxx
FIREBASE_CLIENT_EMAIL=xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n....\n-----END PRIVATE KEY-----"
RENDER_EXTERNAL_URL=https://your-render-url
PORT=10000
CURRENCY=GBP
```

#### Getting Your Credentials

**Telegram Bot Token:**
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` to create a bot
3. Copy the token provided

**Firebase Credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Extract `project_id`, `client_email`, and `private_key` from the JSON

**Stripe Payment Provider Token:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Settings > Payment Methods
3. Enable Telegram payments
4. Copy the provider token

**Render External URL:**
- Will be provided after deploying to Render (e.g., `https://moneylens-bot.onrender.com`)

### 4. Build the Project

```bash
npm run build
```

### 5. Run Locally (Development)

For local development, you can use polling mode or set up a webhook tunnel (e.g., using ngrok):

```bash
npm run dev
```

**Note:** For local development with webhooks, you'll need to:
1. Use a service like [ngrok](https://ngrok.com/) to create a tunnel
2. Set `RENDER_EXTERNAL_URL` to your ngrok URL
3. Or modify the code to use polling mode for local development

## Deployment to Render

### 1. Prepare for Deployment

1. Ensure all environment variables are set in your Render dashboard
2. Make sure your code is pushed to a Git repository

### 2. Create a Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" > "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name:** moneylens-bot (or your preferred name)
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free or Paid (Free has limitations)

### 3. Set Environment Variables

In Render dashboard, go to your service > Environment and add all variables from `.env`:

- `BOT_TOKEN`
- `PAYMENT_PROVIDER_TOKEN`
- `STRIPE_SECRET_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (make sure to include the full key with `\n` characters)
- `RENDER_EXTERNAL_URL` (set this to your Render service URL after deployment)
- `PORT` (Render sets this automatically, but you can override)
- `CURRENCY`

### 4. Deploy

1. Render will automatically deploy when you push to your repository
2. After first deployment, update `RENDER_EXTERNAL_URL` to your actual Render URL
3. Redeploy to set the webhook correctly

### 5. Register Webhook with BotFather

After deployment, the webhook is automatically set. You can verify it's working by:

1. Checking the Render logs for "Webhook set to: ..."
2. Testing the bot by sending `/start` command

## Available Commands

### General Commands
- `/start` - Show welcome message and menu
- `/help` - Show help message with all commands
- `/pricing` - View premium pricing
- `/buy` - Purchase premium access

### Probability Tools (Premium)
- `/streak_risk <streak> <rounds>` - Calculate streak risk probability
- `/expected_value <p> <payout> <loss> <rounds>` - Calculate EV and variance
- `/variance_model <p> <payout> <loss> <rounds>` - Advanced variance analysis

### Casino Math Tools
- `/roulette_math` - Basic roulette probability (Free)
- `/roulette_math extended <mode>` - Extended analysis (Premium)
- `/blackjack_math <total>` - Bust probability (Premium)
- `/bankroll_model <bankroll> <avgBet> <houseEdge> <rounds>` - Survival analysis (Premium)
- `/lossstreak <prob> <streak> <rounds>` - Loss streak probability (Premium)

### Crypto Analytics (Premium)
- `/token_activity <token>` - Token activity metrics
- `/holder_trend <token>` - Holder trend analysis
- `/top_activity` - Top tokens by activity
- `/sentiment <keyword>` - Sentiment analysis

### Simulations (Premium)
- `/montecarlo_model <trials>` - Monte Carlo simulation
- `/variance_model <p> <payout> <loss> <rounds>` - Variance modeling

## Database Schema

### Users Collection (`users/{telegramId}`)
```typescript
{
  telegramId: string;
  username?: string;
  isPremium: boolean;
  premiumSince?: Timestamp;
  premiumUntil?: Timestamp | null; // null for lifetime
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Payments Collection (`payments/{paymentId}`)
```typescript
{
  telegramId: string;
  amount: number;
  currency: string;
  provider: "stripe";
  status: "pending" | "successful" | "failed";
  createdAt: Timestamp;
  rawData?: any;
}
```

## Premium Plans

- **Monthly Premium:** £20.00 - 30 days access
- **Lifetime Premium:** £200.00 - Lifetime access

## Development

### Running in Development Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run type-check
```

### Building for Production

```bash
npm run build
```

## Important Notes

⚠️ **Educational Purpose Only**
- MoneyLens is designed for educational purposes only
- It does NOT provide gambling advice, strategies, predictions, or financial guidance
- All responses are mathematical/statistical/risk-education only

⚠️ **Payment Processing**
- Payments are processed through Stripe via Telegram Native Payments
- Ensure your Stripe account is properly configured
- Test payments in Stripe test mode before going live

⚠️ **Firebase Security**
- Ensure your Firebase private key is kept secure
- Never commit `.env` files to version control
- Use environment variables in production

## Troubleshooting

### Webhook Not Working
- Verify `RENDER_EXTERNAL_URL` is set correctly
- Check Render logs for webhook setup messages
- Ensure the webhook endpoint is accessible (test `/health` endpoint)

### Payment Issues
- Verify `PAYMENT_PROVIDER_TOKEN` is correct
- Check Stripe dashboard for payment status
- Ensure currency matches your Stripe account settings

### Firebase Connection Issues
- Verify all Firebase credentials are correct
- Check that Firestore is enabled in your Firebase project
- Ensure the service account has proper permissions

## License

MIT

## Support

For issues or questions, please open an issue in the repository.

