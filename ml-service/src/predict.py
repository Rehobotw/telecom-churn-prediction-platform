"""Prediction utilities for the telecom churn model.

This module loads the deployed Logistic Regression model, applies the
same preprocessing used during training, and returns both
probabilities and class labels.
"""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, List, Dict, Union, Any

import joblib
import numpy as np
import pandas as pd

from .config import (
	DEPLOYED_MODEL_PATH,
	RAW_DATA_PATH,
	PROCESSED_DATA_PATH,
	TARGET_COLUMN,
	DEFAULT_THRESHOLD,
)
from .preprocessing import prepare_features, preprocess_and_save


DataLike = Union[pd.DataFrame, Dict[str, Any], List[Dict[str, Any]]]


def load_model(path: Path | str = DEPLOYED_MODEL_PATH):
	"""Load the deployed churn model from disk.

	Deployment intentionally uses only Logistic Regression. Random Forest
	remains available in the repository for documentation and comparison,
	but is not part of the serving path.
	"""

	model_path = Path(path)
	if not model_path.exists():
		raise FileNotFoundError(
			"Deployed model not found. Expected Logistic Regression artifact at "
			f"'{model_path}'."
		)
	return joblib.load(model_path)


def _load_feature_template() -> List[str]:
	"""Infer the expected feature columns from the processed dataset.

	This assumes that the model was trained on the columns in the
	processed CSV minus the target column.
	"""

	processed_path = Path(PROCESSED_DATA_PATH)
	if not processed_path.exists():
		preprocess_and_save()

	df = pd.read_csv(processed_path, nrows=1)
	feature_columns = [c for c in df.columns if c != TARGET_COLUMN]
	return feature_columns


def _to_dataframe(data: DataLike) -> pd.DataFrame:
	"""Convert raw record structures to a DataFrame for preprocessing."""

	if isinstance(data, pd.DataFrame):
		return data.copy()
	if isinstance(data, dict):
		return pd.DataFrame([data])
	# Assume an iterable of row dictionaries
	return pd.DataFrame(list(data))


def _align_to_training_features(df: pd.DataFrame, feature_columns: Iterable[str]) -> pd.DataFrame:
	"""Align processed features to the training feature set.

	Any missing columns are added with value 0 so that the model sees
	the same feature space it was trained on.
	"""

	feature_columns = list(feature_columns)
	for col in feature_columns:
		if col not in df.columns:
			df[col] = 0

	df = df[feature_columns]
	return df


def _preprocess_for_inference(data: DataLike) -> pd.DataFrame:
	"""Apply the full preprocessing pipeline to raw input data."""

	df_raw = _to_dataframe(data)
	df_processed = prepare_features(df_raw)
	if TARGET_COLUMN in df_processed.columns:
		df_processed = df_processed.drop(columns=[TARGET_COLUMN])

	feature_columns = _load_feature_template()
	df_aligned = _align_to_training_features(df_processed, feature_columns)
	return df_aligned


def predict_proba(data: DataLike) -> np.ndarray:
	"""Return churn probabilities for raw input records.

	The input is expected to contain raw features consistent with the
	original dataset (e.g., ``gender``, ``Partner``, ``tenure``,
	``InternetService``, ``Contract``, ``PaymentMethod``, etc.). The
	function applies the same preprocessing as in the notebook before
	calling the model.
	"""

	model = load_model()
	X = _preprocess_for_inference(data)
	proba = model.predict_proba(X)[:, 1]
	return proba


def predict_label(data: DataLike, threshold: float = DEFAULT_THRESHOLD) -> np.ndarray:
	"""Return binary churn predictions for raw input records."""

	proba = predict_proba(data)
	return (proba >= threshold).astype(int)


def predict_single(data: Dict[str, Any], threshold: float = DEFAULT_THRESHOLD) -> Dict[str, Any]:
	"""Convenience helper returning both label and probability.

	Parameters
	----------
	data:
		Dictionary of raw customer features.
	threshold:
		Decision threshold applied to the churn probability.

	Returns
	-------
	Dict[str, Any]
		Dictionary with ``churn_prediction`` (0/1) and
		``churn_probability`` (float in ``[0, 1]``).
	"""

	proba = predict_proba(data)[0]
	label = int(proba >= threshold)
	return {
		"churn_prediction": label,
		"churn_probability": float(proba),
	}


if __name__ == "__main__":
	# Example usage: take a few rows from the raw CSV and score them.
	raw_df = pd.read_csv(RAW_DATA_PATH, nrows=5)
	X_example = raw_df.drop(columns=[TARGET_COLUMN], errors="ignore")

	probs = predict_proba(X_example.to_dict(orient="records"))
	preds = predict_label(X_example.to_dict(orient="records"))

	for i, (p, y_hat) in enumerate(zip(probs, preds), start=1):
		print(f"Row {i}: churn_prob={p:.4f}, prediction={y_hat}")

