const { Redis } = require('@upstash/redis');

// Initialize Upstash Redis client
let redisClient = null;

function getRedisClient() {
    if (!redisClient) {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            console.warn('Redis credentials not configured. Cache will be disabled.');
            return null;
        }

        try {
            redisClient = new Redis({
                url: url,
                token: token,
            });
            console.log('Redis client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Redis client:', error);
            return null;
        }
    }
    return redisClient;
}

// Helper function to get cache TTL from environment or use default
function getCacheTTL() {
    return parseInt(process.env.CACHE_TTL || '300', 10); // Default 5 minutes
}

// Cache a stock by symbol
async function cacheStock(symbol, stockData) {
    const client = getRedisClient();
    if (!client) return false;

    try {
        const key = `stock:${symbol.toUpperCase()}`;
        const ttl = getCacheTTL();
        await client.setex(key, ttl, JSON.stringify(stockData));
        console.log(`Cached stock ${symbol} with TTL ${ttl}s`);
        return true;
    } catch (error) {
        console.error(`Failed to cache stock ${symbol}:`, error);
        return false;
    }
}

// Get a stock from cache by symbol
async function getCachedStock(symbol) {
    const client = getRedisClient();
    if (!client) return null;

    try {
        const key = `stock:${symbol.toUpperCase()}`;
        const data = await client.get(key);
        if (data) {
            console.log(`Cache hit for stock ${symbol}`);
            return typeof data === 'string' ? JSON.parse(data) : data;
        }
        console.log(`Cache miss for stock ${symbol}`);
        return null;
    } catch (error) {
        console.error(`Failed to get cached stock ${symbol}:`, error);
        return null;
    }
}

// Invalidate cache for a specific stock
async function invalidateStockCache(symbol) {
    const client = getRedisClient();
    if (!client) return false;

    try {
        const key = `stock:${symbol.toUpperCase()}`;
        await client.del(key);
        console.log(`Invalidated cache for stock ${symbol}`);
        return true;
    } catch (error) {
        console.error(`Failed to invalidate cache for ${symbol}:`, error);
        return false;
    }
}

// Get multiple stocks from cache
async function getCachedStocks(symbols) {
    const client = getRedisClient();
    if (!client) return {};

    try {
        const keys = symbols.map(s => `stock:${s.toUpperCase()}`);

        // Use mget for batch retrieval 
        const results = await client.mget(...keys);

        const cached = {};
        symbols.forEach((symbol, index) => {
            if (results[index]) {
                const data = results[index];
                cached[symbol.toUpperCase()] = typeof data === 'string' ? JSON.parse(data) : data;
            }
        });

        console.log(`Cache hits: ${Object.keys(cached).length}/${symbols.length} stocks`);
        return cached;
    } catch (error) {
        console.error('Failed to get cached stocks:', error);
        return {};
    }
}

module.exports = {
    getRedisClient,
    cacheStock,
    getCachedStock,
    invalidateStockCache,
    getCachedStocks
};
