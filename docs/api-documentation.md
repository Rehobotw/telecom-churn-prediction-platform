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

## 2. Authentication and Session Model

Session mechanism:

- Cookie-based auth using signed session token.
- Cookie name: churn_session (configurable).
- Protected backend routes require a valid session cookie.

Unprotected backend routes:

- GET /api/health
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

Protected backend routes:

- POST /api/auth/logout
- GET /api/auth/me
- PATCH /api/auth/email
- PATCH /api/auth/password
- PATCH /api/auth/preferences
- POST /api/auth/test-email
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

### 3.2 Auth and Account

POST /api/auth/login

Request:

```json
{
	"email": "admin@example.com",
	"password": "your-password",
	"rememberMe": true
}
```

Response 200:

```json
{
	"success": true,
	"data": {
		"email": "admin@example.com",
		"rememberMe": true
	}
}
```

POST /api/auth/logout

- Requires session.
- Clears auth cookie.

GET /api/auth/me

- Requires session.
- Returns account email and current notification preferences.

Response 200:

```json
{
	"success": true,
	"data": {
		"authenticated": true,
		"email": "admin@example.com",
		"profile": {
			"email": "admin@example.com",
			"preferences": {
				"highRiskAlerts": true,
				"dailyReports": false,
				"notificationEmails": ["admin@example.com"],
				"autoRetrain": "Monthly"
			}
		}
	}
}
```

PATCH /api/auth/email

Request:

```json
{
	"email": "new-admin@example.com"
}
```

PATCH /api/auth/password

Request:

```json
{
	"currentPassword": "old-password",
	"newPassword": "new-password-123"
}
```

### 3.3 Password Reset via SMTP

POST /api/auth/forgot-password

Request:

```json
{
	"email": "admin@example.com"
}
```

Response behavior:

- Returns a generic success message for anti-enumeration behavior when the request is accepted.
- If the email does not match the configured account, the endpoint still returns a generic success response without sending mail.
- Reset code is not returned in normal API responses; only explicit local-debug fallback mode can include it.
- Reset code is generated securely, hashed at rest, and expires after configured TTL (default 15 minutes).
- Reset requests are rate-limited per email+IP window.
- If SMTP delivery fails, the endpoint returns a clear SMTP configuration error unless `EXPOSE_RESET_CODE_IN_RESPONSE=true` is explicitly enabled for local debugging.

Response 200:

```json
{
	"success": true,
	"data": {
		"email": "admin@example.com"
	},
	"message": "If the account exists, a reset code has been sent by email"
}
```

POST /api/auth/reset-password

Request:

```json
{
	"email": "admin@example.com",
	"resetCode": "123456",
	"newPassword": "new-password-123"
}
```

Possible errors:

- 400 invalid request
- 400 no active reset request
- 400 reset code expired
- 400 invalid reset code

### 3.4 Notification Settings and SMTP Test

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

