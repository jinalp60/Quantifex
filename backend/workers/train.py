import os
import argparse
import pandas as pd
import numpy as np
import boto3
import joblib
import json
from datetime import datetime
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.layers import Input, LSTM, Dense, Dropout

# SageMaker Paths
SM_MODEL_DIR = os.environ.get('SM_MODEL_DIR', '/opt/ml/model')
SM_CHANNEL_TRAINING = os.environ.get('SM_CHANNEL_TRAINING', '/opt/ml/input/data/training')

def build_intelligence_lstm(input_shape):
    inputs = Input(shape=input_shape)
    x = LSTM(64, return_sequences=True)(inputs)
    x = Dropout(0.2)(x)
    x = LSTM(64, return_sequences=False)(x)
    x = Dropout(0.2)(x)
    x = Dense(32, activation='relu')(x)
    
    # Pure Probabilistic Output (Conviction Signal)
    prob_output = Dense(1, activation='sigmoid', name='prob_output')(x)
    
    model = Model(inputs=inputs, outputs=prob_output)
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    return model

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ticker', type=str)
    parser.add_argument('--epochs', type=int, default=100)
    parser.add_argument('--lookback_days', type=int, default=10)
    args = parser.parse_args()

    print(f"Starting SageMaker Training for {args.ticker}...")

    # 1. Load All Partitioned Data from SageMaker Input Channel
    # SageMaker automatically downloads the S3 data to this directory
    data_frames = []
    for root, dirs, files in os.walk(SM_CHANNEL_TRAINING):
        # We need to sort by path to ensure chronological order through partitions
        for file in sorted(files):
            if file.endswith(".parquet"):
                data_frames.append(pd.read_parquet(os.path.join(root, file)))

    if not data_frames:
        raise ValueError("No data found in training channel!")

    # Sort by the index (date) to ensure the LSTM sees a valid time series
    df = pd.concat(data_frames).sort_index()
    print(f"Loaded {len(df)} historical records for {args.ticker}.")

    # 2. Feature Selection & Scaling
    features_cols = ['Close', 'Volume', 'sentimentScore', 'sma50', 'sma200']
    
    # Ensure all required columns exist
    for col in features_cols:
        if col not in df.columns:
            df[col] = 0.0 # Default missing features to neutral/zero
            
    data = df[features_cols].values
    
    # 3. Scale and Save Scaler
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data)
    
    scaler_path = os.path.join(SM_MODEL_DIR, 'scaler.gz')
    joblib.dump(scaler, scaler_path)

    # 4. Create Sequences (dynamic lookback)
    seq_length = args.lookback_days
    X, y_up = [], []
    for i in range(len(data_scaled) - seq_length):
        X.append(data_scaled[i:i+seq_length])
        
        # Binary Label: Did it go up since the previous day's close?
        target_price = data_scaled[i+seq_length, 0]
        current_price = data_scaled[i+seq_length-1, 0]
        y_up.append(1.0 if target_price > current_price else 0.0)
        
    X = np.array(X)
    y_up = np.array(y_up)

    # 5. Model Training
    input_shape = (seq_length, len(features_cols))
    model = build_intelligence_lstm(input_shape)
    
    print(f"Beginning intelligence training (direction focus) on {len(X)} sequences...")
    model.fit(
        X, 
        y_up,
        epochs=args.epochs,
        batch_size=16,
        verbose=1,
        validation_split=0.1,
        shuffle=False # Crucial for time-series data
    )
    
    # 5. Export for Production
    # Save the H5 model
    model_save_path = os.path.join(SM_MODEL_DIR, 'model.h5')
    model.save(model_save_path)
    
    # Export Metadata Manifest (for debugging and versioning)
    metadata = {
        'ticker': args.ticker,
        'features': features_cols,
        'last_updated': datetime.now().isoformat(),
        'samples': len(X)
    }
    with open(os.path.join(SM_MODEL_DIR, 'scaler_bounds.json'), 'w') as f:
        json.dump(metadata, f, indent=4)
    
    print(f"Deployment artifacts ready for {args.ticker}!")
