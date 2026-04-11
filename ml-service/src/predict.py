from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

import joblib
import pandas as pd

from .config import MODEL_PATH, PREPROCESSOR_PATH, THRESHOLD
from .preprocessing import transform_data
from .risk import classify_risk


@lru_cache(maxsize=1)
def load_artifacts():
    if not Path(MODEL_PATH).exists() or not Path(PREPROCESSOR_PATH).exists():
        raise FileNotFoundError("Model or preprocessor artifact is missing. Train the model first.")

    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    return model, preprocessor


def predict_proba_df(input_df: pd.DataFrame):
    model, preprocessor = load_artifacts()
    transformed = transform_data(preprocessor, input_df)
    return model.predict_proba(transformed)[:, 1]


def predict_single(input_data: Dict[str, Any], threshold: float = THRESHOLD) -> Dict[str, Any]:
    input_df = pd.DataFrame([input_data])
    probability = float(predict_proba_df(input_df)[0])
    prediction = probability >= threshold
    return {
        "probability": probability,
        "prediction": bool(prediction),
        "risk": classify_risk(probability=probability, threshold=threshold),
    }

