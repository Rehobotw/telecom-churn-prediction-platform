"""Model evaluation utilities mirroring the comparison notebook.

This module provides a scriptable version of the metrics used in
`03_logistic_regression_baseline.ipynb` and
`05_model_comparison_and_selection.ipynb`.

Deployment uses Logistic Regression only; Random Forest is evaluated
here strictly for documentation and reproducibility.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
	accuracy_score,
	precision_score,
	recall_score,
	f1_score,
	roc_auc_score,
	confusion_matrix,
)
from sklearn.model_selection import train_test_split

from .config import (
	LOGISTIC_MODEL_PATH,
	RANDOM_FOREST_MODEL_PATH,
	PROCESSED_DATA_PATH,
	TARGET_COLUMN,
	TEST_SIZE,
	RANDOM_STATE,
)
from .preprocessing import preprocess_and_save


def _load_processed_data(path: str = str(PROCESSED_DATA_PATH)) -> pd.DataFrame:
	"""Load the processed dataset, generating it from raw data if missing."""

	try:
		return pd.read_csv(path)
	except FileNotFoundError:
		return preprocess_and_save()


def _compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, float]:
	"""Compute core comparison metrics."""

	return {
		"accuracy": accuracy_score(y_true, y_pred),
		"precision": precision_score(y_true, y_pred),
		"recall": recall_score(y_true, y_pred),
		"f1": f1_score(y_true, y_pred),
		"roc_auc": roc_auc_score(y_true, y_prob),
	}


def _load_models_for_comparison() -> Dict[str, object]:
	"""Load comparison models saved from notebooks.

	Random Forest is intentionally kept in this path for reporting only.
	"""

	models: Dict[str, object] = {}

	if Path(LOGISTIC_MODEL_PATH).exists():
		models["Logistic Regression"] = joblib.load(LOGISTIC_MODEL_PATH)
	if Path(RANDOM_FOREST_MODEL_PATH).exists():
		models["Random Forest"] = joblib.load(RANDOM_FOREST_MODEL_PATH)

	if not models:
		raise FileNotFoundError(
			"No model artifacts found for evaluation. Expected Logistic Regression "
			"and/or Random Forest baseline model files in the models directory."
		)

	return models


def evaluate_models() -> Dict[str, Dict[str, object]]:
	"""Evaluate Logistic Regression and Random Forest on a common test split.

	Returns
	-------
	Dict[str, Dict[str, object]]
		Per-model metrics and confusion matrix, keyed by model name.
	"""

	df = _load_processed_data()

	X = df.drop(columns=[TARGET_COLUMN])
	y = df[TARGET_COLUMN]

	X_train, X_test, y_train, y_test = train_test_split(
		X,
		y,
		test_size=TEST_SIZE,
		random_state=RANDOM_STATE,
		stratify=y,
	)

	models = _load_models_for_comparison()
	results: Dict[str, Dict[str, object]] = {}

	for name, model in models.items():
		y_pred = model.predict(X_test)
		y_prob = model.predict_proba(X_test)[:, 1]
		results[name] = {
			"metrics": _compute_metrics(y_test, y_pred, y_prob),
			"confusion_matrix": confusion_matrix(y_test, y_pred),
		}

	return results


def evaluate_model(model_name: str = "Logistic Regression") -> Tuple[Dict[str, float], np.ndarray]:
	"""Backward-compatible single-model evaluation helper."""

	results = evaluate_models()
	if model_name not in results:
		raise ValueError(f"Model '{model_name}' not available for evaluation.")

	selected = results[model_name]
	return selected["metrics"], selected["confusion_matrix"]


def print_metrics(metrics: Dict[str, float]) -> None:
	"""Pretty-print evaluation metrics to stdout."""

	print("Model evaluation metrics:")
	for name, value in metrics.items():
		print(f"  {name}: {value:.4f}")


def feature_importance() -> pd.DataFrame:
	"""Return feature importance for a linear (Logistic) model.

	If the final deployed model is not linear, this function still uses
	the Logistic Regression baseline to compute coefficient-based
	importance, matching the analysis in the baseline notebook.
	"""

	df = _load_processed_data()
	X = df.drop(columns=[TARGET_COLUMN])
	model = joblib.load(LOGISTIC_MODEL_PATH)

	coefficients = pd.DataFrame(
		{"feature": X.columns, "coefficient": model.coef_[0]},
	).sort_values(by="coefficient", ascending=False)
	return coefficients


def find_optimal_threshold(
	y_true: np.ndarray,
	y_prob: np.ndarray,
	metric: str = "f1",
) -> float:
	"""Simple probability threshold tuning helper.

	Parameters
	----------
	y_true:
		True binary labels.
	y_prob:
		Predicted probabilities for the positive class.
	metric:
		Metric to optimise (currently supports ``"f1"`` only).

	Returns
	-------
	float
		Threshold in ``[0, 1]`` that maximises the chosen metric.
	"""

	best_thr = 0.5
	best_score = -1.0

	for thr in np.linspace(0.1, 0.9, 17):
		y_pred = (y_prob >= thr).astype(int)
		if metric == "f1":
			score = f1_score(y_true, y_pred)
		else:
			raise ValueError("Unsupported metric for threshold tuning")

		if score > best_score:
			best_score = score
			best_thr = float(thr)

	return best_thr


if __name__ == "__main__":
	all_results = evaluate_models()
	for model_name, result in all_results.items():
		print(f"\n{model_name}")
		print_metrics(result["metrics"])
		print("Confusion matrix:\n", result["confusion_matrix"])


