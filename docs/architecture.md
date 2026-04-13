# Telecom Churn Prediction Platform Architecture

This document describes the current state architecture as implemented in the repository, including runtime data flow, security model, risk-decision translation, and deployment topology.

## 1. Architecture Summary

The platform is implemented as a three-service system:

1. Frontend (React + Vite + Nginx)
2. Backend API (Node.js + Express)
3. ML Service (FastAPI + scikit-learn artifacts)

Core principle:

- The model outputs a probability score.
- The platform converts score to business risk bands.
- Risk band drives intervention actions and notification policy.

## 2. Logical Components

### Frontend

- Provides login, single prediction, batch upload, analytics dashboards, customer views, and settings.
- Uses backend API only (never directly calls protected ML endpoints in production path).
- Persists session hints and preference cache locally, but backend is source of truth for account preferences.

### Backend API

- Handles authentication, session cookies, and authorization gates.
- Validates prediction payloads.
- Maps frontend request fields into ML service schema.
- Persists prediction outputs and account/auth profile in JSON data store.
- Executes SMTP-based reset and notification workflows.
- Applies notification settings policy (high-risk alerts and summary emails).

### ML Service

- Hosts trained model and preprocessing artifacts.
- Exposes prediction and analytics endpoints.
- Returns probabilities, predicted label, and risk level.
- Serves model metrics and metadata.

## 3. Data and Control Flow

### 3.1 Single Prediction Flow

1. User submits prediction form in frontend.
2. Backend validates request fields (Joi).
3. Backend transforms payload to ML feature schema.
4. Backend calls ml-service /predict.
5. ML service returns probability, prediction, risk.
6. Backend enriches response with identity and timestamps.
7. Backend stores row in customers data store.
8. Backend evaluates notification policy:
   - send high-risk alert if enabled
   - send summary email if enabled
9. Backend returns response to frontend.

### 3.2 Batch Prediction Flow

1. User uploads CSV in frontend.
2. Backend accepts file via multer.
3. Backend forwards CSV to ml-service /batch_predict.
4. Backend maps row outputs and assigns customer IDs.
5. Backend stores batch results.
6. Backend builds downloadable CSV content.
7. Backend applies notification policy for batch results.
8. Backend returns processed rows and warning metadata.

### 3.3 Password Reset Flow (Email-Based)

1. User submits forgot-password email.
2. Backend validates email format and applies reset rate limit.
3. Backend generates secure 6-digit code.
4. Backend stores only hashed code + salt + expiry timestamp.
5. Backend renders HTML template and sends code through SMTP.
6. Backend returns generic success response (no code leakage).
7. User submits email + code + new password.
8. Backend verifies hash and expiry, updates password hash.

## 4. Risk Classification and Decision Layer

The platform currently operationalizes a three-band mapping:

- Low Risk: 0.00 to 0.33
- Medium Risk: 0.34 to 0.66
- High Risk: 0.67 to 1.00

Decision usage:

- High risk drives immediate retention action and alert notifications.
- Medium risk routes to proactive but lower-cost intervention.
- Low risk stays in baseline engagement and monitoring.

Important implementation note:

- These cutoffs are treated as operational defaults and should be calibrated periodically against realized outcomes, channel capacity, and intervention economics.

## 5. Persistence Model

Current storage strategy (file-based):

- Backend auth profile file:
  - account email
  - password hash + salt
  - reset hash + salt + expiry
  - notification preferences
- Backend customers file:
  - prediction history and customer snapshots

Deployment configuration mounts persistent volumes for:

- /app/src/data
- /app/uploads

This preserves state across container recreation.

## 6. Security Architecture

Implemented controls:

- Password hashing with scrypt.
- Reset code hashing (never stored in raw form).
- Reset TTL and reset request rate limiting.
- Generic forgot-password response contract.
- Cookie-based auth for protected routes.
- Email validation and SMTP error handling with retries.

Current gap to track:

- Single-user account model backed by JSON file is suitable for prototype/small deployment but should move to a transactional database for multi-user enterprise deployment.

## 7. Deployment Topology (Docker Compose)

Current deployment composition:

- ml-service container:
  - FastAPI on 8000
  - healthcheck on /health
- backend container:
  - Express on 3000
  - healthcheck on /api/health
  - depends on healthy ml-service
  - mounted data and upload volumes
- frontend container:
  - Nginx on 80
  - reverse proxy /api to backend
  - healthcheck on /
  - depends on healthy backend

Operational improvements already applied:

- restart unless-stopped
- health-gated dependency startup
- env-driven SMTP/auth/reset settings

## 8. Technology Stack by Layer

- Frontend: React, TypeScript, Tailwind, Vite, Nginx
- Backend: Node.js, Express, Joi, Multer, Nodemailer
- ML: Python, FastAPI, pandas, scikit-learn, joblib
- Infrastructure: Docker, Docker Compose

## 9. Decision-Engine Alignment

The current architecture supports the strategic requirement to treat churn scoring as a decision system rather than a pure classifier:

1. Probability is preserved end-to-end.
2. Probability is translated into operational risk bands.
3. Risk bands drive deterministic action policies.
4. Notification settings govern communication execution.

This gives a complete score-to-action loop and prepares the system for later threshold calibration governance.

## 10. Recommended Next Architecture Iteration

1. Replace JSON storage with relational persistence.
2. Add asynchronous job queue for email and batch post-processing.
3. Add scheduled digest pipeline for true daily summaries.
4. Add model threshold calibration service or admin controls.
5. Add audit trails for risk decisions and intervention outcomes.

