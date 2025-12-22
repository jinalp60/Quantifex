# Quick Start Guide

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File

Create a `.env` file in the root directory with these variables:

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://username:password@localhost:5432/stock_analysis?schema=public"

# NextAuth (REQUIRED)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Google OAuth (REQUIRED for authentication)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# External APIs (OPTIONAL - app will work without these)
ALPHA_VANTAGE_API_KEY=your-key-here
NEWS_API_KEY=your-key-here

# Settings (OPTIONAL - defaults provided in code)
CACHE_TTL_HOURS=24
```

### 3. Generate NextAuth Secret

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in your `.env` file.

### 4. Set Up PostgreSQL Database

**Option A: Local PostgreSQL**
1. Install PostgreSQL if not already installed
2. Create a database:
   ```sql
   CREATE DATABASE stock_analysis;
   ```
3. Update `DATABASE_URL` in `.env` with your credentials

**Option B: Cloud Database (Free)**
- Use [Supabase](https://supabase.com) (free tier available)
- Use [Neon](https://neon.tech) (free tier available)
- Copy the connection string to `DATABASE_URL`

### 5. Set Up Google OAuth (Required for Login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google+ API** (or Google Identity API)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret** to your `.env` file

### 6. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Create database tables
npm run db:push
```

### 7. Run the Application

```bash
npm run dev
```

The app will start at: **http://localhost:3000**

### 8. Test the Application

1. Open http://localhost:3000 in your browser
2. You'll be redirected to the sign-in page
3. Click "Sign in with Google"
4. After authentication, you'll see the dashboard
5. Enter a stock symbol (e.g., AAPL, MSFT, GOOGL) and click "Analyze"

## Minimum Required Setup

To get the app running with minimal setup:

1. ✅ Install dependencies: `npm install`
2. ✅ Create `.env` with:
   - `DATABASE_URL` (PostgreSQL connection)
   - `NEXTAUTH_URL=http://localhost:3000`
   - `NEXTAUTH_SECRET` (generated secret)
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. ✅ Run database setup: `npm run db:generate && npm run db:push`
4. ✅ Start server: `npm run dev`

**Note:** The app will work without `ALPHA_VANTAGE_API_KEY` and `NEWS_API_KEY`, but stock data fetching may be limited. The yfinance library should work for basic functionality.

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
npm run db:generate
```

### Database connection errors
- Verify PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
- Ensure database exists

### OAuth errors
- Verify redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- Check `NEXTAUTH_URL` matches your app URL
- Ensure Google OAuth credentials are correct

### Port already in use
```bash
# Use a different port
PORT=3001 npm run dev
```

## Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio (database GUI)
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [SETUP.md](SETUP.md) for additional setup options
- Review API documentation in README for integration details



