# Telecom Churn Prediction Backend

Node.js/Express API for customer analytics, churn predictions, CSV batch scoring, and model information.

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm start
```

The backend listens on port `3000` by default. Configure `ML_SERVICE_URL` to point to the FastAPI service and `CORS_ORIGIN` to the frontend origin. `CUSTOMERS_FILE`, `UPLOADS_DIR`, and `MAX_UPLOAD_SIZE_BYTES` configure local customer persistence and CSV uploads.

## API Endpoints

- `GET /api/health` — backend health
- `POST /api/predict` and `POST /api/predictions` — validate and score one customer
- `POST /api/batch` — score a CSV upload and return result rows and CSV content
- `GET /api/analytics` — analytics from the ML service
- `GET /api/metrics` — model evaluation metrics
- `GET /api/model-info` — selected model metadata
- `GET /api/customers` — persisted customer records, with `search`, `risk`, and `contractType` filters

See [API documentation](../docs/api-documentation.md) for request and response details.
