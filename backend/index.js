const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
require('dotenv').config();

const db = require('./models');
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');

const app = express();

app.use(cors());
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
    db.sequelize.authenticate().then(() => {
        console.log('Database connected.');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }).catch(err => {
        console.error('Database connection failed:', err);
    });
}

// Export for Serverless (Lambda)
module.exports.handler = serverless(app);
module.exports.app = app;
