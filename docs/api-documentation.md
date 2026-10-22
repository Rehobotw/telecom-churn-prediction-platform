# Telecom Churn Platform API Documentation

This document reflects the current production-facing API design of the telecom churn platform, including:

- Node.js backend API (primary client-facing API)
- FastAPI ML service API (internal scoring/analytics API)
- Auth, password reset via SMTP, and notification settings integration
- Risk-band and intervention semantics used by the prediction endpoints

## 1. Service Topology

- Frontend calls the backend at /api/*.
- Backend orchestrates auth, persistence, and notification policy.
- Backend calls ml-service for model scoring and analytics.
- Backend stores customer and auth state in local JSON files (or mounted volumes in deployment).

Default local URLs:

- Frontend: http://localhost:80
- Backend: http://localhost:3000
- ML Service: http://localhost:8000

## 2. Access Model

The platform does not require user login sessions. All endpoints are open and accessible to the frontend client without authentication.

Available backend routes:

- GET /api/health
- GET /api/auth/preferences
- PATCH /api/auth/preferences
- POST /api/auth/test-email
- POST /api/auth/notification-alert
- POST /api/predict or /api/predictions
- POST /api/batch
- GET /api/analytics
- GET /api/metrics
- GET /api/model-info
- GET /api/customers


## 3. Backend API (Client-Facing)

### 3.1 Health

GET /api/health

Response 200:

```json
{
	"success": true,
	"data": {
		"status": "ok",
		"service": "telecom-churn-backend",
		"timestamp": "2026-04-13T10:20:30.000Z"
	}
}
```

### 3.2 Notification Settings

GET /api/auth/preferences

Response 200:

```json
{
	"success": true,
	"data": {
		"highRiskAlerts": true,
		"dailyReports": false,
		"notificationEmails": ["admin@example.com"],
		"autoRetrain": "Monthly"
	}
}
```

### 3.3 Notification Settings and SMTP Test


PATCH /api/auth/preferences

Request:

```json
{
	"highRiskAlerts": true,
	"dailyReports": false,
	"notificationEmails": ["ops@example.com", "retention@example.com"],
	"autoRetrain": "Monthly"
}
```

Response returns normalized/sanitized persisted preferences.

POST /api/auth/test-email

Request (optional fields):

```json
{
	"toEmail": "ops@example.com",
	"subject": "SMTP connectivity check"
}
```

If toEmail is omitted, authenticated account email is used.

Daily reports are sent automatically at the configured `DAILY_REPORT_TIME` when `dailyReports` is enabled and the backend scheduler is running.

### 3.5 Single Prediction

POST /api/predict (alias: POST /api/predictions)

Request schema (validated):

```json
{
	"customerName": "Jane Doe",
	"email": "jane@example.com",
	"gender": "Female",
	"dependents": false,
	"tenure": 24,
	"contractType": "Month-to-month",
	"paperlessBilling": true,
	"paymentMethod": "Electronic check",
	"phoneService": true,
	"internetService": "Fiber optic",
	"monthlyCharges": 89.5,
	"num_services": 3
}
```

Response 200:

```json
{
	"success": true,
	"data": {
		"id": "uuid",
		"customerId": "uuid",
		"name": "Jane Doe",
		"email": "jane@example.com",
		"tenure": 24,
		"monthlyCharges": 89.5,
		"contractType": "Month-to-month",
		"internetService": "Fiber optic",
		"paymentMethod": "Electronic check",
		"churnProbability": 0.78,
		"churnPrediction": true,
		"riskLevel": "High",
		"predictionDate": "2026-04-13T10:20:30.000Z"
	}
}
```

Notification behavior after prediction:

- High-risk alert email sent if highRiskAlerts = true.
- Summary email considered if dailyReports = true.

### 3.6 Batch Prediction

POST /api/batch

- Multipart/form-data with field name file (CSV only).
- Backend forwards CSV to ml-service /batch_predict.
- Backend persists results and returns processed rows + warnings + CSV content.

Response shape:

```json
{
	"success": true,
	"data": {
		"processed": 123,
		"results": [],
		"csvContent": "customerId,...",
		"warnings": [],
		"rowWarnings": [],
		"ignoredColumns": []
	}
}
```

### 3.7 Analytics, Metrics, Model Info, Customers

GET /api/analytics

- Backend proxy for ml-service analytics, with backend response envelope.

GET /api/metrics

- Returns model quality metrics and ROC/confusion matrix payload.

GET /api/model-info

- Returns selected model and metadata.

GET /api/customers

- Returns persisted prediction records with filtering support.

## 4. ML Service API (Internal)

Base URL: http://ml-service:8000 (inside Docker network)

### Endpoints

- GET /health
- POST /predict
- POST /batch_predict
- GET /analytics
- GET /metrics
- GET /model-info

### POST /predict input schema

```json
{
	"gender": "Female",
	"Dependents": "No",
	"tenure": 24,
	"PhoneService": "Yes",
	"InternetService": "Fiber optic",
	"Contract": "Month-to-month",
	"PaperlessBilling": "Yes",
	"PaymentMethod": "Electronic check",
	"MonthlyCharges": 89.5,
	"TotalCharges": 2148,
	"num_services": 3,
	"tenure_group": "established",
	"charge_level": "high"
}
```

Response:

```json
{
	"probability": 0.78,
	"prediction": true,
	"risk": "High"
}
```

## 5. Error Handling Contract

Backend standardized error response:

```json
{
	"success": false,
	"message": "Error message"
}
```

Additional details may be included for 4xx and development environments.

## 6. Environment and Security Notes

Key backend env vars:

- AUTH_SECRET
- SESSION_COOKIE_NAME
- SESSION_TTL_MS
- EMAIL_HOST
- EMAIL_PORT
- EMAIL_USERNAME
- EMAIL_PASSWORD
- EMAIL_FROM
- EMAIL_RETRY_ATTEMPTS
- RESET_CODE_TTL_MINUTES
- RESET_REQUEST_WINDOW_MS
- RESET_REQUEST_MAX_ATTEMPTS
- HIGH_RISK_THRESHOLD

Security controls currently implemented:

- Password hashing via scrypt.
- Reset code hashing via scrypt.
- Timed reset expiry.
- Rate-limited forgot-password requests.
- Generic forgot-password responses.
- Cookie-based authenticated session for protected APIs.

