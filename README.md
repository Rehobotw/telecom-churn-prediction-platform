# Telecom Churn Prediction Platform

This repo runs as three parts:
- `frontend`: Vite/React dashboard
- `backend`: Express API gateway and persistence layer
- `ml-service`: FastAPI inference and analytics service

The platform now opens on the login page first. After successful authentication, the dashboard lives under `/app`.

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

Create local environment files from the shipped examples before running in development:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ml-service/.env.example ml-service/.env
```

## Docker Compose

You can build and start the full stack with:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost`
- Backend API: `http://localhost:3000/api`
- ML service: `http://localhost:8000`
