# Stock Analysis Platform

A production-ready stock market analysis platform that provides comprehensive stock valuation, technical analysis, and market insights. This platform analyzes public stock data only and does not manage user portfolios or provide investment advice.

## Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with Google
- 📊 **Stock Analysis** - Comprehensive valuation analysis (Undervalued/Fair/Overvalued)
- 📈 **Technical Indicators** - SMA (20, 50, 200), RSI, Volume analysis
- 📰 **News Correlation** - Recent news and market signals
- 💾 **Intelligent Caching** - 24-hour cache for stock data and news
- ⚡ **Rate Limiting** - 10 analyses per user per day
- 📝 **User Feedback** - Track analysis helpfulness
- 📊 **Analytics** - Track user searches and behavior

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Server Components**

### Backend
- **Next.js API Routes**
- **Node.js**
- **Service-layer architecture**

### Database
- **PostgreSQL**
- **Prisma ORM**

### Authentication
- **NextAuth.js**
- **Google OAuth 2.0**

### External APIs
- **yfinance** (Primary) / **Alpha Vantage** (Fallback) - Stock prices
- **NewsAPI** - Market news

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials
- Alpha Vantage API key (optional, fallback)
- NewsAPI key (optional)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stock-analysis-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/stock_analysis?schema=public"

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # External APIs
   ALPHA_VANTAGE_API_KEY=your-alpha-vantage-api-key
   NEWS_API_KEY=your-newsapi-key

   # Rate Limiting
   CACHE_TTL_HOURS=24
   ```

4. **Generate NextAuth secret**
   ```bash
   openssl rand -base64 32
   ```

5. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Client Secret to `.env`

6. **Set up database**
   ```bash
   # Generate Prisma Client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Or run migrations
   npm run db:migrate
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth routes
│   │   ├── stocks/
│   │   │   ├── analyze/            # POST - Analyze stock
│   │   │   └── [symbol]/
│   │   │       ├── history/        # GET - Stock history
│   │   │       └── news/           # GET - Stock news
│   │   └── feedback/               # POST - User feedback
│   ├── auth/signin/                # Sign-in page
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page
│   └── providers.tsx               # Session provider
├── components/
│   ├── Dashboard.tsx               # Main dashboard
│   └── StockAnalyzer.tsx           # Analysis form
├── lib/
│   ├── auth/
│   │   └── config.ts               # NextAuth configuration
│   ├── db/
│   │   └── prisma.ts               # Prisma client
│   ├── stocks/
│   │   ├── cache.ts                # Stock data caching
│   │   └── yfinance.ts             # Stock data fetching
│   ├── news/
│   │   ├── cache.ts                # News caching
│   │   └── newsapi.ts              # News fetching
│   ├── valuation/
│   │   ├── indicators.ts           # Technical indicators
│   │   └── analyzer.ts             # Valuation engine
│   ├── rate-limit/
│   │   └── rateLimit.ts            # Rate limiting
│   └── analytics/
│       └── tracker.ts              # Analytics tracking
├── types/
│   ├── next-auth.d.ts              # NextAuth type extensions
│   └── stock.ts                    # Stock types
└── utils/
    ├── errors.ts                   # Error handling
    └── logger.ts                   # Structured logging
```

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth authentication

### Stock Analysis
- `POST /api/stocks/analyze`
  ```json
  {
    "symbol": "AAPL"
  }
  ```
  Returns: Complete stock analysis with valuation, indicators, and news

- `GET /api/stocks/:symbol/history?days=7`
  Returns: Historical price data

- `GET /api/stocks/:symbol/news?limit=10`
  Returns: Recent news articles

### Feedback
- `POST /api/feedback`
  ```json
  {
    "symbol": "AAPL",
    "isHelpful": true
  }
  ```

## Stock Analysis Engine

The platform uses a deterministic, explainable analysis approach:

### Technical Indicators
- **SMA (Simple Moving Average)**: 20, 50, 200-day periods
- **RSI (Relative Strength Index)**: Momentum indicator
- **Volume Analysis**: Spike detection and ratio calculation

### Valuation Method
- Simplified DCF (Discounted Cash Flow) approach
- Relative valuation using moving averages
- RSI-based adjustments
- Price momentum considerations

### Output
- **Valuation Status**: UNDERVALUED | FAIR | OVERVALUED
- **Intrinsic Value**: Calculated fair value
- **Analysis Summary**: Human-readable explanation
- **Recent Price Movement**: 3-7 day trend analysis
- **News Correlation**: Related market news

## Caching Strategy

- **Stock Data**: Cached for 24 hours in PostgreSQL
- **News Data**: Cached in-memory for 24 hours
- **Analysis Results**: Stored in database for rate limit fallback

## Rate Limiting

- **Limit**: 10 analyses per user per day
- **Reset**: Daily at midnight (user timezone)
- **Fallback**: Returns cached analysis if limit exceeded

## Security Features

- ✅ Environment-based secrets
- ✅ OAuth state validation (NextAuth)
- ✅ CSRF protection (NextAuth)
- ✅ API rate limiting
- ✅ Input validation (Zod)
- ✅ SQL injection protection (Prisma)
- ✅ Authentication middleware

## Disclaimer

**This platform provides market analysis for informational purposes only and does not constitute financial advice.**

The analysis is based on publicly available data and technical indicators. Users should conduct their own research and consult with financial advisors before making investment decisions.

## Development

### Database Management
```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

### Building for Production
```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Yes |
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage API key | No (fallback) |
| `NEWS_API_KEY` | NewsAPI key | No (optional) |
| `CACHE_TTL_HOURS` | Cache TTL in hours | No (default: 24) |

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

1. Build the application: `npm run build`
2. Set environment variables
3. Run migrations: `npm run db:migrate`
4. Start server: `npm start`

## Cost Optimization

This platform is optimized for $0 deployment and low API usage:

- **Caching**: Reduces external API calls by 90%+
- **Rate Limiting**: Prevents excessive usage
- **Fallback APIs**: Graceful degradation
- **Single-stock focus**: Simplified architecture

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database permissions

### OAuth Issues
- Verify redirect URI matches Google Console
- Check `NEXTAUTH_URL` matches deployment URL
- Ensure `NEXTAUTH_SECRET` is set

### API Errors
- Check API keys are valid
- Verify rate limits not exceeded
- Check network connectivity

## License

This project is proprietary software. All rights reserved.

## Support

For issues and questions, please contact the development team.
