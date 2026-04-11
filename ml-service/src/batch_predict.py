from __future__ import annotations

from typing import Any, Dict, List

import pandas as pd

from .config import THRESHOLD
from .predict import predict_proba_df
from .risk import classify_risk


def batch_predict(df: pd.DataFrame, threshold: float = THRESHOLD) -> tuple[pd.DataFrame, List[Dict[str, Any]]]:
    scored_df = df.copy()

    probabilities = predict_proba_df(scored_df)
    scored_df["probability"] = probabilities.astype(float)
    scored_df["prediction"] = scored_df["probability"] >= threshold
    scored_df["risk"] = scored_df["probability"].apply(lambda p: classify_risk(float(p), threshold))

    records = scored_df.to_dict(orient="records")
    return scored_df, records
