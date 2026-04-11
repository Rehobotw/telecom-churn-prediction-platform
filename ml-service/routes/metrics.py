from fastapi import APIRouter, HTTPException

from src.metrics import get_metrics

router = APIRouter(tags=["metrics"])


@router.get("/metrics")
def metrics_route() -> dict:
    try:
        return get_metrics()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
