import express from 'express';
const router = express.Router();
import * as stockController from '../controllers/stockController.js';


router.post('/add', stockController.addStock);
router.get('/user/:userId/watchlist', stockController.getUserWatchlist);
router.delete('/user/:userId/stocks/:symbol', stockController.removeStock);

export default router;
