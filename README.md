# Telecom Churn Prediction Platform

This repo runs as three parts:
- `frontend`: Vite/React dashboard
- `backend`: Express API gateway and persistence layer
- `ml-service`: FastAPI inference and analytics service

## Local Run

Run each service in its own terminal:

```bash
cd ml-service && pip install -r requirements.txt && uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd backend && npm install && npm start
```

```bash
cd frontend && npm install && npm run dev
```

Frontend requests are proxied to the backend at `/api`, and the backend forwards ML requests to `http://localhost:8000`.

## Docker Compose

You can also start the full stack with:

```bash
docker compose up
```
