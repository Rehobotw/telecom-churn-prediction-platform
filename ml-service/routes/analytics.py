from fastapi import APIRouter, HTTPException

from src.analytics import get_analytics_data

router = APIRouter(tags=["analytics"])


@router.get("/analytics")
def analytics_route() -> dict:
    try:
        return get_analytics_data()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
