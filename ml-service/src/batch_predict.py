from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd

from .batch_validation import BatchValidationResult, validate_batch_dataframe
from .config import MODEL_METADATA_PATH, TARGET_COLUMN, THRESHOLD
from .predict import load_artifacts, predict_proba_df
from .risk import classify_risk


def _load_processed_feature_columns() -> list[str]:
    metadata = json.loads(Path(MODEL_METADATA_PATH).read_text(encoding="utf-8"))
    feature_columns = metadata.get("feature_columns")
    if not isinstance(feature_columns, list) or not feature_columns:
        raise RuntimeError("Model metadata is missing processed feature columns.")
    return [str(column) for column in feature_columns]


def _is_processed_batch_input(df: pd.DataFrame, feature_columns: list[str]) -> bool:
    input_columns = set(df.columns)
    comparable_columns = input_columns - {TARGET_COLUMN}
    return bool(comparable_columns) and comparable_columns.issubset(set(feature_columns))


def _predict_processed_batch(
    df: pd.DataFrame,
    threshold: float,
    feature_columns: list[str],
) -> tuple[pd.DataFrame, List[Dict[str, Any]], BatchValidationResult]:
    scored_df = df.copy()
    working_df = scored_df.drop(columns=[TARGET_COLUMN], errors="ignore").copy()

    ignored_columns = sorted(column for column in working_df.columns if column not in set(feature_columns))
    if ignored_columns:
        working_df = working_df.drop(columns=ignored_columns, errors="ignore")

    warnings: list[str] = []
    if ignored_columns:
        warnings.append(f"{len(ignored_columns)} unused columns were ignored")

    missing_columns = [column for column in feature_columns if column not in working_df.columns]
    for column in missing_columns:
        working_df[column] = 0.0
    if missing_columns:
        warnings.append(f"Filled {len(missing_columns)} missing processed feature columns with 0")

    aligned_df = working_df[feature_columns].apply(pd.to_numeric, errors="coerce")
    invalid_numeric_columns = sorted(
        column for column in aligned_df.columns if aligned_df[column].isna().any()
    )
    if invalid_numeric_columns:
        raise ValueError(
            "Processed batch file contains non-numeric values in columns: "
            f"{invalid_numeric_columns[:10]}"
        )

    model, _ = load_artifacts()
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(aligned_df)[:, 1]
    elif hasattr(model, "predict"):
        probabilities = model.predict(aligned_df)
    else:
        raise RuntimeError("Loaded model does not implement predict_proba or predict.")

    aligned_df["probability"] = probabilities.astype(float)
    aligned_df["prediction"] = aligned_df["probability"] >= threshold
    aligned_df["risk"] = aligned_df["probability"].apply(lambda p: classify_risk(float(p), threshold))

    scored_df["probability"] = aligned_df["probability"].to_numpy()
    scored_df["prediction"] = aligned_df["prediction"].to_numpy()
    scored_df["risk"] = aligned_df["risk"].to_numpy()

    records = scored_df.to_dict(orient="records")
    validation = BatchValidationResult(
        dataframe=aligned_df[feature_columns],
        warnings=warnings,
        row_warnings=[],
        ignored_columns=ignored_columns,
    )
    return aligned_df, records, validation


def batch_predict(
    df: pd.DataFrame,
    threshold: float = THRESHOLD,
) -> tuple[pd.DataFrame, List[Dict[str, Any]], BatchValidationResult]:
    _, preprocessor = load_artifacts()
    processed_feature_columns = _load_processed_feature_columns()

    if _is_processed_batch_input(df, processed_feature_columns):
        return _predict_processed_batch(df, threshold, processed_feature_columns)

    validation = validate_batch_dataframe(df, preprocessor=preprocessor)
    scored_df = df.copy()
    normalized_scored_df = validation.dataframe.copy()

    probabilities = predict_proba_df(validation.dataframe)
    normalized_scored_df["probability"] = probabilities.astype(float)
    normalized_scored_df["prediction"] = normalized_scored_df["probability"] >= threshold
    normalized_scored_df["risk"] = normalized_scored_df["probability"].apply(
        lambda p: classify_risk(float(p), threshold)
    )

    scored_df["probability"] = normalized_scored_df["probability"].to_numpy()
    scored_df["prediction"] = normalized_scored_df["prediction"].to_numpy()
    scored_df["risk"] = normalized_scored_df["risk"].to_numpy()

    records = scored_df.to_dict(orient="records")
    return normalized_scored_df, records, validation
