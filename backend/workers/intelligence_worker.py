import os
import json
import boto3
import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import joblib
from tensorflow.keras.models import load_model
import finnhub
import yfinance as yf
from io import BytesIO

# AWS Clients
s3 = boto3.client('s3')
sm_runtime = boto3.client('sagemaker-runtime')
secrets = boto3.client('secretsmanager')

# Config
PREMIUM_TICKERS = os.environ.get('PREMIUM_TICKERS', 'AAPL,MSFT,GOOGL,AMZN,NVDA,META,TSLA,VOO').split(',')
SAGEMAKER_ENDPOINT = os.environ.get('SAGEMAKER_ENDPOINT')
S3_MODEL_BUCKET = os.environ.get('S3_MODEL_BUCKET')
TRAINING_DATA_BUCKET = os.environ.get('TRAINING_DATA_BUCKET')
FINNHUB_SECRET_ID = os.environ.get('FINNHUB_SECRET_ID')
DB_URL = os.environ.get('DATABASE_URL')

# Intelligence Math Constants
DECAY_LAMBDA = float(os.environ.get('DECAY_LAMBDA', 0.0005)) 
SENTIMENT_WEIGHT = float(os.environ.get('SENTIMENT_WEIGHT', 0.3))
BULLISH_THRESHOLD = float(os.environ.get('BULLISH_THRESHOLD', 0.65))
BEARISH_THRESHOLD = float(os.environ.get('BEARISH_THRESHOLD', 0.35))
NEWS_FETCH_LIMIT = int(os.environ.get('NEWS_FETCH_LIMIT', 20))
LOOKBACK_DAYS = int(os.environ.get('LOOKBACK_DAYS', 10))

def get_finnhub_api_key():
    response = secrets.get_secret_value(SecretId=FINNHUB_SECRET_ID)
    return response['SecretString']

def fetch_ticker_news(ticker, api_key):
    client = finnhub.Client(api_key=api_key)
    end_date = datetime.now()
    start_date = datetime.now() - timedelta(days=2)
    news = client.company_news(ticker, _from=start_date.strftime('%Y-%m-%d'), to=end_date.strftime('%Y-%m-%d'))
    
    # Sort by datetime (latest first) and take top N for a richer conviction signal
    news = sorted(news, key=lambda x: x['datetime'], reverse=True)[:NEWS_FETCH_LIMIT]
    return news

def get_sentiment(headlines):
    if not headlines:
        return 0, []
    
    texts = [h['headline'] for h in headlines]
    
    response = sm_runtime.invoke_endpoint(
        EndpointName=SAGEMAKER_ENDPOINT,
        ContentType='application/json',
        Body=json.dumps({"inputs": texts})
    )
    
    results = json.loads(response['Body'].read().decode())
    decayed_scores = []
    now_ts = datetime.now().timestamp()
    
    for i, res in enumerate(results):
        # 1. Raw Sentiment Calculation
        p = next((item['score'] for item in res if item['label'] == 'positive'), 0)
        n = next((item['score'] for item in res if item['label'] == 'negative'), 0)
        raw_score = p - n
        
        # 2. Individual Decay Calculation (minutes)
        pub_ts = headlines[i]['datetime']
        t_mins = (now_ts - pub_ts) / 60
        decay_factor = np.exp(-DECAY_LAMBDA * t_mins)
        
        # 3. Apply Option A: Individual Decay
        decayed_scores.append(raw_score * decay_factor)
        
    # Final Decayed Pulse (Averaged over N pool)
    avg_decayed_sentiment = np.mean(decayed_scores)
    summary = [{"title": h['headline'], "url": h['url']} for h in headlines[:3]]
    return float(avg_decayed_sentiment), summary

def get_historical_context(ticker_symbol, days=15):
    """Fetches the last N valid daily partitions from S3 Data Lake."""
    print(f"Walking S3 partitions for {ticker_symbol} context...")
    frames = []
    
    
    # We look back up to 30 days to find 'days' worth of valid partitions (weekends/holidays)
    current_date = datetime.now()
    lookback_limit = 30 
    
    for i in range(lookback_limit):
        target_date = current_date - timedelta(days=i)
        year = target_date.strftime('%Y')
        month = target_date.strftime('%m')
        day = target_date.strftime('%d')
        
        path = f"stock={ticker_symbol}/year={year}/month={month}/day={day}/data.parquet"
        
        try:
            response = s3.get_object(Bucket=TRAINING_DATA_BUCKET, Key=path)
            df_day = pd.read_parquet(BytesIO(response['Body'].read()))
            frames.append(df_day)
            if len(frames) >= days: break
        except Exception:
            # Partition doesn't exist (weekend or before pipeline start)
            continue
            
    if not frames:
        print(f"Warning: No S3 history found for {ticker_symbol}. Falling back to API.")
        # Fallback to pure price if S3 is empty (initial bootstrap case)
        ticker = yf.Ticker(ticker_symbol)
        df_fallback = ticker.history(period=f"{days}d")
        df_fallback['sentimentScore'] = 0.0
        return df_fallback
        
    # Combine and ensure chronological order
    df = pd.concat(frames).sort_index()
    return df

def handler(event, context):
    try:
        api_key = get_finnhub_api_key()
        
        for record in event['Records']:
            sqs_body = json.loads(record['body'])
            sns_msg = json.loads(sqs_body['Message'])
            symbols = sns_msg.get('symbols', [])
            
            for symbol in symbols:
                if symbol not in PREMIUM_TICKERS: continue
                
                # 1. New Sentiment Pulse (Decayed Individually)
                news = fetch_ticker_news(symbol, api_key)
                avg_decayed_sentiment, news_summary = get_sentiment(news)
                
                # 2. Reconstruct Model Window
                df_context = get_historical_context(symbol, days=LOOKBACK_DAYS)
                if df_context is None: continue
                
                # 3. Model Inference (Single Output Classifier)
                s3.download_file(S3_MODEL_BUCKET, f"models/{symbol}/scaler.gz", "/tmp/scaler.gz")
                s3.download_file(S3_MODEL_BUCKET, f"models/{symbol}/model.h5", "/tmp/model.h5")
                
                scaler = joblib.load("/tmp/scaler.gz")
                model = load_model("/tmp/model.h5")
                
                # Safety Check: Ensure we have exactly LOOKBACK_DAYS rows
                context_rows = df_context[['Close', 'Volume', 'sentimentScore', 'sma50', 'sma200']]
                if len(context_rows) < LOOKBACK_DAYS:
                    print(f"Skipping {symbol}: Insufficient history ({len(context_rows)}/{LOOKBACK_DAYS} days)")
                    continue
                
                scaled_features = scaler.transform(context_rows[-LOOKBACK_DAYS:])
                model_prob = float(model.predict(np.expand_dims(scaled_features, axis=0))[0][0])
                
                # 4. Final Conviction Blending
                # Sentiment Strength = absolute version of the decayed mean
                adj_strength = abs(avg_decayed_sentiment)
                
                # w = SENTIMENT_WEIGHT * sentiment_strength
                w = SENTIMENT_WEIGHT * adj_strength
                sentiment_prob = (avg_decayed_sentiment + 1) / 2
                
                # Conviction = (1 - w) * ModelProb + w * SentimentProb
                final_conviction = ((1 - w) * model_prob) + (w * sentiment_prob)
                
                # 5. Determine Rating
                rating = "NEUTRAL"
                if final_conviction > BULLISH_THRESHOLD: rating = "BULLISH"
                elif final_conviction < BEARISH_THRESHOLD: rating = "BEARISH"
                
                # 6. Commit Results & Log Audit
                conn = psycopg2.connect(DB_URL)
                try:
                    with conn.cursor() as cur:
                        # Update main stock record
                        cur.execute("""
                            UPDATE "Stocks" 
                            SET "sentimentScore" = %s, 
                                "newsSummary" = %s, 
                                "convictionScore" = %s, 
                                "convictionRating" = %s, 
                                "intelligenceUpdatedAt" = NOW()
                            WHERE "symbol" = %s
                        """, (avg_decayed_sentiment, json.dumps(news_summary), final_conviction, rating, symbol))
                        
                        # Log to SignalAudits for performance tracking (24h reconciliation)
                        current_price = float(df_context.iloc[-1]['Close'])
                        cur.execute("""
                            INSERT INTO "SignalAudits" 
                            ("symbol", "signalPrice", "signalScore", "signalRating", "createdAt", "updatedAt")
                            VALUES (%s, %s, %s, %s, NOW(), NOW())
                        """, (symbol, current_price, final_conviction, rating))
                        
                    conn.commit()
                finally:
                    conn.close()

        return {"statusCode": 200, "body": "Intelligence enrichment successful"}
    except Exception as e:
        print(f"FATAL: {str(e)}")
        raise e
