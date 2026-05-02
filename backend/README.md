# Telecom Churn Prediction Backend

Node.js/Express backend for a Telecom Customer Churn Prediction platform.

## Requirements

- Node.js (LTS recommended)
- npm
- A running Python ML API at `http://localhost:8000` (or another URL you configure)

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
- `ML_SERVICE_URL`: Base URL of the Python ML service (default: `http://localhost:8000`)
- `CUSTOMERS_FILE`: Path to customers.json (default: `src/data/customers.json`)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM`: SMTP settings for password reset and notification emails. If `EMAIL_FROM` is omitted, the backend falls back to `EMAIL_USERNAME` and then `ADMIN_EMAIL`.
- `EMAIL_SECURE`: Set to `true` when using SMTPS on port `465`; default is `false` for STARTTLS on `587`
- `EMAIL_TLS_REJECT_UNAUTHORIZED`: Whether to validate SMTP TLS certificates. Set to `false` only for trusted internal test environments.
- `EMAIL_RETRY_ATTEMPTS`: Number of retries for SMTP send failures
- `EMAIL_TIMEOUT_MS`: SMTP connection/socket timeout so reset codes and alerts fail fast when delivery is unavailable
- `EXPOSE_RESET_CODE_IN_RESPONSE`: Only enable this explicitly for local debugging. Do not enable in production.
- `FRONTEND_BASE_URL` and `RESET_LINK_PATH`: Used to build the password reset link included with the 6-digit reset code
- `DAILY_REPORT_TIME`: Local time for scheduled daily notification emails in `HH:MM` format (default `09:00`)
- `RESET_CODE_TTL_MINUTES`: Password reset code expiry (default `15`)
- `RESET_REQUEST_WINDOW_MS` and `RESET_REQUEST_MAX_ATTEMPTS`: Rate limiting for forgot-password requests

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

### Auth and Notification Settings

- **POST** `/api/auth/forgot-password`: Sends a reset email with a 6-digit code and reset link. If SMTP delivery fails and `EXPOSE_RESET_CODE_IN_RESPONSE=true`, response includes `data.resetCode` for local/dev fallback. Otherwise the request fails with a clear SMTP configuration error.
- **POST** `/api/auth/reset-password`: Completes password reset using emailed code
- **PATCH** `/api/auth/preferences`: Updates notification settings (`highRiskAlerts`, `dailyReports`, `notificationEmails`)
- **POST** `/api/auth/test-email`: Sends a test email to verify SMTP configuration
- **POST** `/api/auth/notification-alert`: Sends an immediate notification alert to saved recipients and the login email

High-risk alerts are sent immediately after qualifying predictions. Daily reports are sent automatically when `dailyReports` is enabled and the scheduled job is running.

## Data Flow

1. Frontend sends requests to backend API endpoints.
2. Backend validates requests and forwards to ML service where needed.
3. Backend stores prediction results in local JSON file.
4. Backend serves stored data for customer management and dashboard.

## Error Handling

- Invalid input returns **400** with validation error details.
- Errors from the ML service are mapped to **5xx** responses.
- Unknown routes return **404**.
