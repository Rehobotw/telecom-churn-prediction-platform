# Telecom Churn Prediction Backend

Node.js/Express backend for a Telecom Customer Churn Prediction platform.

## Requirements

- Node.js (LTS recommended)
- npm
- A running Python ML API at `http://localhost:5000` (or another URL you configure)

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create a `.env` file in the backend root based on `.env.example`:

```bash
cp .env.example .env
```

Then adjust values as needed:

- `PORT`: Port for the Node.js server (default: `3000`)
- `ML_SERVICE_URL`: Base URL of the Python ML service (default: `http://localhost:5000`)
- `CUSTOMERS_FILE`: Path to customers.json (default: `src/data/customers.json`)

## Running the server

Start the server:

```bash
cd backend
npm start
```

The API will be available at `http://localhost:3000` (or your configured port).

## API Endpoints

### Health Check

- **GET** `/api/health`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "service": "telecom-churn-backend",
      "timestamp": "2026-04-12T00:00:00.000Z"
    }
  }
  ```

### Single Prediction

- **POST** `/api/predict`
- **Request body (JSON)**:

```json
{
  "tenure": 12,
  "monthlyCharges": 70.5,
  "contractType": "month-to-month",
  "internetService": "fiber optic",
  "paymentMethod": "electronic check",
  "name": "John Doe",
  "email": "john@example.com"
}
```

- **Validation**: Required fields: tenure, monthlyCharges, contractType, internetService, paymentMethod
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "customerId": "CUST-001",
      "churnProbability": 0.82,
      "churnPrediction": true,
      "riskLevel": "High",
      "timestamp": "2026-04-12T00:00:00.000Z",
      "customerData": { ... }
    }
  }
  ```

### Batch Prediction

- **POST** `/api/batch`
- **Request**: Multipart form-data with `file` field containing CSV
- **Response**: JSON with processed data and CSV download link

### Analytics

- **GET** `/api/analytics`
- **Response**: Dashboard analytics data from ML service

### Metrics

- **GET** `/api/metrics`
- **Response**: Model performance metrics from ML service

### Customers

- **GET** `/api/customers`
- **Query params**: `search`, `risk`, `contractType`
- **Response**: List of stored customer records

## Data Flow

1. Frontend sends requests to backend API endpoints.
2. Backend validates requests and forwards to ML service where needed.
3. Backend stores prediction results in local JSON file.
4. Backend serves stored data for customer management and dashboard.

## Error Handling

- Invalid input returns **400** with validation error details.
- Errors from the ML service are mapped to **5xx** responses.
- Unknown routes return **404**.