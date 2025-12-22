'use client'

import { useState, useEffect } from 'react'
import { StockAnalysis } from '@/types/stock'

interface WatchlistItem {
  id: string
  symbol: string
  createdAt: string
}

interface WatchlistProps {
  userId: string | undefined
  refreshTrigger?: number
}

export default function Watchlist({ userId, refreshTrigger }: WatchlistProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [analyses, setAnalyses] = useState<Record<string, StockAnalysis>>({})
  const [loadingSymbols, setLoadingSymbols] = useState<Set<string>>(new Set())

  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/watchlist')
      if (res.ok) {
        const data = await res.json()
        setWatchlist(data.watchlist || [])
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchWatchlist()
    }
  }, [userId, refreshTrigger])

  const toggleExpand = async (symbol: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol)
    } else {
      newExpanded.add(symbol)
      // Fetch analysis if not already loaded
      if (!analyses[symbol]) {
        await fetchAnalysis(symbol)
      }
    }
    setExpanded(newExpanded)
  }

  const fetchAnalysis = async (symbol: string) => {
    setLoadingSymbols((prev) => new Set(prev).add(symbol))
    try {
      const res = await fetch('/api/watchlist/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      })
      if (res.ok) {
        const data = await res.json()
        setAnalyses((prev) => ({ ...prev, [symbol]: data }))
      }
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error)
    } finally {
      setLoadingSymbols((prev) => {
        const newSet = new Set(prev)
        newSet.delete(symbol)
        return newSet
      })
    }
  }

  const removeFromWatchlist = async (symbol: string) => {
    try {
      const res = await fetch(`/api/watchlist?symbol=${symbol}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol))
        setExpanded((prev) => {
          const newSet = new Set(prev)
          newSet.delete(symbol)
          return newSet
        })
        setAnalyses((prev) => {
          const newData = { ...prev }
          delete newData[symbol]
          return newData
        })
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error)
    }
  }

  if (!userId) return null

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-600">Loading watchlist...</p>
      </div>
    )
  }

  if (watchlist.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">My Watchlist</h2>
        <p className="text-gray-600">No stocks in your watchlist yet. Analyze a stock and add it to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">My Watchlist</h2>
        <span className="text-sm text-gray-500">{watchlist.length} stocks</span>
      </div>

      <div className="space-y-3">
        {watchlist.map((item) => {
          const analysis = analyses[item.symbol]
          const isExpanded = expanded.has(item.symbol)
          const isLoading = loadingSymbols.has(item.symbol)

          return (
            <WatchlistCard
              key={item.id}
              symbol={item.symbol}
              analysis={analysis}
              isExpanded={isExpanded}
              isLoading={isLoading}
              onToggle={() => toggleExpand(item.symbol)}
              onRemove={() => removeFromWatchlist(item.symbol)}
            />
          )
        })}
      </div>
    </div>
  )
}

function WatchlistCard({
  symbol,
  analysis,
  isExpanded,
  isLoading,
  onToggle,
  onRemove,
}: {
  symbol: string
  analysis: StockAnalysis | undefined
  isExpanded: boolean
  isLoading: boolean
  onToggle: () => void
  onRemove: () => void
}) {
  const statusColors = {
    UNDERVALUED: 'bg-green-100 text-green-800 border-green-300',
    FAIR: 'bg-blue-100 text-blue-800 border-blue-300',
    OVERVALUED: 'bg-red-100 text-red-800 border-red-300',
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Compact Summary Bar */}
      <div
        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="font-bold text-lg text-gray-900">{symbol}</div>
          {analysis && (
            <>
              <div className="text-sm text-gray-600">
                ${analysis.currentPrice.toFixed(2)}
              </div>
              <div
                className={`text-sm font-semibold ${
                  analysis.priceMovement.trend === 'up'
                    ? 'text-green-600'
                    : analysis.priceMovement.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {analysis.priceMovement.percentage > 0 ? '+' : ''}
                {analysis.priceMovement.percentage.toFixed(2)}%
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold border ${
                  statusColors[analysis.valuationStatus]
                }`}
              >
                {analysis.valuationStatus.replace('_', ' ')}
              </span>
            </>
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-xs">Loading...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
            title="Remove from watchlist"
          >
            ×
          </button>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && analysis && (
        <div className="p-4 bg-white border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Intrinsic Value</p>
              <p className="text-sm font-semibold text-gray-900">
                ${analysis.intrinsicValue.toFixed(2)}
              </p>
            </div>
            {analysis.technicalIndicators.sma20 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">SMA 20</p>
                <p className="text-sm font-semibold text-gray-900">
                  ${analysis.technicalIndicators.sma20.toFixed(2)}
                </p>
              </div>
            )}
            {analysis.fundamentals?.peRatio && (
              <div>
                <p className="text-xs text-gray-600 mb-1">P/E Ratio</p>
                <p className="text-sm font-semibold text-gray-900">
                  {analysis.fundamentals.peRatio.toFixed(2)}
                </p>
              </div>
            )}
            {analysis.fundamentals?.dividendYieldPct !== null && analysis.fundamentals?.dividendYieldPct !== undefined && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Dividend Yield</p>
                <p className="text-sm font-semibold text-gray-900">
                  {analysis.fundamentals.dividendYieldPct.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

