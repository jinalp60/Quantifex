import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../App';
import { LogOut, Plus, TrendingUp, X } from 'lucide-react';
import allTickers from '../all_tickers.json';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [watchlist, setWatchlist] = useState([]);
    const [newSymbol, setNewSymbol] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchWatchlist();
    }, []);

    const fetchWatchlist = async () => {
        try {
            const res = await api.get(`/stocks/user/${user.id}/watchlist`);
            setWatchlist(res.data);
        } catch (error) {
            console.error(error);
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {watchlist.map(stock => (
                            <div key={stock.symbol} className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900">{stock.symbol}</h3>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 text-sm rounded-full ${stock.valuationStatus === 'UNDERVALUED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {stock.valuationStatus || 'N/A'}
                                            </span>
                                            <button
                                                onClick={() => removeFromWatchlist(stock.symbol)}
                                                className="p-1 text-gray-400 hover:text-red-600 focus:outline-none"
                                                title="Remove from watchlist"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-3xl font-bold text-gray-900">${stock.currentPrice || '0.00'}</p>
                                        <p className="mt-1 text-sm text-gray-500">{stock.analysisSummary}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
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
