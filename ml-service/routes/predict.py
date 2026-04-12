from __future__ import annotations

from typing import Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.predict import predict_single

router = APIRouter(tags=["prediction"])


class PredictionFeatures(BaseModel):
    gender: str
    Dependents: str
    tenure: int = Field(..., ge=0)
    PhoneService: str
    InternetService: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    MonthlyCharges: float = Field(..., ge=0)
    TotalCharges: float = Field(..., ge=0)
    num_services: int = Field(..., ge=0)
    tenure_group: str | None = None
    charge_level: str | None = None


@router.post("/predict")
def predict_route(payload: PredictionFeatures) -> Dict[str, float | bool | str]:
    try:
        return predict_single(payload.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
