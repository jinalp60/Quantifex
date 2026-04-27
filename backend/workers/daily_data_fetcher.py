import os
import json
import boto3
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import finnhub
from io import StringIO, BytesIO

s3 = boto3.client('s3')
sm_runtime = boto3.client('sagemaker-runtime')
secrets = boto3.client('secretsmanager')

PREMIUM_TICKERS = os.environ.get('PREMIUM_TICKERS', 'AAPL,MSFT,GOOGL,AMZN,NVDA,META,TSLA,VOO').split(',')
TRAINING_DATA_BUCKET = os.environ.get('TRAINING_DATA_BUCKET')
FINNHUB_SECRET_ID = os.environ.get('FINNHUB_SECRET_ID')
SAGEMAKER_ENDPOINT = os.environ.get('SAGEMAKER_ENDPOINT')

def get_api_key():
    response = secrets.get_secret_value(SecretId=FINNHUB_SECRET_ID)
    return response['SecretString']

def calculate_sentiment(headlines):
    """Invokes SageMaker FinBERT endpoint to get average sentiment score."""
    if not headlines:
        return 0.0
    
    try:
        response = sm_runtime.invoke_endpoint(
            EndpointName=SAGEMAKER_ENDPOINT,
            ContentType='application/json',
            Body=json.dumps({"inputs": headlines})
        )
        results = json.loads(response['Body'].read().decode())
        scores = []
        for res in results:
            # Score = Positive prob - Negative prob
            p = next((item['score'] for item in res if item['label'] == 'positive'), 0)
            n = next((item['score'] for item in res if item['label'] == 'negative'), 0)
            scores.append(p - n)
        
        if not scores:
            return 0.0
            
        return float(sum(scores) / len(scores))
    except Exception as e:
        print(f"Sentiment Analysis Error: {str(e)}")
        return 0.0

def handler(event, context):
    try:
        api_key = get_api_key()
        client = finnhub.Client(api_key=api_key)
        
        # Ranges: Last 24 hours
        end_date = datetime.now()
        start_date = end_date - timedelta(days=1)
        
        # Date partitions for S3
        year = end_date.strftime('%Y')
        month = end_date.strftime('%m')
        day = end_date.strftime('%d')
        
        for symbol in PREMIUM_TICKERS:
            print(f"Daily partitioned fetch and score for {symbol}...")
            
            # 1. Price Data
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="1d")
            if hist.empty: continue
            
            # 2. News Data
            news = client.company_news(symbol, _from=start_date.strftime('%Y-%m-%d'), to=end_date.strftime('%Y-%m-%d'))
            headlines = [n['headline'] for n in news]
            
            # 3. Calculate Sentiment Pulse
            sentiment_score = calculate_sentiment(headlines)
            
            # 4. Fetch SMAs from Yahoo Finance (fast_info or info)
            try:
                # fast_info is efficient for current metrics
                sma50 = ticker.fast_info.get('fiftyDayAverage', 0.0)
                sma200 = ticker.fast_info.get('twoHundredDayAverage', 0.0)
                print(f"SMA50: {sma50}")
                print(f"SMA200: {sma200}")
            except:
                sma50, sma200 = 0.0, 0.0

            # 5. Prep Dataframe
            df = hist.iloc[-1:].copy()
            df['headlines'] = json.dumps(headlines)
            df['sentimentScore'] = sentiment_score
            df['sma50'] = sma50
            df['sma200'] = sma200
            df['ticker'] = symbol
            
            # 5. Save as Parquet to Hive Path
            # Path: stock=AAPL/year=2026/month=04/day=15/data.parquet
            partition_path = f"stock={symbol}/year={year}/month={month}/day={day}/data.parquet"
            
            parquet_buffer = BytesIO()
            df.to_parquet(parquet_buffer, index=True)
            
            s3.put_object(
                Bucket=TRAINING_DATA_BUCKET, 
                Key=partition_path, 
                Body=parquet_buffer.getvalue()
            )
            print(f"Stored with score {sentiment_score}: {partition_path}")
            
        return {"statusCode": 200, "body": "Partitioned ingest and scoring complete"}
    except Exception as e:
        print(f"Fetcher Error: {str(e)}")
        raise e
