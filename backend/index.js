import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import 'dotenv/config';

import db from './models/index.js';
const { sequelize } = db;
import authRoutes from './routes/auth.js';
import stockRoutes from './routes/stocks.js';

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Database Sync & Start
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    sequelize.authenticate().then(() => {
        console.log('Database connected.');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }).catch(err => {
        console.error('Database connection failed:', err);
    });
}

// Export for Serverless (Lambda)
export const handler = serverless(app);
export { app };
