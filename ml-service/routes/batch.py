from __future__ import annotations

import io
from typing import Any, Dict

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from src.batch_predict import batch_predict

router = APIRouter(tags=["prediction"])


@router.post("/batch_predict")
async def batch_predict_route(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a CSV file.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    try:
        df = pd.read_csv(io.BytesIO(content))
        _, records, validation = batch_predict(df)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "count": len(records),
        "results": records,
        "warnings": validation.warnings,
        "row_warnings": validation.row_warnings,
        "ignored_columns": validation.ignored_columns,
    }
