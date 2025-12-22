'use client'

import { useState } from 'react'
import { StockAnalysis } from '@/types/stock'

interface StockAnalyzerProps {
  onAnalysisComplete: (analysis: StockAnalysis) => void
  onError: (error: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function StockAnalyzer({
  onAnalysisComplete,
  onError,
  loading,
  setLoading,
}: StockAnalyzerProps) {
  const [symbol, setSymbol] = useState('')

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!symbol.trim()) {
      onError('Please enter a stock symbol')
      return
    }

    setLoading(true)
    onError('')

    const symbolUpper = symbol.toUpperCase().trim()

    try {
      // First, add to watchlist
      const watchlistRes = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbolUpper }),
      })

      // If already in watchlist, that's okay - continue to analyze
      if (!watchlistRes.ok) {
        const watchlistData = await watchlistRes.json()
        if (!watchlistData.error?.includes('already')) {
          onError(watchlistData.error || 'Failed to add to watchlist')
          setLoading(false)
          return
        }
      }

      // Then analyze the stock
      const response = await fetch('/api/stocks/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbolUpper }),
      })

      const data = await response.json()

      if (!response.ok) {
        onError(data.error || 'Failed to analyze stock')
        setLoading(false)
        return
      }

      onAnalysisComplete(data)
      setSymbol('') // Clear input after successful add
    } catch (error) {
      onError('Network error. Please try again.')
      console.error('Error adding stock:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Add Stock to Watchlist
      </h2>
      
      <form onSubmit={handleAddStock} className="space-y-4">
        <div>
          <label
            htmlFor="symbol"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Stock Symbol
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., AAPL, MSFT, GOOGL"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
              maxLength={10}
            />
            <button
              type="submit"
              disabled={loading || !symbol.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Adding...' : 'Add Stock'}
            </button>
          </div>
        </div>
      </form>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-sm">Adding to watchlist and analyzing...</p>
        </div>
      )}
    </div>
  )
}

