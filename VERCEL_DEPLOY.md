# Deploying to Vercel - Step by Step Guide

## Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- PostgreSQL database (Neon, Supabase, or Railway recommended)

## Step 1: Push Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub repository**:
   - Go to https://github.com/new
   - Create a new repository (e.g., `stock-analysis-platform`)
   - **Don't** initialize with README

3. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/stock-analysis-platform.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Set Up PostgreSQL Database

### Option A: Neon (Recommended - Free Tier)
1. Go to https://neon.tech
2. Sign up and create a new project
3. Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)

### Option B: Supabase
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the connection string

### Option C: Railway
1. Go to https://railway.app
2. Create a new PostgreSQL database
3. Copy the connection string

## Step 3: Deploy to Vercel

1. **Go to Vercel Dashboard**:
   - Visit https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Your Repository**:
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**:
   Click "Environment Variables" and add:

   ```
   DATABASE_URL=postgresql://user:pass@host/dbname
   NEXTAUTH_URL=https://your-app-name.vercel.app
   NEXTAUTH_SECRET=your-secret-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ALPHA_VANTAGE_API_KEY=your-key-optional
   NEWS_API_KEY=your-key-optional
   CACHE_TTL_HOURS=24
   ```

   **Important Notes**:
   - Generate `NEXTAUTH_SECRET`: Run `openssl rand -base64 32` locally
   - `NEXTAUTH_URL` should be your Vercel deployment URL (you'll get this after first deploy)
   - For first deploy, use a placeholder like `https://your-app.vercel.app` then update after

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)

## Step 4: Set Up Database Schema

After first deployment:

1. **Get your production DATABASE_URL** from Vercel environment variables

2. **Run Prisma migrations locally** (temporarily use production DB):
   ```bash
   # Set production database URL
   $env:DATABASE_URL="postgresql://user:pass@host/dbname"
   
   # Generate Prisma Client
   npm run db:generate
   
   # Push schema to production database
   npm run db:push
   ```

   Or use Prisma Migrate:
   ```bash
   npx prisma migrate deploy
   ```

## Step 5: Update Google OAuth Settings

1. **Go to Google Cloud Console**:
   - https://console.cloud.google.com
   - Navigate to your OAuth credentials

2. **Add Production Redirect URI**:
   - Add: `https://your-app-name.vercel.app/api/auth/callback/google`
   - Save changes

3. **Update NEXTAUTH_URL in Vercel**:
   - Go to Vercel → Project Settings → Environment Variables
   - Update `NEXTAUTH_URL` with your actual Vercel URL
   - Redeploy (or it will auto-redeploy on next push)

## Step 6: Verify Deployment

1. **Visit your Vercel URL**: `https://your-app-name.vercel.app`

2. **Test the application**:
   - Sign up with email/password
   - Or sign in with Google
   - Analyze a stock (e.g., AAPL, MSFT)

3. **Check logs** (if issues):
   - Vercel Dashboard → Your Project → Deployments → Click deployment → Logs

## Troubleshooting

### Build Fails
- Check Vercel build logs for specific errors
- Ensure all environment variables are set
- Verify `package.json` has `postinstall` script for Prisma

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check database allows connections from Vercel IPs
- Ensure database is running

### OAuth Errors
- Verify redirect URI matches exactly in Google Console
- Check `NEXTAUTH_URL` matches your Vercel domain
- Ensure `NEXTAUTH_SECRET` is set

### API Routes Not Working
- Check that all API routes have `export const dynamic = 'force-dynamic'`
- Verify environment variables are set correctly

## Post-Deployment Checklist

- [ ] Database schema is applied (`prisma db push`)
- [ ] All environment variables are set
- [ ] Google OAuth redirect URI is updated
- [ ] `NEXTAUTH_URL` matches Vercel domain
- [ ] Test signup/login works
- [ ] Test stock analysis works
- [ ] Check Vercel logs for any errors

## Continuous Deployment

After initial setup:
- Every push to `main` branch will auto-deploy
- Pull requests create preview deployments
- No manual deployment needed!

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Prisma on Vercel: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel

