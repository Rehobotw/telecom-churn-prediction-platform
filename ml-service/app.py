from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.analytics import router as analytics_router
from routes.batch import router as batch_router
from routes.health import router as health_router
from routes.metrics import router as metrics_router
from routes.predict import router as predict_router
from src.predict import load_artifacts

app = FastAPI(
    title="Telecom Churn Prediction ML Service",
    version="1.0.0",
    description="FastAPI microservice for telecom churn prediction and dashboard analytics.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(predict_router)
app.include_router(batch_router)
app.include_router(analytics_router)
app.include_router(metrics_router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "Telecom Churn Prediction ML Service",
        "status": "running",
        "docs": "/docs",
    }


@app.on_event("startup")
def warmup_model() -> None:
    try:
        load_artifacts()
    except FileNotFoundError:
        pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

