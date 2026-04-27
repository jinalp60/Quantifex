import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../App';
import { LogOut, Plus, RotateCcw, TrendingUp, X } from 'lucide-react';
import allTickers from '../all_tickers.json';
import premiumTickers from '../premium_tickers.json';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [watchlist, setWatchlist] = useState([]);
    const [newSymbol, setNewSymbol] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [expandedSymbols, setExpandedSymbols] = useState(new Set());

    const toggleExpand = (symbol) => {
        const newExpanded = new Set(expandedSymbols);
        if (newExpanded.has(symbol)) {
            newExpanded.delete(symbol);
        } else {
            newExpanded.add(symbol);
        }
        setExpandedSymbols(newExpanded);
    };

    useEffect(() => {
        fetchWatchlist();
        // Auto-refresh interval from environment (default 5 minutes)
        const refreshInterval = parseInt(import.meta.env.VITE_DASHBOARD_REFRESH_INTERVAL) || 300000;
        const interval = setInterval(() => {
            fetchWatchlist();
        }, refreshInterval);
        return () => clearInterval(interval);
    }, []);

    const fetchWatchlist = async () => {
        setIsRefreshing(true);
        try {
            const res = await api.get(`/stocks/user/${user.id}/watchlist`);
            setWatchlist(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            // Small delay for UI feedback
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    const validateTicker = (ticker) => {
        const upperTicker = ticker.toUpperCase().trim();
        return allTickers.includes(upperTicker);
    };

    const addToWatchlist = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!newSymbol) return;

        const upperSymbol = newSymbol.toUpperCase().trim();

        // Validate ticker against the list
        if (!validateTicker(upperSymbol)) {
            setErrorMessage('Invalid stock ticker symbol');
            return;
        }

        try {
            await api.post('/stocks/add', {
                symbol: upperSymbol,
                userId: user.id
            });
            setNewSymbol('');
            setErrorMessage('');
            fetchWatchlist();
        } catch (error) {
            setErrorMessage('Failed to add symbol');
        }
    };

    const removeFromWatchlist = async (symbol) => {
        try {
            await api.delete(`/stocks/user/${user.id}/stocks/${symbol}`);
            fetchWatchlist();
        } catch (error) {
            console.error('Failed to remove stock:', error);
            setErrorMessage('Failed to remove symbol');
        }
    };

    const handleSymbolChange = (e) => {
        setNewSymbol(e.target.value);
        // Clear error message when user starts typing
        if (errorMessage) {
            setErrorMessage('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-800">Quantifex</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600">Welcome, {user.name}</span>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-500 hover:text-red-600 focus:outline-none"
                                title="Sign out"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h1 className="text-2xl font-semibold text-gray-900">Your Watchlist</h1>
                            <button
                                onClick={fetchWatchlist}
                                disabled={isRefreshing}
                                className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none transition-all"
                                title="Refresh stock data"
                            >
                                <RotateCcw className={`h-5 w-5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                            </button>
                        </div>
                        <form onSubmit={addToWatchlist} className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                                <div className="flex-1">
                                    <input
                                        value={newSymbol}
                                        onChange={handleSymbolChange}
                                        placeholder="Add Symbol (e.g. AAPL)"
                                        className={`w-full p-2 border rounded shadow-sm ${errorMessage ? 'border-red-500' : ''}`}
                                    />
                                </div>
                                <button type="submit" className="p-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700">
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
                            {errorMessage && (
                                <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
                            )}
                        </form>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {watchlist.map(stock => {
                            // Only show AI signals for verified Premium tickers
                            const isPremiumTicker = premiumTickers.includes(stock.symbol);

                            // User visibility condition: User must be present and lastActive must be recent (or simply user exists for now)
                            const showAIInsights = user && isPremiumTicker;

                            const ratingStyles = {
                                'BULLISH': {
                                    bg: 'bg-green-500/10',
                                    text: 'text-green-500',
                                    border: 'border-green-500/20',
                                    accent: 'bg-green-500',
                                    gradient: 'from-green-500 to-emerald-600'
                                },
                                'BEARISH': {
                                    bg: 'bg-red-500/10',
                                    text: 'text-red-500',
                                    border: 'border-red-500/20',
                                    accent: 'bg-red-500',
                                    gradient: 'from-red-500 to-rose-600'
                                },
                                'NEUTRAL': {
                                    bg: 'bg-gray-500/10',
                                    text: 'text-gray-500',
                                    border: 'border-gray-500/20',
                                    accent: 'bg-gray-500',
                                    gradient: 'from-gray-400 to-gray-500'
                                }
                            }[stock.convictionRating] || { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-100', accent: 'bg-gray-300', gradient: 'from-gray-200 to-gray-300' };

                            return (
                                <div key={stock.symbol} className={`relative bg-white overflow-hidden shadow-xl rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${showAIInsights ? 'border-gray-200' : 'border-gray-100'}`}>
                                    {showAIInsights && stock.convictionRating && (
                                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${ratingStyles.gradient}`} />
                                    )}

                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{stock.symbol}</h3>
                                                {showAIInsights && (
                                                    <div className="flex items-center space-x-1 mt-1">
                                                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${ratingStyles.accent}`} />
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${ratingStyles.text}`}>AI Engine Active</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeFromWatchlist(stock.symbol)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="mt-6 flex items-baseline justify-between">
                                            <div>
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-4xl font-black text-gray-900 tracking-tighter">${stock.currentPrice?.toFixed(2) || '0.00'}</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">Current Price</p>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full text-xs font-black tracking-tighter border shadow-sm transition-all ${stock.valuationStatus === 'UNDERVALUED' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {stock.valuationStatus || 'N/A'}
                                            </div>
                                        </div>

                                        {/* Global Fundamentals Section (Show for ALL symbols) */}
                                        <div className="mt-6 pt-4 border-t border-gray-50">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">52W Range</span>
                                                    <p className="text-[11px] text-gray-900 font-bold mt-1">
                                                        {stock.analysisSummary?.split('\n').find(l => l.includes('52W Range'))?.split(': ')[1] || 'Pending...'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">P/E Ratio</span>
                                                    <p className="text-[11px] text-gray-900 font-bold mt-1">
                                                        {stock.analysisSummary?.split('\n').find(l => l.includes('P/E'))?.split(': ')[1] || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Premium AI Insights Layer */}
                                        {showAIInsights && stock.convictionScore !== null ? (
                                            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                                <div
                                                    onClick={() => toggleExpand(stock.symbol)}
                                                    className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100/50 transition-all group"
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                    Intelligence Conviction ({stock.convictionRating?.toLowerCase() || 'pending'})
                                                                </span>
                                                            </div>
                                                            {stock.intelligenceUpdatedAt && (
                                                                <span className="text-[8px] text-gray-400 mt-0.5">Refreshed {new Date(stock.intelligenceUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            )}
                                                        </div>
                                                        <span className={`text-[11px] font-black ${!stock.convictionScore || isNaN(stock.convictionScore) ? 'text-blue-500 animate-pulse' : ratingStyles.text}`}>
                                                            {!stock.convictionScore || isNaN(stock.convictionScore)
                                                                ? 'Quantifying...'
                                                                : `${(stock.convictionScore * 100).toFixed(0)}% confidence`}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full transition-all duration-1000 bg-gradient-to-r ${ratingStyles.gradient}`}
                                                            style={{ width: `${(stock.convictionScore * 100) || 0}%` }}
                                                        ></div>
                                                    </div>

                                                    {/* Expandable Breakdown (Heatmap Pills & News) */}
                                                    {expandedSymbols.has(stock.symbol) && (
                                                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                                            {/* Heatmap Pills */}
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                                                    <div className={`w-2 h-2 rounded-full ${stock.modelScore > 0.5 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tight">Price Model</span>
                                                                        <span className="text-[10px] font-bold text-gray-700">{stock.modelScore > 0.5 ? 'Upward' : 'Downward'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                                                    <div className={`w-2 h-2 rounded-full ${stock.sentimentScore > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tight">News Pulse</span>
                                                                        <span className="text-[10px] font-bold text-gray-700">{stock.sentimentScore > 0 ? 'Positive' : 'Negative'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* News Breakdown */}
                                                            {stock.newsSummary && stock.newsSummary.length > 0 && (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sentiment Pulse</span>
                                                                        <div className="flex space-x-0.5">
                                                                            {[...Array(3)].map((_, i) => (
                                                                                <div key={i} className={`w-1 h-1 rounded-full ${i < (stock.sentimentScore + 1) * 1.5 ? ratingStyles.accent : 'bg-gray-200'}`} />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {stock.newsSummary.slice(0, 3).map((news, idx) => (
                                                                            <a
                                                                                key={idx}
                                                                                href={news.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="group/news flex items-start space-x-2 p-2 rounded-lg hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                                                            >
                                                                                <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                                                                <span className="text-[11px] text-gray-600 leading-snug group-hover/news:text-blue-700 transition-colors font-medium">
                                                                                    {news.title}
                                                                                </span>
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="mt-2 text-center">
                                                        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                                                            {expandedSymbols.has(stock.symbol) ? 'Click to collapse' : 'Click for breakdown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : isPremiumTicker && (
                                            <div className="mt-8 p-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-2">
                                                <TrendingUp className="h-5 w-5 text-gray-300" />
                                                <p className="text-[10px] font-medium text-gray-500 px-4">
                                                    Intelligence engine is currently calculating...
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {watchlist.length === 0 && (
                            <p className="text-gray-500 col-span-full text-center py-10">No stocks in watchlist. Add one to get started!</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
