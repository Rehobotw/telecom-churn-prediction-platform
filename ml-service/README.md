# Telecom Churn ML Service

Production-grade FastAPI microservice for telecom churn prediction and dashboard analytics.

## Features

- Modular training and inference pipeline
- Reusable preprocessing with ColumnTransformer
- Single and batch churn prediction endpoints
- Train/test dataset access endpoints
- Risk banding: High, Medium, Low
- Saved evaluation metrics and feature importance for dashboards

## Structure

- src/: core ML logic (preprocessing, train, evaluate, predict, analytics)
- routes/: FastAPI route modules
- models/: persisted model, preprocessor, metrics, and feature importance artifacts
- app.py: FastAPI application entrypoint

## Setup

1. Install dependencies:

	pip install -r requirements.txt

2. Train model artifacts:

	python -m src.train

3. Generate evaluation metrics:

	python -m src.evaluate

4. Run local sample inference check:

	python -m src.test_sample

5. Start API:

	uvicorn app:app --host 0.0.0.0 --port 8000 --reload

## API Endpoints

- GET /health
- POST /predict
- POST /batch_predict
- GET /data/train
- GET /data/test
- GET /analytics
- GET /metrics

## Prediction Response

{
  "probability": 0.82,
  "prediction": true,
  "risk": "High"
}

## Analytics Response

{
  "total_customers": 12486,
  "churn_rate": 0.142,
  "retention_rate": 0.858,
  "predictions_today": 12486,
  "trend": [],
  "feature_importance": []
}
