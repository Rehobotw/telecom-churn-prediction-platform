from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

import joblib
import pandas as pd

from .config import MODEL_METADATA_PATH, MODEL_PATH, RAW_DATA_PATH, TARGET_COLUMN


def _load_feature_importance() -> List[Dict[str, Any]]:
    metadata_path = Path(MODEL_METADATA_PATH)
    if not metadata_path.exists():
        return []

    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    selected_model = metadata.get("selected_model")
    feature_names = metadata.get("feature_columns", [])

    if selected_model == "logistic_regression":
        model_path = metadata.get("logistic_regression_path")
    elif selected_model == "random_forest":
        model_path = metadata.get("random_forest_path")
    else:
        model_path = metadata.get("model_path") or str(MODEL_PATH)

    if not model_path or not Path(model_path).exists():
        return []

    model = joblib.load(model_path)
    if hasattr(model, "feature_importances_"):
        raw_values = list(model.feature_importances_)
    elif hasattr(model, "coef_"):
        raw_values = [abs(float(value)) for value in model.coef_[0]]
    else:
        return []

    if not feature_names:
        feature_names = [f"feature_{index + 1}" for index in range(len(raw_values))]

    total_importance = sum(raw_values)
    normalized_values = (
        [value / total_importance for value in raw_values]
        if total_importance > 0
        else [0.0 for _ in raw_values]
    )

    ranked = sorted(
        [
            {"feature": feature, "importance": float(importance)}
            for feature, importance in zip(feature_names, normalized_values)
        ],
        key=lambda item: item["importance"],
        reverse=True,
    )
    return ranked


def _infer_churn_series(df: pd.DataFrame) -> pd.Series:
    if TARGET_COLUMN not in df.columns:
        return pd.Series([0 for _ in range(len(df))])

    churn = df[TARGET_COLUMN]
    if churn.dtype == object:
        churn = churn.map({"Yes": 1, "No": 0}).fillna(0)
    return churn.astype(float)


def _build_trend(df: pd.DataFrame, churn: pd.Series) -> List[Dict[str, Any]]:
    date_columns = [
        c for c in df.columns if "date" in c.lower() or "month" in c.lower() or "time" in c.lower()
    ]
    if not date_columns:
        return []

    date_col = date_columns[0]
    trend_df = df.copy()
    trend_df["_date"] = pd.to_datetime(trend_df[date_col], errors="coerce")
    trend_df["_churn"] = churn.values
    trend_df = trend_df.dropna(subset=["_date"])

    if trend_df.empty:
        return []

    trend_df["period"] = trend_df["_date"].dt.to_period("M").astype(str)
    grouped = trend_df.groupby("period", as_index=False)["_churn"].mean()

    return [
        {"period": row["period"], "churn_rate": float(row["_churn"])}
        for _, row in grouped.iterrows()
    ]


def get_analytics_data(data_path: Path | str = RAW_DATA_PATH, predictions_today: int | None = None) -> Dict[str, Any]:
    df = pd.read_csv(data_path)
    churn = _infer_churn_series(df)

    churn_rate = float(churn.mean()) if len(churn) else 0.0
    retention_rate = float(1 - churn_rate)
    total_customers = int(len(df))

    return {
        "total_customers": total_customers,
        "churn_rate": churn_rate,
        "retention_rate": retention_rate,
        "predictions_today": int(predictions_today if predictions_today is not None else total_customers),
        "trend": _build_trend(df, churn),
        "feature_importance": _load_feature_importance(),
        "selected_model": json.loads(Path(MODEL_METADATA_PATH).read_text(encoding="utf-8")).get("selected_model")
        if Path(MODEL_METADATA_PATH).exists()
        else None,
    }
