from fastapi import APIRouter, HTTPException

from src.model_info import get_model_info

router = APIRouter(tags=["metrics"])


@router.get("/model-info")
def model_info_route() -> dict:
    try:
        return get_model_info()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
