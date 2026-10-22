# Telecom Churn Platform API

The React frontend calls the Express API. The backend persists prediction records and proxies scoring and analytics requests to the FastAPI ML service.

## Service URLs

- Frontend: `http://localhost:5173` during development, `http://localhost` with Docker Compose
- Backend: `http://localhost:3000`
- ML service: `http://localhost:8000`

## Backend API

### Health

`GET /api/health`

### Single prediction

`POST /api/predict` (also available at `/api/predictions`)

Required input fields include `gender`, `dependents`, `tenure`, `monthlyCharges`, `contractType`, `paperlessBilling`, `paymentMethod`, `phoneService`, `internetService`, and `num_services`. `customerName`, `name`, and `email` are optional identity fields. The prediction form does not require contact information.

The response contains the customer record, churn probability, predicted label, risk level, and prediction timestamp. The backend stores the result in its customer data file.

### CSV batch prediction

`POST /api/batch`

Send multipart form data with a CSV file in the `file` field. The response includes processed rows, validation warnings, ignored columns, and CSV content for download.

### Analytics and model information

- `GET /api/analytics` — customer and churn analytics
- `GET /api/metrics` — model evaluation metrics
- `GET /api/model-info` — selected model metadata
- `GET /api/customers` — persisted prediction records; supports `search`, `risk`, and `contractType` filters

## FastAPI ML Service

Base URL: `http://localhost:8000` locally, or `http://ml-service:8000` in Docker.

- `GET /health`
- `POST /predict`
- `POST /batch_predict`
- `GET /analytics`
- `GET /metrics`
- `GET /model-info`

## Errors

Backend errors use a JSON response with `success: false` and a message. Invalid prediction payloads return HTTP 400; upstream ML service failures return a server error.
