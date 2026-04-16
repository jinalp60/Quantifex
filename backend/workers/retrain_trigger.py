import os
import boto3
import time

sagemaker = boto3.client('sagemaker')

PREMIUM_TICKERS = os.environ.get('PREMIUM_TICKERS', 'AAPL,MSFT,GOOGL,AMZN,NVDA,META,TSLA,VOO').split(',')
TRAINING_DATA_BUCKET = os.environ.get('TRAINING_DATA_BUCKET')
MODEL_ARTIFACT_BUCKET = os.environ.get('MODEL_ARTIFACT_BUCKET')
SAGEMAKER_ROLE = os.environ.get('SAGEMAKER_ROLE')

# This would ideally be a Docker image with TensorFlow/Pandas
# Or using the built-in SageMaker TensorFlow Estimator image
TRAINING_IMAGE = "763104351884.dkr.ecr.us-east-1.amazonaws.com/tensorflow-training:2.6.0-cpu-py38-ubuntu20.04"

def trigger_training(ticker):
    job_name = f"Quantifex-Retrain-{ticker}-{int(time.time())}"
    print(f"Triggering SageMaker Training Job: {job_name}")
    
    lookback = os.environ.get('LOOKBACK_DAYS', '10')
    epochs = os.environ.get('TRAINING_EPOCHS', '100')
    
    response = sagemaker.create_training_job(
        TrainingJobName=job_name,
        AlgorithmSpecification={
            'TrainingImage': TRAINING_IMAGE,
            'TrainingInputMode': 'File',
        },
        HyperParameters={
            'sagemaker_program': 'train.py',
            'sagemaker_submit_directory': f"s3://{MODEL_ARTIFACT_BUCKET}/code/source.tar.gz",
            'ticker': str(ticker),
            'lookback_days': str(lookback),
            'epochs': str(epochs)
        },
        RoleArn=SAGEMAKER_ROLE,
        InputDataConfig=[
            {
                'ChannelName': 'training',
                'DataSource': {
                    'S3DataSource': {
                        'S3DataType': 'S3Prefix',
                        'S3Uri': f"s3://{TRAINING_DATA_BUCKET}/stock={ticker}/",
                        'S3DataDistributionType': 'FullyReplicated',
                    }
                },
                'ContentType': 'application/x-parquet',
            }
        ],
        OutputDataConfig={
            'S3OutputPath': f"s3://{MODEL_ARTIFACT_BUCKET}/models/{ticker}/"
        },
        ResourceConfig={
            'InstanceType': 'ml.m5.large',
            'InstanceCount': 1,
            'VolumeSizeInGB': 10,
        },
        StoppingCondition={
            'MaxRuntimeInSeconds': 3600 # 1 hour max
        },
        EnableManagedSpotTraining=True # COST OPTIMIZATION
    )
    return response

def handler(event, context):
    """Triggered daily at 5:30 PM EDT by EventBridge."""
    target_ticker = event.get('ticker')
    
    if target_ticker:
        trigger_training(target_ticker)
    else:
        for symbol in PREMIUM_TICKERS:
            trigger_training(symbol)
            # Sleep slightly to avoid SageMaker API rate limits
            time.sleep(2)
            
    return {"statusCode": 200, "body": "Training jobs initiated"}
