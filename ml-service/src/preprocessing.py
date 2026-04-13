from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Tuple

import joblib
import pandas as pd
from sklearn.preprocessing import StandardScaler

from .config import PREPROCESSOR_PATH, PROCESSED_DATA_PATH, RAW_DATA_PATH, TARGET_COLUMN

DROP_COLUMNS = ["customerID", "TotalCharges", "MultipleLines", "SeniorCitizen", "Partner"]
SERVICE_COLUMNS = [
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "StreamingTV",
    "StreamingMovies",
]
CATEGORICAL_COLUMNS = [
    "gender",
    "Dependents",
    "PhoneService",
    "InternetService",
    "Contract",
    "PaperlessBilling",
    "PaymentMethod",
    "charge_level",
    "tenure_group",
]
NUMERIC_COLUMNS = ["tenure", "MonthlyCharges", "num_services"]
TENURE_BINS = [0, 12, 24, 48, 72]
TENURE_LABELS = ["new", "early", "established", "loyal"]
CHARGE_BINS = [0, 40, 80, 120]
CHARGE_LABELS = ["low", "medium", "high"]


@dataclass
class NotebookPreprocessor:
    raw_feature_columns: list[str]
    processed_feature_columns: list[str]
    scaler: StandardScaler

    @property
    def feature_names_in_(self) -> list[str]:
        return self.raw_feature_columns

    def get_feature_names_out(self) -> list[str]:
        return self.processed_feature_columns


def load_dataset(path: Path | str) -> pd.DataFrame:
    return pd.read_csv(path)


def _add_engineered_columns(df: pd.DataFrame) -> pd.DataFrame:
    engineered = df.copy()
    available_service_columns = [column for column in SERVICE_COLUMNS if column in engineered.columns]
    if available_service_columns:
        engineered["num_services"] = (engineered[available_service_columns] == "Yes").sum(axis=1)
    elif "num_services" not in engineered.columns:
        engineered["num_services"] = 0

    engineered.drop(columns=SERVICE_COLUMNS, inplace=True, errors="ignore")

    if "tenure_group" not in engineered.columns:
        engineered["tenure_group"] = pd.cut(
            engineered["tenure"],
            bins=TENURE_BINS,
            labels=TENURE_LABELS,
        )
    else:
        blank_tenure_group = engineered["tenure_group"].isna() | engineered["tenure_group"].astype(str).str.strip().eq("")
        if blank_tenure_group.any():
            engineered.loc[blank_tenure_group, "tenure_group"] = pd.cut(
                engineered.loc[blank_tenure_group, "tenure"],
                bins=TENURE_BINS,
                labels=TENURE_LABELS,
            )

    if "charge_level" not in engineered.columns:
        engineered["charge_level"] = pd.cut(
            engineered["MonthlyCharges"],
            bins=CHARGE_BINS,
            labels=CHARGE_LABELS,
        )
    else:
        blank_charge_level = engineered["charge_level"].isna() | engineered["charge_level"].astype(str).str.strip().eq("")
        if blank_charge_level.any():
            engineered.loc[blank_charge_level, "charge_level"] = pd.cut(
                engineered.loc[blank_charge_level, "MonthlyCharges"],
                bins=CHARGE_BINS,
                labels=CHARGE_LABELS,
            )
    return engineered


def _prepare_raw_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    prepared = df.copy()
    prepared.drop(columns=DROP_COLUMNS, inplace=True, errors="ignore")
    prepared = _add_engineered_columns(prepared)
    if TARGET_COLUMN in prepared.columns and prepared[TARGET_COLUMN].dtype == object:
        prepared[TARGET_COLUMN] = prepared[TARGET_COLUMN].map({"No": 0, "Yes": 1})
    return prepared


def _encode_features(df: pd.DataFrame) -> pd.DataFrame:
    available_categorical = [column for column in CATEGORICAL_COLUMNS if column in df.columns]
    return pd.get_dummies(df, columns=available_categorical, drop_first=True)


def _align_processed_features(df: pd.DataFrame, feature_columns: list[str]) -> pd.DataFrame:
    aligned = df.copy()
    for column in feature_columns:
        if column not in aligned.columns:
            aligned[column] = False
    return aligned[feature_columns]


def build_notebook_preprocessor(df: pd.DataFrame) -> tuple[NotebookPreprocessor, pd.DataFrame]:
    prepared = _prepare_raw_dataframe(df)
    raw_feature_columns = [column for column in prepared.columns if column != TARGET_COLUMN]

    encoded = _encode_features(prepared)
    processed_feature_columns = [column for column in encoded.columns if column != TARGET_COLUMN]

    scaler = StandardScaler()
    encoded[NUMERIC_COLUMNS] = scaler.fit_transform(encoded[NUMERIC_COLUMNS])

    preprocessor = NotebookPreprocessor(
        raw_feature_columns=raw_feature_columns,
        processed_feature_columns=processed_feature_columns,
        scaler=scaler,
    )
    return preprocessor, encoded


def preprocess_dataset(
    raw_data_path: Path | str = RAW_DATA_PATH,
    processed_data_path: Path | str = PROCESSED_DATA_PATH,
    preprocessor_path: Path | str = PREPROCESSOR_PATH,
) -> tuple[pd.DataFrame, NotebookPreprocessor]:
    df = load_dataset(raw_data_path)
    preprocessor, processed_df = build_notebook_preprocessor(df)
    Path(processed_data_path).parent.mkdir(parents=True, exist_ok=True)
    processed_df.to_csv(processed_data_path, index=False)
    save_preprocessor(preprocessor, preprocessor_path)
    return processed_df, preprocessor


def split_features_target(
    df: pd.DataFrame,
    target_column: str = TARGET_COLUMN,
) -> Tuple[pd.DataFrame, pd.Series]:
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' was not found.")
    X = df.drop(columns=[target_column], errors="ignore").copy()
    y = df[target_column].astype("int64")
    return X, y


def fit_transform_data(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame | None = None,
) -> Tuple[NotebookPreprocessor, pd.DataFrame, pd.DataFrame | None]:
    raise NotImplementedError(
        "Notebook-based preprocessing is applied before train/test split. "
        "Use preprocess_dataset() instead."
    )


def transform_data(preprocessor: NotebookPreprocessor, X: pd.DataFrame) -> pd.DataFrame:
    prepared = _prepare_raw_dataframe(X)
    encoded = _encode_features(prepared)
    aligned = _align_processed_features(encoded, preprocessor.processed_feature_columns)
    for column in NUMERIC_COLUMNS:
        if column not in aligned.columns:
            aligned[column] = 0.0
    aligned[NUMERIC_COLUMNS] = preprocessor.scaler.transform(aligned[NUMERIC_COLUMNS])
    return aligned


def save_preprocessor(
    preprocessor: NotebookPreprocessor,
    path: Path | str = PREPROCESSOR_PATH,
) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(preprocessor, path)


def load_preprocessor(path: Path | str = PREPROCESSOR_PATH) -> NotebookPreprocessor:
    return joblib.load(path)


__all__ = [
    "NotebookPreprocessor",
    "build_notebook_preprocessor",
    "fit_transform_data",
    "load_dataset",
    "load_preprocessor",
    "preprocess_dataset",
    "save_preprocessor",
    "split_features_target",
    "transform_data",
]
