import os
import boto3
import pandas as pd
import yfinance as yf
from datetime import datetime
from io import BytesIO

s3 = boto3.client('s3')

PREMIUM_TICKERS = os.environ.get('PREMIUM_TICKERS', 'AAPL,VOO').split(',')
TRAINING_DATA_BUCKET = os.environ.get('TRAINING_DATA_BUCKET')

def bootstrap_ticker(symbol):
    period = os.environ.get('BOOTSTRAP_PERIOD', '2y')
    print(f"Bootstrapping historical data for {symbol} (Period: {period})...")
    
    # 1. Fetch Price History
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period) 
    
    if hist.empty:
        print(f"No history found for {symbol}")
        return

    # 1.5 Calculate Historical SMAs (Essential for Training Integrity)
    # We calculate the rolling mean for every day in the bootstrap period
    hist['sma50'] = hist['Close'].rolling(window=50).mean()
    hist['sma200'] = hist['Close'].rolling(window=200).mean()
    # Fill NaN SMAs (first 50/200 days) with neutral 0.0 or current price
    hist['sma50'] = hist['sma50'].fillna(hist['Close'])
    hist['sma200'] = hist['sma200'].fillna(hist['Close'])
    
    # 2. Iterate through daily records to create Hive partitions
    for date, row in hist.iterrows():
        year = date.strftime('%Y')
        month = date.strftime('%m')
        day = date.strftime('%d')
        
        # Prep Dataframe for single day
        df_day = pd.DataFrame([row])
        df_day['ticker'] = symbol
        # Consistency: Empty headlines and Neutral sentiment for historical backfill
        df_day['headlines'] = "[]" 
        df_day['sentimentScore'] = 0.0
        
        # Partition Path: stock=AAPL/year=2023/month=01/day=01/data.parquet
        partition_path = f"stock={symbol}/year={year}/month={month}/day={day}/data.parquet"
        
        parquet_buffer = BytesIO()
        df_day.to_parquet(parquet_buffer, index=True)
        
        s3.put_object(
            Bucket=TRAINING_DATA_BUCKET,
            Key=partition_path,
            Body=parquet_buffer.getvalue()
        )
        # Print progress every 100 days to avoid console spam
        if day == "01":
            print(f"Processed: {partition_path}")

def handler(event, context):
    """Manual trigger handler for backfilling. 
    Accepts: {'tickers': 'AAPL'} or {'tickers': ['MSFT', 'TSLA']} or empty {} for all
    """
    targets = event.get('tickers')
    
    # 1. Convert to list if it's a single string
    if isinstance(targets, str):
        targets = [targets]
    
    # 2. Default to all premium tickers if none specified
    if not targets:
        targets = PREMIUM_TICKERS
    
    print(f"Starting robust bootstrap for: {targets}")
    for symbol in targets:
        # Extra safety: strip whitespace
        bootstrap_ticker(symbol.strip())
            
    return {"statusCode": 200, "body": f"Bootstrap complete for {len(targets)} tickers"}
