# Telecom Churn Prediction Backend

Node.js/Express backend for a Telecom Customer Churn Prediction platform.

## Requirements

- Node.js (LTS recommended)
- npm
- A running Python ML API reachable from backend (default: `http://ml-service:8000/predict` on Docker internal network)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Then adjust values as needed:

- `PORT`: Port for the Node.js server (default: `3000`)
- `PYTHON_ML_API_URL`: URL of the Python ML prediction endpoint (default: `http://ml-service:8000/predict`)

## Running the server

Start the server:

```bash
node server.js
```

The API will be available at `http://localhost:3000` (or your configured port).

## API Endpoints

### Health Check

- **GET** `/api/health`
- **Response**:
  - `status`: `ok`
  - `timestamp`: ISO timestamp
  - `service`: service name

### Predict Churn

- **POST** `/api/predict`
- **Request body (JSON)**:

```json
{
  "tenure": 12,
  "monthlyCharges": 70.5,
  "contractType": "month-to-month",
  "internetService": "fiber optic"
}
```

- **Validation (all required)**:
  - `tenure`: integer, >= 0
  - `monthlyCharges`: number, >= 0
  - `contractType`: one of `month-to-month`, `one-year`, `two-year`
  - `internetService`: one of `dsl`, `fiber optic`, `none`

- **Behavior**:
  - Forwards the validated payload to the configured Python ML API (`PYTHON_ML_API_URL`) using Axios
  - Expects a JSON response:

```json
{
  "prediction": "Yes",
  "probability": 0.83
}
```

- **Response**:
  - Returns the `prediction` and `probability` fields from the ML service response.

## Error Handling

- Invalid input returns **400** with validation error details.
- Errors from the ML service are mapped to **5xx** responses.
- Unknown routes return **404**.

