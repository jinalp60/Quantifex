const { Stock, User } = require('../models');
const { cacheStock, getCachedStocks } = require('../config/redis');

exports.addStock = async (req, res) => {
    try {
        const { symbol, userId } = req.body;

        // Find or Create Stock (Placeholder data for new stock)
        const [stock] = await Stock.findOrCreate({
            where: { symbol },
            defaults: {
                symbol,
                currentPrice: 0,
                analysisSummary: 'Pending analysis...'
            }
        });

        // Add to User's Watchlist
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.addStock(stock);

        res.json({ message: 'Stock added to watchlist', stock });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add stock' });
    }
};

exports.getUserWatchlist = async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch user with only stock associations (symbols only, not full stock data)
        const user = await User.findByPk(userId, {
            include: {
                model: Stock,
                attributes: ['symbol'], // Only get symbols
                through: { attributes: [] } // Exclude join table data
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });
        if (!user.Stocks || user.Stocks.length === 0) {
            return res.json([]);
        }

        // Extract symbols
        const symbols = user.Stocks.map(s => s.symbol);

        // Batch fetch from cache using mget (1 Redis call instead of N)
        const cachedData = await getCachedStocks(symbols);

        // Separate hits from misses
        const cachedResults = [];
        const missedSymbols = [];

        for (const symbol of symbols) {
            if (cachedData[symbol.toUpperCase()]) {
                cachedResults.push(cachedData[symbol.toUpperCase()]);
            } else {
                missedSymbols.push(symbol);
            }
        }

        // For cache misses, fetch from database and update cache
        if (missedSymbols.length > 0) {
            const dbStocks = await Stock.findAll({
                where: { symbol: missedSymbols }
            });

            for (const stock of dbStocks) {
                const stockData = stock.toJSON();
                await cacheStock(stock.symbol, stockData);
                cachedResults.push(stockData);
            }
        }

        console.log(`Watchlist cache: ${symbols.length - missedSymbols.length}/${symbols.length} hits`);
        res.json(cachedResults);
    } catch (error) {
        console.error('Error in getUserWatchlist:', error);
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
};

exports.removeStock = async (req, res) => {
    try {
        const { userId, symbol } = req.params;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const stock = await Stock.findOne({ where: { symbol: symbol.toUpperCase() } });
        if (!stock) return res.status(404).json({ error: 'Stock not found' });

        await user.removeStock(stock);

        res.json({ message: 'Stock removed from watchlist' });
    } catch (error) {
        console.error('Error in removeStock:', error);
        res.status(500).json({ error: 'Failed to remove stock' });
    }
};
