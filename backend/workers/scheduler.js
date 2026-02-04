const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { Sequelize } = require('sequelize');
const { User, Stock } = require('./models');

const sqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-2' });
const QUEUE_URL = process.env.QUEUE_URL;

/**
 * Scheduler Lambda Handler
 * Triggered by EventBridge every 5 minutes
 * 1. Check if market is open
 * 2. Get active users (lastActive within last 24 hours)
 * 3. Get their stock symbols
 * 4. Group symbols into batches (configurable batch size)
 * 5. Send batches to SQS
 */
exports.handler = async (event) => {
    console.log('Scheduler triggered at:', new Date().toISOString());

    try {
        // 1. Check if market is open (simplified - US market hours)
        const now = new Date();
        const hour = now.getUTCHours();
        const day = now.getUTCDay();

        const marketOpen = parseInt(process.env.MARKET_OPEN_UTC) || 14;
        const marketClose = parseInt(process.env.MARKET_CLOSE_UTC) || 21;

        // Skip weekends
        if (day === 0 || day === 6) {
            console.log('Market closed: Weekend');
            return { statusCode: 200, body: 'Market closed (weekend)' };
        }

        if (hour < marketOpen || hour >= marketClose) {
            console.log(`Market closed: Outside trading hours (${marketOpen}-${marketClose} UTC)`);
            return { statusCode: 200, body: 'Market closed (outside hours)' };
        }

        // 2. Get active users (activity window configurable)
        const activityWindowHours = parseInt(process.env.USER_ACTIVITY_WINDOW_HOURS) || 24;
        const activityWindowMs = activityWindowHours * 60 * 60 * 1000;
        const windowAgo = new Date(Date.now() - activityWindowMs);

        const activeUsers = await User.findAll({
            where: {
                lastActive: {
                    [Sequelize.Op.gte]: windowAgo
                }
            },
            include: Stock
        });

        if (activeUsers.length === 0) {
            console.log('No active users found');
            return { statusCode: 200, body: 'No active users' };
        }

        // 3. Collect unique symbols from all active users
        const symbolsSet = new Set();
        activeUsers.forEach(user => {
            user.Stocks.forEach(stock => {
                symbolsSet.add(stock.symbol);
            });
        });

        const symbols = Array.from(symbolsSet);
        console.log(`Found ${symbols.length} unique symbols from ${activeUsers.length} active users`);

        if (symbols.length === 0) {
            console.log('No symbols to fetch');
            return { statusCode: 200, body: 'No symbols' };
        }

        // 4. Group symbols into batches
        const batchSize = parseInt(process.env.BATCH_SIZE) || 10;
        const batches = [];
        for (let i = 0; i < symbols.length; i += batchSize) {
            batches.push(symbols.slice(i, i + batchSize));
        }

        // 5. Send each batch to SQS
        for (const batch of batches) {
            const params = {
                QueueUrl: QUEUE_URL,
                MessageBody: JSON.stringify({ symbols: batch })
            };

            await sqs.send(new SendMessageCommand(params));
            console.log(`Queued batch: ${batch.join(', ')}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Scheduler completed',
                activeUsers: activeUsers.length,
                symbols: symbols.length,
                batches: batches.length
            })
        };

    } catch (error) {
        console.error('Scheduler error:', error);
        throw error;
    }
};
