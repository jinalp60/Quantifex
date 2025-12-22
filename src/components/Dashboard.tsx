'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import StockAnalyzer from './StockAnalyzer'
import Watchlist from './Watchlist'
import { StockAnalysis } from '@/types/stock'

export default function Dashboard() {
  const { data: session } = useSession()
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watchlistRefresh, setWatchlistRefresh] = useState(0)

  const handleAnalysisComplete = (result: StockAnalysis) => {
    setAnalysis(result)
    setError(null)
    // Refresh watchlist when stock is added
    setWatchlistRefresh((prev) => prev + 1)
  }

  const handleError = (message: string) => {
    setError(message)
    setAnalysis(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Quantifex
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Stocks Analytics, Simplified by Intelligence
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                />
              )}
              <div className="text-right flex-1 sm:flex-none">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Disclaimer Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-yellow-800 text-center">
            <strong>Disclaimer:</strong> This platform provides market analysis for informational purposes only and does not constitute financial advice.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <StockAnalyzer
              onAnalysisComplete={handleAnalysisComplete}
              onError={handleError}
              loading={loading}
              setLoading={setLoading}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {analysis && (
              <div>
                <AnalysisResults analysis={analysis} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Watchlist userId={session?.user?.id} refreshTrigger={watchlistRefresh} />
          </div>
        </div>
      </main>
    </div>
  )
}

function AnalysisResults({ analysis }: { analysis: StockAnalysis }) {
  const statusColors = {
    UNDERVALUED: 'bg-green-100 text-green-800 border-green-300',
    FAIR: 'bg-blue-100 text-blue-800 border-blue-300',
    OVERVALUED: 'bg-red-100 text-red-800 border-red-300',
  }

  return (
    <div className="space-y-6">
      {/* Valuation Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Valuation Analysis: {analysis.symbol}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Current Price</p>
            <p className="text-2xl font-bold text-gray-900">
              ${analysis.currentPrice.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Intrinsic Value</p>
            <p className="text-2xl font-bold text-gray-900">
              ${analysis.intrinsicValue.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Valuation Status</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${
                statusColors[analysis.valuationStatus]
              }`}
            >
              {analysis.valuationStatus.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Analysis Summary
          </h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            {analysis.analysisSummary}
          </p>
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Technical Indicators
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analysis.technicalIndicators.sma20 && (
            <div>
              <p className="text-xs text-gray-600 mb-1">SMA 20</p>
              <p className="text-lg font-semibold text-gray-900">
                ${analysis.technicalIndicators.sma20.toFixed(2)}
              </p>
            </div>
          )}
          {analysis.technicalIndicators.sma50 && (
            <div>
              <p className="text-xs text-gray-600 mb-1">SMA 50</p>
              <p className="text-lg font-semibold text-gray-900">
                ${analysis.technicalIndicators.sma50.toFixed(2)}
              </p>
            </div>
          )}
          {analysis.technicalIndicators.sma200 && (
            <div>
              <p className="text-xs text-gray-600 mb-1">SMA 200</p>
              <p className="text-lg font-semibold text-gray-900">
                ${analysis.technicalIndicators.sma200.toFixed(2)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-600 mb-1">RSI</p>
            <p className="text-lg font-semibold text-gray-900">
              {analysis.technicalIndicators.rsi.toFixed(1)}
            </p>
          </div>
        </div>
        {analysis.technicalIndicators.volumeSpike && (
          <div className="mt-4 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠️ Volume spike detected: {analysis.technicalIndicators.volumeRatio.toFixed(1)}x average
            </p>
          </div>
        )}
      </div>

      {/* Fundamental Metrics */}
      <FundamentalsSection analysis={analysis} />

      {/* Price Movement */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Price Movement
        </h3>
        {analysis.priceMovement.periods ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['1d', '7d', '30d', '1y'] as const).map((period) => {
              const periodData = analysis.priceMovement.periods![period]
              const periodLabels = {
                '1d': '1 Day',
                '7d': '7 Days',
                '30d': '30 Days',
                '1y': '1 Year',
              }
              return (
                <div
                  key={period}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <p className="text-xs text-gray-600 mb-2">{periodLabels[period]}</p>
                  <p
                    className={`text-xl font-bold mb-1 ${
                      periodData.trend === 'up'
                        ? 'text-green-600'
                        : periodData.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {periodData.percentage > 0 ? '+' : ''}
                    {periodData.percentage.toFixed(2)}%
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    ${periodData.absolute > 0 ? '+' : ''}
                    {periodData.absolute.toFixed(2)}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Change</p>
              <p
                className={`text-2xl font-bold ${
                  analysis.priceMovement.trend === 'up'
                    ? 'text-green-600'
                    : analysis.priceMovement.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {analysis.priceMovement.percentage > 0 ? '+' : ''}
                {analysis.priceMovement.percentage.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Absolute</p>
              <p className="text-lg font-semibold text-gray-900">
                ${analysis.priceMovement.absolute > 0 ? '+' : ''}
                {analysis.priceMovement.absolute.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent News */}
      {analysis.recentNews && analysis.recentNews.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Recent News & Market Signals
          </h3>
          <div className="space-y-3">
            {analysis.recentNews.map((news, index) => (
              <a
                key={index}
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <h4 className="font-semibold text-gray-900 mb-1">
                  {news.title}
                </h4>
                {news.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {news.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{news.source}</span>
                  <span>
                    {new Date(news.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <FeedbackForm symbol={analysis.symbol} />
    </div>
  )
}

function AddToWatchlistButton({ symbol, onAdd }: { symbol: string; onAdd?: () => void }) {
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      })

      if (res.ok) {
        setAdded(true)
        onAdd?.()
        setTimeout(() => setAdded(false), 3000)
      } else {
        const data = await res.json()
        if (data.error?.includes('already')) {
          setAdded(true)
          setTimeout(() => setAdded(false), 2000)
        }
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading || added}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        added
          ? 'bg-green-100 text-green-800 border border-green-300'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } disabled:opacity-60`}
    >
      {loading ? 'Adding...' : added ? '✓ Added to Watchlist' : '+ Add to Watchlist'}
    </button>
  )
}

function FundamentalsSection({ analysis }: { analysis: StockAnalysis }) {
  const f = analysis.fundamentals
  if (!f) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Fundamental Metrics
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {f.dividendYieldPct != null && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Dividend Yield</p>
            <p className="text-lg font-semibold text-gray-900">
              {f.dividendYieldPct.toFixed(2)}%
            </p>
          </div>
        )}
        {f.dividendPerShare != null && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Dividend / Share</p>
            <p className="text-lg font-semibold text-gray-900">
              ${f.dividendPerShare.toFixed(2)}
            </p>
          </div>
        )}
        {f.peRatio != null && (
          <div>
            <p className="text-xs text-gray-600 mb-1">P/E Ratio</p>
            <p className="text-lg font-semibold text-gray-900">
              {f.peRatio.toFixed(2)}
            </p>
          </div>
        )}
        {f.forwardPE != null && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Forward P/E</p>
            <p className="text-lg font-semibold text-gray-900">
              {f.forwardPE.toFixed(2)}
            </p>
          </div>
        )}
        {f.earningsGrowth != null && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Earnings Growth</p>
            <p className="text-lg font-semibold text-gray-900">
              {f.earningsGrowth.toFixed(2)}%
            </p>
          </div>
        )}
        {f.revenueGrowth != null && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Revenue Growth</p>
            <p className="text-lg font-semibold text-gray-900">
              {f.revenueGrowth.toFixed(2)}%
            </p>
          </div>
        )}
        {f.dcfValue != null && (
          <div>
            <p className="text-xs text-gray-600 mb-1">DCF Reference Value</p>
            <p className="text-lg font-semibold text-gray-900">
              ${f.dcfValue.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {f.notes && (
        <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed">{f.notes}</p>
        </div>
      )}
    </div>
  )
}

function FeedbackForm({ symbol }: { symbol: string }) {
  const [submitted, setSubmitted] = useState(false)
  const [helpful, setHelpful] = useState<boolean | null>(null)

  const handleSubmit = async (isHelpful: boolean) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, isHelpful }),
      })

      if (response.ok) {
        setHelpful(isHelpful)
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          Thank you for your feedback!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Was this analysis helpful?
      </h3>
      <div className="flex gap-4">
        <button
          onClick={() => handleSubmit(true)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Yes, helpful
        </button>
        <button
          onClick={() => handleSubmit(false)}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Not helpful
        </button>
      </div>
    </div>
  )
}

