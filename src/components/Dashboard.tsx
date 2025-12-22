'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import StockAnalyzer from './StockAnalyzer'
import { StockAnalysis } from '@/types/stock'

export default function Dashboard() {
  const { data: session } = useSession()
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalysisComplete = (result: StockAnalysis) => {
    setAnalysis(result)
    setError(null)
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Stock Analysis Platform
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Professional market analysis and valuation
              </p>
            </div>
            <div className="flex items-center gap-4">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
        <StockAnalyzer
          onAnalysisComplete={handleAnalysisComplete}
          onError={handleError}
          loading={loading}
          setLoading={setLoading}
        />

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="mt-8">
            <AnalysisResults analysis={analysis} />
          </div>
        )}
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
          Recent Price Movement
        </h3>
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

