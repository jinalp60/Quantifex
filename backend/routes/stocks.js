const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');


router.post('/add', stockController.addStock);
router.get('/user/:userId/watchlist', stockController.getUserWatchlist);
router.delete('/user/:userId/stocks/:symbol', stockController.removeStock);

module.exports = router;
