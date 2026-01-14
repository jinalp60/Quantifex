const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

router.get('/', stockController.getStocks);
router.post('/add', stockController.addStock);
router.get('/user/:userId/watchlist', stockController.getUserWatchlist);

module.exports = router;
