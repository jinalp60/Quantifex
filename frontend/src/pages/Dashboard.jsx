import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../App';
import { LogOut, Plus, RotateCcw, TrendingUp, X } from 'lucide-react';
import allTickers from '../all_tickers.json';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [watchlist, setWatchlist] = useState([]);
    const [newSymbol, setNewSymbol] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

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
                            const isPremium = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'VOO'].includes(stock.symbol);
                            const ratingColor = {
                                'BULLISH': 'bg-green-100 text-green-800 border-green-200',
                                'BEARISH': 'bg-red-100 text-red-800 border-red-200',
                                'NEUTRAL': 'bg-gray-100 text-gray-800 border-gray-200'
                            }[stock.convictionRating] || 'bg-gray-50 text-gray-500';

                            return (
                                <div key={stock.symbol} className={`bg-white overflow-hidden shadow-lg rounded-xl border-t-4 ${isPremium && stock.convictionRating === 'BULLISH' ? 'border-green-500' : isPremium && stock.convictionRating === 'BEARISH' ? 'border-red-500' : 'border-blue-500'}`}>
                                    <div className="p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{stock.symbol}</h3>
                                                {isPremium && (
                                                    <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">Premium Insight</span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => removeFromWatchlist(stock.symbol)}
                                                    className="p-1 text-gray-300 hover:text-red-600 focus:outline-none transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-end justify-between">
                                            <div>
                                                <p className="text-3xl font-black text-gray-900">${stock.currentPrice?.toFixed(2) || '0.00'}</p>
                                                <p className={`text-xs font-semibold mt-1 ${stock.valuationStatus === 'UNDERVALUED' ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {stock.valuationStatus}
                                                </p>
                                            </div>
                                            {isPremium && stock.convictionRating && (
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${ratingColor}`}>
                                                    {stock.convictionRating}
                                                </div>
                                            )}
                                        </div>

                                        {isPremium && stock.sentimentScore !== null && (
                                            <div className="mt-6 pt-4 border-t border-gray-50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">AI Conviction</span>
                                                    <span className="text-xs font-bold text-gray-900">{(stock.convictionScore * 100).toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${stock.convictionScore > 0.6 ? 'bg-green-500' : stock.convictionScore < 0.4 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${(stock.convictionScore * 100) || 0}%` }}
                                                    ></div>
                                                </div>

                                                {stock.newsSummary && stock.newsSummary.length > 0 && (
                                                    <div className="mt-4">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Recent Pulse</span>
                                                        <ul className="mt-2 space-y-2">
                                                            {stock.newsSummary.slice(0, 2).map((news, idx) => (
                                                                <li key={idx} className="text-[11px] text-gray-600 line-clamp-1 hover:text-blue-600 cursor-pointer">
                                                                    <a href={news.url} target="_blank" rel="noopener noreferrer">
                                                                        • {news.title}
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!isPremium && (
                                            <div className="mt-4 pt-4 border-t border-gray-50 text-[11px] text-gray-500 italic">
                                                Standard metrics available. Add premium markers (Mag 7) for AI signals.
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
