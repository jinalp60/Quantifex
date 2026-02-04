// For yahoo-finance2 v3+, import the class and instantiate it (like legacy fundamentals.ts)
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Import CommonJS models using createRequire
const db = require('./models/index.js');
const { Stock } = db;

// Import Redis cache utilities
const { cacheStock, invalidateStockCache } = require('../config/redis.js');

/**
 * Worker Lambda Handler
 * Triggered by SQS messages
 * 1. Receive batch of symbols (up to 5)
 * 2. Fetch data from Yahoo Finance
 * 3. Update Stock table in DB
 * 4. Update Redis cache
 */
export const handler = async (event) => {
    console.log('Worker triggered with event:', JSON.stringify(event));

    try {
        // Parse SQS message
        for (const record of event.Records) {
            const message = JSON.parse(record.body);
            const symbols = message.symbols;

            console.log(`Processing batch: ${symbols.join(', ')}`);

            try {
                // Batch fetch all symbols using quote API
                const symbolsUpper = symbols.map(s => s.toUpperCase());
                const results = await yahooFinance.quote(symbolsUpper);

                console.log(`Fetched ${results.length} quotes successfully`);

                // Process each result
                for (const quote of results) {
                    try {
                        const symbol = quote.symbol;

                        if (!quote || quote.regularMarketPrice == null) {
                            console.warn(`No valid price data for ${symbol}`);
                            continue;
                        }

                        // Calculate simple valuation (placeholder logic)
                        const currentPrice = quote.regularMarketPrice;
                        const fiftyTwoWeekHigh = quote.fiftyTwoWeekHigh ?? currentPrice;
                        const fiftyTwoWeekLow = quote.fiftyTwoWeekLow ?? currentPrice;

                        // Simple valuation: if price is in bottom 30% of 52-week range, consider undervalued
                        const range = fiftyTwoWeekHigh - fiftyTwoWeekLow;
                        const positionInRange = range > 0 ? (currentPrice - fiftyTwoWeekLow) / range : 0.5;

                        let valuationStatus = 'FAIR';
                        if (positionInRange < 0.3) valuationStatus = 'UNDERVALUED';
                        else if (positionInRange > 0.7) valuationStatus = 'OVERVALUED';

                        // Prepare analysis summary
                        const analysisSummary = `${quote.shortName || quote.longName || symbol} - Market Cap: ${formatMarketCap(quote.marketCap)}. ` +
                            `52W Range: $${fiftyTwoWeekLow?.toFixed(2)} - $${fiftyTwoWeekHigh?.toFixed(2)}. ` +
                            `P/E: ${quote.trailingPE?.toFixed(2) || 'N/A'}`;

                        // Update or create stock record
                        await Stock.upsert({
                            symbol: symbol,
                            currentPrice: currentPrice,
                            volume: quote.regularMarketVolume || 0,
                            open: quote.regularMarketOpen || currentPrice,
                            close: quote.regularMarketPreviousClose || currentPrice,
                            high: quote.regularMarketDayHigh || currentPrice,
                            low: quote.regularMarketDayLow || currentPrice,
                            intrinsicValue: currentPrice * 0.9, // Placeholder: 10% discount
                            valuationStatus: valuationStatus,
                            analysisSummary: analysisSummary
                        });

                        console.log(`Updated ${symbol}: $${currentPrice} (${valuationStatus})`);

                        // Update Redis cache with stock data
                        await cacheStock(symbol, {
                            symbol: symbol,
                            currentPrice: currentPrice,
                            volume: quote.regularMarketVolume || 0,
                            open: quote.regularMarketOpen || currentPrice,
                            close: quote.regularMarketPreviousClose || currentPrice,
                            high: quote.regularMarketDayHigh || currentPrice,
                            low: quote.regularMarketDayLow || currentPrice,
                            intrinsicValue: currentPrice * 0.9,
                            valuationStatus: valuationStatus,
                            analysisSummary: analysisSummary,
                            updatedAt: new Date().toISOString()
                        });

                    } catch (symbolError) {
                        // Log full error details for debugging
                        console.error(`Error processing ${quote?.symbol || 'unknown'}:`, {
                            message: symbolError.message,
                            stack: symbolError.stack,
                            error: symbolError
                        });
                        // Continue with next symbol
                    }
                }
            } catch (batchError) {
                console.error('Error in batch fetch:', {
                    message: batchError.message,
                    stack: batchError.stack,
                    symbols: symbols
                });
                // If batch fails, we could fall back to individual calls here if needed
                throw batchError;
            }
        }

        return {
            statusCode: 200,
            body: 'Worker completed successfully'
        };

    } catch (error) {
        console.error('Worker error:', error);
        throw error;
    }
};

// Helper function to format market cap
function formatMarketCap(marketCap) {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap}`;
}
