# Quick Setup Guide

## 1. Install Dependencies
```bash
npm install
```

## 2. Environment Setup

Copy the example environment file and fill in your values:
```bash
# Create .env file with these variables:
DATABASE_URL="postgresql://user:password@localhost:5432/stock_analysis"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
ALPHA_VANTAGE_API_KEY="your-key-optional"
NEWS_API_KEY="your-key-optional"
```

## 3. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Create database tables
npm run db:push
```

## 4. Run Development Server

```bash
npm run dev
```

## 5. Access Application

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/Select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

## Troubleshooting

- **Database errors**: Ensure PostgreSQL is running and `DATABASE_URL` is correct
- **OAuth errors**: Verify redirect URI matches exactly
- **API errors**: Check API keys are valid (optional for basic functionality)

