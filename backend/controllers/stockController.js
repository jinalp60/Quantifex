const { Stock, User } = require('../models');

exports.getStocks = async (req, res) => {
    try {
        // Get all stocks (or filter by query)
        const stocks = await Stock.findAll();
        res.json(stocks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stocks' });
    }
};

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
        const user = await User.findByPk(userId, {
            include: Stock
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user.Stocks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
};
