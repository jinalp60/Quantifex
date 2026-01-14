# Infrastructure Deployment Guide

This directory contains CloudFormation templates for deploying the Quantifex infrastructure to AWS.

## Templates

1. **s3-bucket.yaml** - S3 bucket for Lambda deployment packages
2. **pipeline.yaml** - Background data pipeline (EventBridge, Lambda, SQS)
3. **backend-api.yaml** - API Gateway + Lambda for Express backend (TODO)
4. **frontend.yaml** - S3 + CloudFront for React frontend (TODO)

## Deployment Order

### Step 1: Create S3 Bucket for Lambda Code

```bash
aws cloudformation create-stack \
  --stack-name quantifex-s3-bucket \
  --template-body file://s3-bucket.yaml \
  --region us-east-2
```

Wait for completion:
```bash
aws cloudformation wait stack-create-complete \
  --stack-name quantifex-s3-bucket \
  --region us-east-2
```

### Step 2: Package and Upload Lambda Functions

```bash
cd ../backend/workers

# Install dependencies
npm install

# Create deployment packages
"/c/Program Files/7-Zip/7z.exe" a scheduler.zip scheduler.js ../models ../config package.json package-lock.json node_modules
"/c/Program Files/7-Zip/7z.exe" a worker.zip worker.js ../models ../config package.json package-lock.json node_modules

# Upload to S3
aws s3 cp scheduler.zip s3://quantifex-lambdas/
aws s3 cp worker.zip s3://quantifex-lambdas/
```

### Step 3: Deploy Pipeline Stack

```bash
cd ../../infrastructure

aws cloudformation create-stack \
  --stack-name quantifex-pipeline \
  --template-body file://pipeline.yaml \
  --parameters \
    ParameterKey=DatabaseUrl,ParameterValue=YOUR_DATABASE_URL \
    ParameterKey=UpstashRedisUrl,ParameterValue=YOUR_UPSTASH_REST_URL \
    ParameterKey=UpstashRedisToken,ParameterValue=YOUR_UPSTASH_REST_TOKEN \
  --capabilities CAPABILITY_IAM \
  --region us-east-2
```

Wait for completion:
```bash
aws cloudformation wait stack-create-complete \
  --stack-name quantifex-pipeline \
  --region us-east-2
```

### Step 4: Deploy Backend API (Optional - for production)

Package the backend:
```bash
cd ../backend

# Install production dependencies
npm install --production

# Create deployment package
"/c/Program Files/7-Zip/7z.exe" a quantiex-backend-api.zip index.js routes/ controllers/ models/ config/ node_modules/

# Upload to S3
aws s3 cp quantiex-backend-api.zip s3://quantifex-lambdas/
```

Deploy the stack:
```bash
cd ../infrastructure

aws cloudformation create-stack \
  --stack-name quantifex-backend-api \
  --template-body file://backend-api.yaml \
  --parameters \
    ParameterKey=DatabaseUrl,ParameterValue=YOUR_DATABASE_URL \
  --capabilities CAPABILITY_IAM \
  --region us-east-2
```

### Step 5: Deploy Frontend (Optional - for production)

Build the frontend:
```bash
cd ../frontend

# Update .env with production API URL (from backend-api stack output)
# VITE_API_URL=https://your-api-gateway-url.execute-api.us-east-2.amazonaws.com/api

# Build
npm run build
```

Deploy the stack first:
```bash
cd ../infrastructure

aws cloudformation create-stack \
  --stack-name quantifex-frontend \
  --template-body file://frontend.yaml \
  --region us-east-2
```

Upload built files to S3:
```bash
# Get bucket name from stack output
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name quantifex-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text \
  --region us-east-2)

# Upload files
cd ../frontend
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

# Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name quantifex-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text \
  --region us-east-2)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## Updating Stacks

To update an existing stack:

```bash
aws cloudformation update-stack \
  --stack-name quantifex-pipeline \
  --template-body file://pipeline.yaml \
  --parameters \
    ParameterKey=DatabaseUrl,UsePreviousValue=true \
    ParameterKey=UpstashRedisUrl,UsePreviousValue=true \
    ParameterKey=UpstashRedisToken,UsePreviousValue=true \
  --capabilities CAPABILITY_IAM \
  --region us-east-2
```

## Deleting Stacks

To delete the infrastructure (in reverse order):

```bash
# Delete pipeline first
aws cloudformation delete-stack --stack-name quantifex-pipeline --region us-east-2

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name quantifex-pipeline --region us-east-2

# Empty and delete S3 bucket
aws s3 rm s3://quantifex-lambdas --recursive
aws cloudformation delete-stack --stack-name quantifex-s3-bucket --region us-east-2
```

## Monitoring

View stack events:
```bash
aws cloudformation describe-stack-events \
  --stack-name quantifex-pipeline \
  --region us-east-2 \
  --max-items 20
```

View stack outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name quantifex-pipeline \
  --region us-east-2 \
  --query 'Stacks[0].Outputs'
```

## Troubleshooting

### Lambda Function Errors
Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/quantifex-scheduler --follow
aws logs tail /aws/lambda/quantifex-worker --follow
```

### SQS Queue Issues
Check queue attributes:
```bash
aws sqs get-queue-attributes \
  --queue-url $(aws cloudformation describe-stacks \
    --stack-name quantifex-pipeline \
    --query 'Stacks[0].Outputs[?OutputKey==`QueueUrl`].OutputValue' \
    --output text) \
  --attribute-names All
```
