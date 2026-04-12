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


def _align_input_to_preprocessor(input_df: pd.DataFrame, preprocessor: Any) -> pd.DataFrame:
    X = input_df.copy()
    expected_columns = list(preprocessor.feature_names_in_)

    def _is_missing_or_blank(column_name: str) -> bool:
        if column_name not in X.columns:
            return True

        non_null = X[column_name].dropna()
        if non_null.empty:
            return True

        return bool(non_null.astype(str).str.strip().eq("").all())

    # Derive engineered columns when the trained preprocessor expects them.
    if "tenure_group" in expected_columns and _is_missing_or_blank("tenure_group") and "tenure" in X.columns:
        X["tenure_group"] = pd.cut(
            X["tenure"],
            bins=[0, 12, 24, 48, 72],
            labels=["new", "early", "established", "loyal"],
            include_lowest=True,
        )

    if (
        "charge_level" in expected_columns
        and _is_missing_or_blank("charge_level")
        and "MonthlyCharges" in X.columns
    ):
        X["charge_level"] = pd.cut(
            X["MonthlyCharges"],
            bins=[0, 40, 80, 120],
            labels=["low", "medium", "high"],
            include_lowest=True,
        )

    for column in expected_columns:
        if column not in X.columns:
            X[column] = None

    return X[expected_columns]


def predict_proba_df(input_df: pd.DataFrame):
    try:
        model, preprocessor = load_artifacts()
        input_aligned = _align_input_to_preprocessor(input_df, preprocessor)
        transformed = transform_data(preprocessor, input_aligned)

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(transformed)
            return probabilities[:, 1]

        if hasattr(model, "predict"):
            return model.predict(transformed)

        raise RuntimeError("Loaded model does not implement predict_proba or predict.")
    except Exception as exc:
        raise RuntimeError(f"Model failed to produce prediction: {exc}") from exc


def predict_single(input_data: Dict[str, Any], threshold: float = THRESHOLD) -> Dict[str, Any]:
    try:
        input_df = pd.DataFrame([input_data])
        probability = float(predict_proba_df(input_df)[0])
        prediction = probability >= threshold
        return {
            "probability": probability,
            "prediction": bool(prediction),
            "risk": classify_risk(probability=probability, threshold=threshold),
        }
    except Exception as exc:
        raise RuntimeError(f"Unable to generate prediction: {exc}") from exc
