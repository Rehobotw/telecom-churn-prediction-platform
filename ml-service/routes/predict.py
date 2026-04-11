from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from src.predict import predict_single

router = APIRouter(tags=["prediction"])


@router.post("/predict")
def predict_route(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        return predict_single(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
