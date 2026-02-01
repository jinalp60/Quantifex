// For yahoo-finance2 v3+, import the class and instantiate it (like legacy fundamentals.ts)
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
 // Import CommonJS models using createRequire
 const db = require('./models/index.js');
 const { Stock } = db;

/**
 * Worker Lambda Handler
 * Triggered by SQS messages
 * 1. Receive batch of symbols (up to 5)
 * 2. Fetch data from Yahoo Finance
 * 3. Update Stock table in DB
 * 4. Update Redis cache (optional - for now we'll skip and add later)
 */
export const handler = async (event) => {
    console.log('Worker triggered with event:', JSON.stringify(event));

    try {
        // Parse SQS message
        for (const record of event.Records) {
            const message = JSON.parse(record.body);
            const symbols = message.symbols;

            console.log(`Processing batch: ${symbols.join(', ')}`);

            // Fetch data for each symbol
            for (const symbol of symbols) {
                try {
                    // Fetch quote from Yahoo Finance using quoteSummary (matching working code pattern)
                    const symbolUpper = symbol.toUpperCase();
                    const summaryResult = await yahooFinance.quoteSummary(symbolUpper, {
                        modules: ['price', 'summaryDetail', 'defaultKeyStatistics']
                    });
                    
                    // Extract data directly from summaryResult (matching working code access pattern)
                    const quote = {
                        regularMarketPrice: summaryResult.price?.regularMarketPrice ?? summaryResult.summaryDetail?.regularMarketPrice ?? null,
                        regularMarketVolume: summaryResult.price?.regularMarketVolume ?? 0,
                        regularMarketOpen: summaryResult.price?.regularMarketOpen ?? null,
                        regularMarketPreviousClose: summaryResult.price?.regularMarketPreviousClose ?? null,
                        regularMarketDayHigh: summaryResult.price?.regularMarketDayHigh ?? null,
                        regularMarketDayLow: summaryResult.price?.regularMarketDayLow ?? null,
                        fiftyTwoWeekHigh: summaryResult.price?.fiftyTwoWeekHigh ?? null,
                        fiftyTwoWeekLow: summaryResult.price?.fiftyTwoWeekLow ?? null,
                        shortName: summaryResult.price?.shortName || summaryResult.price?.longName || symbolUpper,
                        marketCap: summaryResult.price?.marketCap ?? null,
                        trailingPE: summaryResult.summaryDetail?.trailingPE ?? summaryResult.defaultKeyStatistics?.trailingPE ?? null
                    };

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
                    const analysisSummary = `${quote.shortName || symbol} - Market Cap: ${formatMarketCap(quote.marketCap)}. ` +
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

                    // TODO: Update Redis cache here
                    // await updateCache(symbol, quote);

                } catch (symbolError) {
                    // Log full error details for debugging
                    console.error(`Error processing ${symbol}:`, {
                        message: symbolError.message,
                        stack: symbolError.stack,
                        error: symbolError
                    });
                    // Continue with next symbol
                }
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
