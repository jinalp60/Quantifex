import os
import psycopg2
import yfinance as yf
from datetime import datetime, timedelta

DB_URL = os.environ.get('DATABASE_URL')

def reconcile_signals():
    """
    Checks signals from >24 hours ago and determines if they were correct.
    Logic: 
    - BULLISH: Price must be HIGHER than signalPrice 24h later.
    - BEARISH: Price must be LOWER than signalPrice 24h later.
    """
    conn = psycopg2.connect(DB_URL)
    try:
        with conn.cursor() as cur:
            # 1. Fetch pending audits older than 24 hours
            # We look for records where resultPrice is still NULL
            time_threshold = datetime.now() - timedelta(hours=24)
            
            cur.execute("""
                SELECT id, symbol, "signalPrice", "signalRating", "createdAt"
                FROM "SignalAudits"
                WHERE "isCorrect" IS NULL AND "createdAt" <= %s
                LIMIT 50
            """, (time_threshold,))
            
            pending_signals = cur.fetchall()
            
            if not pending_signals:
                print("No pending signals found for reconciliation.")
                return

            print(f"Reconciling {len(pending_signals)} signals...")

            for audit_id, symbol, signal_price, rating, created_at in pending_signals:
                try:
                    # 2. Get current price from Yahoo Finance
                    ticker = yf.Ticker(symbol)
                    # We use fast_info for current price
                    current_price = ticker.fast_info.get('last_price') or ticker.fast_info.get('currentPrice')
                    
                    if current_price is None:
                        # Fallback to history if fast_info fails
                        hist = ticker.history(period="1d")
                        if not hist.empty:
                            current_price = float(hist.iloc[-1]['Close'])
                    
                    if current_price is None:
                        print(f"Could not fetch price for {symbol}, skipping...")
                        continue

                    # 3. Determine Accuracy
                    is_correct = False
                    if rating == "BULLISH" and current_price > signal_price:
                        is_correct = True
                    elif rating == "BEARISH" and current_price < signal_price:
                        is_correct = True
                    elif rating == "NEUTRAL":
                        # For Neutral, we might define "Correct" as price staying within a range (+/- 0.5%)
                        # But typically neutral is excluded from accuracy stats
                        is_correct = abs((current_price - signal_price) / signal_price) < 0.005
                    
                    # 4. Update the Audit Record
                    cur.execute("""
                        UPDATE "SignalAudits"
                        SET "resultPrice" = %s,
                            "isCorrect" = %s,
                            "updatedAt" = NOW()
                        WHERE id = %s
                    """, (current_price, is_correct, audit_id))
                    
                    print(f"Reconciled {symbol} ({rating}): Signal ${signal_price:.2f} -> Current ${current_price:.2f} | Correct: {is_correct}")

                except Exception as e:
                    print(f"Error reconciling signal {audit_id} for {symbol}: {str(e)}")

            conn.commit()
            print("Reconciliation run complete.")

    finally:
        conn.close()

def handler(event, context):
    """AWS Lambda Entry Point"""
    reconcile_signals()
    return {"statusCode": 200, "body": "Reconciliation complete"}

if __name__ == "__main__":
    # Local dry run
    reconcile_signals()
