# 🧠 Quantifex Intelligence Phase: Deployment & Initialization Guide

This document outlines the steps to deploy the "Intelligence Phase" refinements and initialize the self-learning pipeline from scratch.

---

## 1. Infrastructure Deployment (AWS CloudFormation)

The platform is divided into three layers: **Storage**, **Transport**, and **Intelligence**. They must be deployed in this specific order to handle cross-stack dependencies.

### Step 1.1: Deploy the Storage Stack (`s3-bucket.yaml`)
This creates all S3 buckets (Lambdas, Training Data, and Models).
```bash
aws cloudformation deploy --stack-name Quantifex-S3 \
  --template-file infrastructure/s3-bucket.yaml \
  --parameter-overrides \
    BucketSuffix="v1" \
  --capabilities CAPABILITY_IAM
```

### Step 1.2: Deploy the Transport Stack (`pipeline.yaml`)
This stack creates the SNS topic and SQS queues.
```bash
aws cloudformation deploy --stack-name Quantifex-Pipeline \
  --template-file infrastructure/pipeline.yaml \
  --parameter-overrides \
    PremiumTickers="AAPL,MSFT,GOOGL,AMZN,NVDA,META,TSLA,VOO" \
  --capabilities CAPABILITY_IAM
```


## 2. Code Deployment (Lambda & SageMaker)

### Step 2.1: Upload FinBERT Model (REQUIRED for Step 1.3 to succeed)
Before deploying the Intelligence stack, you must upload the FinBERT model artifact to the models bucket created in Step 1.1.
```bash
# Package your FinBERT model (config.json, pytorch_model.bin, etc.)
tar -cvzf model.tar.gz * 
aws s3 cp model.tar.gz s3://quantifex-models-v1/finbert/model.tar.gz
```

### Step 2.2: Package the Intelligence Module
Upload the consolidated worker logic to your S3 deployment bucket.
```bash
cd backend/workers
# Bundle all 5 Python AI scripts into one unified ZIP
"/c/Program Files/7-Zip/7z.exe" a intelligence-v2.zip intelligence_worker.py daily_data_fetcher.py retrain_trigger.py bootstrap_history_ingestion.py audit_reconciler.py
aws s3 cp intelligence-v2.zip s3://quantifex-lambdas/intelligence-v2.zip
```

### Step 2.3: Package Training Source 
SageMaker requires the training script to be in a compressed tarball.
```bash
tar -cvzf source.tar.gz train.py
aws s3 cp source.tar.gz s3://quantifex-models-v1/code/source.tar.gz
```

### Step 2.4: Optimize Lambda Layers (OPTIONAL)
With inference moved to SageMaker, the `InferenceWorker` Lambda no longer requires `tensorflow`. You can drastically reduce your deployment size by using a layer that only contains `scikit-learn`, `joblib`, and `pandas`.

---
### Step 2.5: Deploy the Intelligence Stack (`intelligence-infra.yaml`)
This stack imports ARNs from both S3 and Pipeline stacks.
```bash
aws cloudformation deploy --stack-name Quantifex-Intelligence \
  --template-file infrastructure/intelligence-infra.yaml \
  --parameter-overrides \
    PipelineStackName="Quantifex-Pipeline" \
    DatabaseUrl="<YOUR_DATABASE_URL>" \
    FinnhubApiKey="<YOUR_FINNHUB_API_KEY>" \
    SageMakerModelDataUrl="s3://quantifex-models-v1/finbert/model.tar.gz" \
    DecayLambda="0.0005" \
    SentimentWeight="0.3" \
  --capabilities CAPABILITY_IAM

  
> [!TIP]
> After deploying the Intelligence stack, CloudFormation will automatically loop through your `PremiumTickers` list and create **separate Serverless Endpoints** for each ticker. This ensures you only pay for compute when a specific stock is being analyzed.
```

## 3. Initialization (The "Seed" Phase)

1.  **Trigger Bootstrap**:
    ```bash
    aws lambda invoke --function-name quantifex-intelligence-infra-BootstrapHistory
    ```
2.  **Trigger Training**:
    ```bash
    aws lambda invoke --function-name quantifex-intelligence-infra-RetrainTrigger out.json
    ```

3.  **Populate Inference Prefix**:
    Once training finishes, the standalone **scaler** and **model** artifacts must be present in the flat prefix for the individual serverless endpoints to serve them:
    - **Models**: `s3://quantifex-models-v1/inference/models/[SYMBOL].tar.gz` (One per ticker)
    - **Scalers**: `s3://quantifex-models-v1/inference/models/[SYMBOL].scaler.gz`
    
    *Note: `train.py` now automatically uploads the scaler to this prefix if `model_bucket` is provided.*

---

## 4. Performance Auditing (Automated)

The system tracks every prediction and automatically verifies its accuracy:
- The **`AuditReconciler`** Lambda runs automatically every night at **Midnight UTC**.
- Run this dashboard query in Postgres to see your live hit rate:
```sql
SELECT 
    "signalRating", 
    COUNT(*) as total, 
    ROUND(AVG(CASE WHEN "isCorrect" THEN 1.0 ELSE 0.0 END) * 100, 2) as accuracy_pct
FROM "SignalAudits"
WHERE "isCorrect" IS NOT NULL
GROUP BY 1;
```
