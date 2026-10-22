# Telecom Churn Prediction Platform Architecture

The platform uses a React frontend, an Express API, and a FastAPI machine-learning service.

## Services

### Frontend

The React + TypeScript application provides a public landing page and dashboard views for customer analytics, predictions, CSV batch scoring, and model evaluation. It calls the backend API for application data.

### Backend API

The Node.js + Express service validates prediction inputs, forwards scoring and analytics requests to the ML service, stores prediction records in JSON, and handles CSV upload/download data.

### ML service

The FastAPI service loads the preprocessing and model artifacts. It serves single and batch predictions, customer analytics, model metrics, and model metadata.

## Data flows

### Single prediction

1. The frontend submits customer attributes to the Express prediction endpoint.
2. Express validates the payload and requests a score from FastAPI.
3. FastAPI returns a probability, prediction, and risk level.
4. Express adds record identifiers and a timestamp, stores the record, and returns it to the frontend.

### CSV batch prediction

1. The frontend uploads a CSV file to Express.
2. Express forwards the file to FastAPI for validation and scoring.
3. Express stores the resulting customer records and returns results, validation warnings, and CSV content.

### Analytics and evaluation

The frontend requests analytics, model metrics, or model metadata from Express. Express proxies these read requests to the corresponding FastAPI endpoints.

## Deployment

Docker Compose runs the frontend (Nginx), backend (Express), and ML service (FastAPI). Health checks gate service startup, and Docker volumes persist customer records and uploaded files.

## Technology stack

- Frontend: React, TypeScript, Tailwind CSS, Vite, Nginx
- Backend: Node.js, Express, Joi, Multer
- ML: Python, FastAPI, pandas, scikit-learn, joblib
- Infrastructure: Docker, Docker Compose
