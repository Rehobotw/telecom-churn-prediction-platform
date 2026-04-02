"""Preprocessing logic mirroring the telecom churn notebooks.

This module implements the exact sequence of operations used in
`02_preprocessing_and_feature_engineering.ipynb`:

- Load the raw CSV dataset.
- Drop unused identifier/legacy columns.
- Engineer tenure-based and service-usage features.
- Encode the binary target variable.
- One-hot encode categorical features with `drop_first=True`.
- Standardize numeric features with ``StandardScaler``.
- Persist a clean, model-ready CSV for downstream modeling.
"""

from __future__ import annotations

from pathlib import Path
from typing import Tuple

import joblib
import pandas as pd
from sklearn.preprocessing import StandardScaler

from .config import (
    RAW_DATA_PATH,
    PROCESSED_DATA_PATH,
    TARGET_COLUMN,
    MODELS_DIR,
    PREPROCESSOR_SCALER_PATH,
    DROP_COLUMNS,
    SERVICE_COLUMNS,
    TENURE_BINS,
    TENURE_LABELS,
    CHARGE_BINS,
    CHARGE_LABELS,
    CATEGORICAL_COLUMNS,
    NUMERIC_FEATURES_TO_SCALE,
)


def load_data(path: Path | str = RAW_DATA_PATH) -> pd.DataFrame:
    """Load the raw telecom churn dataset.

    Parameters
    ----------
    path:
        Path to the raw CSV. Defaults to :data:`RAW_DATA_PATH`.

    Returns
    -------
    DataFrame
        Raw dataset as loaded from CSV.
    """

    return pd.read_csv(path)


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean the dataset to match the preprocessing notebook.

    Operations
    ----------
    - Drop columns: ``customerID``, ``TotalCharges``, ``MultipleLines``,
      ``SeniorCitizen``, ``Partner``.
    """

    df = df.copy()
    for col in DROP_COLUMNS:
        if col in df.columns:
            df.drop(columns=[col], inplace=True)
    return df


def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    """Apply feature engineering steps from the notebook.

    Operations
    ----------
        - Create ``tenure_group`` from ``tenure`` using notebook bins.
    - Create ``num_services`` as the count of service columns with value
      ``"Yes"`` and drop the original service columns.
        - Bin ``MonthlyCharges`` into ``charge_level``.
    """

    df = df.copy()

    # Tenure group (exact notebook binning)
    if "tenure" in df.columns:
        df["tenure_group"] = pd.cut(
            df["tenure"],
            bins=TENURE_BINS,
            labels=TENURE_LABELS,
        )

    # Number of optional services subscribed to
    if all(col in df.columns for col in SERVICE_COLUMNS):
        df["num_services"] = (df[SERVICE_COLUMNS] == "Yes").sum(axis=1)
        df.drop(columns=SERVICE_COLUMNS, inplace=True)

    # Monthly charge level bins (exact notebook binning)
    if "MonthlyCharges" in df.columns:
        df["charge_level"] = pd.cut(
            df["MonthlyCharges"],
            bins=CHARGE_BINS,
            labels=CHARGE_LABELS,
        )

    return df


def encode_features(df: pd.DataFrame) -> pd.DataFrame:
    """Encode the target and categorical features.

    Steps
    -----
    - Map ``Churn`` from ``{"No", "Yes"}`` to ``{0, 1}`` if present.
    - One-hot encode selected categorical columns with ``drop_first=True``
      using :func:`pandas.get_dummies`, exactly as in the notebook.
    """

    df = df.copy()

    # Encode target if present (training data only)
    if TARGET_COLUMN in df.columns and df[TARGET_COLUMN].dtype == object:
        mapping_dict = {"No": 0, "Yes": 1}
        df[TARGET_COLUMN] = df[TARGET_COLUMN].map(mapping_dict)

    # One-hot encode categorical predictors
    existing_cats = [c for c in CATEGORICAL_COLUMNS if c in df.columns]
    if existing_cats:
        df = pd.get_dummies(df, columns=existing_cats, drop_first=True)

    return df


def scale_numeric_features(
    df: pd.DataFrame,
    scaler: StandardScaler | None = None,
    fit_scaler: bool = False,
) -> Tuple[pd.DataFrame, StandardScaler]:
    """Scale numeric features exactly as in the notebook final step."""

    df = df.copy()
    existing_numeric = [c for c in NUMERIC_FEATURES_TO_SCALE if c in df.columns]
    active_scaler = scaler or StandardScaler()

    if existing_numeric:
        if fit_scaler:
            df[existing_numeric] = active_scaler.fit_transform(df[existing_numeric])
        else:
            df[existing_numeric] = active_scaler.transform(df[existing_numeric])

    return df, active_scaler


def _fit_scaler_from_raw_data(input_path: Path | str = RAW_DATA_PATH) -> StandardScaler:
    """Fit a scaler using the training preprocessing flow from the notebook."""

    raw_df = load_data(input_path)
    interim_df = clean_data(raw_df)
    interim_df = feature_engineering(interim_df)
    interim_df = encode_features(interim_df)

    _, scaler = scale_numeric_features(interim_df, fit_scaler=True)
    return scaler


def load_or_build_scaler() -> StandardScaler:
    """Load persisted scaler or build it from training preprocessing data."""

    scaler_path = Path(PREPROCESSOR_SCALER_PATH)
    if scaler_path.exists():
        return joblib.load(scaler_path)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    scaler = _fit_scaler_from_raw_data()
    joblib.dump(scaler, scaler_path)
    return scaler


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """Full preprocessing pipeline used for both training and inference.

    The order of operations mirrors the notebook:

    1. :func:`clean_data`
    2. :func:`feature_engineering`
    3. :func:`encode_features`
    4. :func:`scale_numeric_features`

    Parameters
    ----------
    df:
        Input DataFrame, either the full raw dataset (for training) or
        row-level records (for inference).

    Returns
    -------
    DataFrame
        Processed dataset ready for modeling.
    """

    scaler = load_or_build_scaler()
    return prepare_features_with_scaler(df, scaler=scaler, fit_scaler=False)


def prepare_features_with_scaler(
    df: pd.DataFrame,
    scaler: StandardScaler | None,
    fit_scaler: bool,
) -> pd.DataFrame:
    """Shared preprocessing helper allowing explicit scaler control."""

    df = clean_data(df)
    df = feature_engineering(df)
    df = encode_features(df)
    df, _ = scale_numeric_features(df, scaler=scaler, fit_scaler=fit_scaler)
    return df


def preprocess_and_save(
    input_path: Path | str = RAW_DATA_PATH,
    output_path: Path | str = PROCESSED_DATA_PATH,
) -> pd.DataFrame:
    """Preprocess the raw CSV and persist the clean dataset.

    This function is the scriptable equivalent of the final cell in the
    preprocessing notebook.

    Returns
    -------
    DataFrame
        Processed DataFrame that was written to disk.
    """

    input_path = Path(input_path)
    output_path = Path(output_path)

    raw_df = load_data(input_path)

    raw_ready = clean_data(raw_df)
    raw_ready = feature_engineering(raw_ready)
    raw_ready = encode_features(raw_ready)

    processed_df, scaler = scale_numeric_features(raw_ready, scaler=None, fit_scaler=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    processed_df.to_csv(output_path, index=False)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(scaler, PREPROCESSOR_SCALER_PATH)

    return processed_df


__all__ = [
    "SERVICE_COLUMNS",
    "CATEGORICAL_COLUMNS",
    "load_data",
    "clean_data",
    "feature_engineering",
    "encode_features",
    "scale_numeric_features",
    "load_or_build_scaler",
    "prepare_features",
    "prepare_features_with_scaler",
    "preprocess_and_save",
]