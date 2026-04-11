from __future__ import annotations

from pathlib import Path
from typing import List, Tuple

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .config import IGNORE_COLUMNS, PREPROCESSOR_PATH, TARGET_COLUMN


def load_dataset(path: Path | str) -> pd.DataFrame:
    return pd.read_csv(path)


def _normalize_target(y: pd.Series) -> pd.Series:
    if y.dtype == object:
        return y.map({"No": 0, "Yes": 1}).astype("int64")
    return y.astype("int64")


def _coerce_numeric_like_columns(X: pd.DataFrame, min_numeric_ratio: float = 0.9) -> pd.DataFrame:
    X_out = X.copy()
    object_columns = X_out.select_dtypes(include=["object"]).columns.tolist()

    for column in object_columns:
        converted = pd.to_numeric(X_out[column], errors="coerce")
        ratio = float(converted.notna().mean()) if len(converted) else 0.0
        if ratio >= min_numeric_ratio:
            X_out[column] = converted

    return X_out


def split_features_target(df: pd.DataFrame, target_column: str = TARGET_COLUMN) -> Tuple[pd.DataFrame, pd.Series]:
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' was not found.")

    X = df.drop(columns=[target_column], errors="ignore").copy()
    y = _normalize_target(df[target_column])

    for column in IGNORE_COLUMNS:
        if column in X.columns:
            X.drop(columns=[column], inplace=True)

    X = _coerce_numeric_like_columns(X)

    return X, y


def infer_feature_types(X: pd.DataFrame) -> Tuple[List[str], List[str]]:
    numeric_columns = X.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical_columns = [c for c in X.columns if c not in numeric_columns]
    return numeric_columns, categorical_columns


def build_preprocessing_pipeline(X: pd.DataFrame) -> ColumnTransformer:
    numeric_columns, categorical_columns = infer_feature_types(X)

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, numeric_columns),
            ("cat", categorical_pipeline, categorical_columns),
        ],
        remainder="drop",
    )


def fit_transform_data(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame | None = None,
) -> Tuple[ColumnTransformer, object, object | None]:
    preprocessor = build_preprocessing_pipeline(X_train)
    X_train_transformed = preprocessor.fit_transform(X_train)

    X_test_transformed = None
    if X_test is not None:
        X_test_transformed = preprocessor.transform(X_test)

    return preprocessor, X_train_transformed, X_test_transformed


def transform_data(preprocessor: ColumnTransformer, X: pd.DataFrame):
    X_prepared = _coerce_numeric_like_columns(X)
    expected_columns = list(preprocessor.feature_names_in_)
    X_infer = X_prepared.copy()
    for column in expected_columns:
        if column not in X_infer.columns:
            X_infer[column] = None
    return preprocessor.transform(X_infer[expected_columns])


def save_preprocessor(preprocessor: ColumnTransformer, path: Path | str = PREPROCESSOR_PATH) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(preprocessor, path)


def load_preprocessor(path: Path | str = PREPROCESSOR_PATH) -> ColumnTransformer:
    return joblib.load(path)


__all__ = [
    "build_preprocessing_pipeline",
    "fit_transform_data",
    "infer_feature_types",
    "load_dataset",
    "load_preprocessor",
    "save_preprocessor",
    "split_features_target",
    "transform_data",
]