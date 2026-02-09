# Lambda Workers Deployment Guide

## Overview
This directory contains the Lambda functions for the background stock data pipeline:
- **scheduler.js**: Checks for active users and queues stock symbols
- **worker.js**: Fetches Yahoo Finance data and updates the database

## Local Testing (Optional)
You can test the workers locally before deploying:

```bash
# Test scheduler
node -e "require('./scheduler').handler({}).then(console.log)"

# Test worker (mock SQS event)
node -e "require('./worker').handler({Records:[{body:JSON.stringify({symbols:['AAPL']})}]}).then(console.log)"
```

## Deployment to AWS Lambda

### Prerequisites
1. AWS CLI configured
2. S3 bucket created (e.g., `quantifex-lambdas`)
3. Database URL configured in Lambda environment variables

### Step 1: Package the Functions
```bash
cd workers
npm install

# Create deployment packages
zip -r scheduler.zip scheduler.js ../models ../config ../node_modules
zip -r worker.zip worker.js ../models ../config ../node_modules
```

### Step 2: Upload to S3
```bash
aws s3 cp scheduler.zip s3://quantifex-lambdas/
aws s3 cp worker.zip s3://quantifex-lambdas/
```

### Step 3: Deploy CloudFormation Stack
```bash
cd ../infrastructure
aws cloudformation create-stack \
  --stack-name quantifex-pipeline \
  --template-body file://pipeline.yaml \
  --parameters \
    ParameterKey=SupabaseUrl,ParameterValue=YOUR_SUPABASE_URL \
    ParameterKey=SupabaseKey,ParameterValue=YOUR_SUPABASE_KEY \
    ParameterKey=UpstashRedisUrl,ParameterValue=YOUR_UPSTASH_URL \
    ParameterKey=UpstashRedisToken,ParameterValue=YOUR_UPSTASH_TOKEN \
  --capabilities CAPABILITY_IAM
```

## Environment Variables
Both Lambda functions need:
- `DATABASE_URL`: Supabase connection string
- `QUEUE_URL`: SQS queue URL (set by CloudFormation)
- `AWS_REGION`: AWS region (default: us-east-1)

## Monitoring
- Check CloudWatch Logs for each Lambda function
- Monitor SQS queue depth
- Review DynamoDB/Supabase for updated stock data
