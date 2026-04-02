"""Training script for the final Logistic Regression churn model.

This module implements the training pipeline from
`03_logistic_regression_baseline.ipynb` using the processed dataset
produced by :mod:`src.preprocessing`.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, Any

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
	accuracy_score,
	precision_score,
	recall_score,
	f1_score,
	roc_auc_score,
)
from sklearn.model_selection import train_test_split

from .config import (
	PROCESSED_DATA_PATH,
	MODELS_DIR,
	LOGISTIC_MODEL_PATH,
	TARGET_COLUMN,
	TEST_SIZE,
	RANDOM_STATE,
)
from .preprocessing import preprocess_and_save


logger = logging.getLogger(__name__)


def _load_processed_data(path: Path | str = PROCESSED_DATA_PATH) -> pd.DataFrame:
	"""Load the processed dataset, creating it from raw data if needed."""

	csv_path = Path(path)
	if not csv_path.exists():
		logger.info("Processed data not found. Running preprocessing pipeline...")
		preprocess_and_save()
	return pd.read_csv(csv_path)


def _compute_classification_metrics(
	y_true, y_pred, y_prob
) -> Dict[str, float]:
	"""Compute core classification metrics used in the notebooks."""

	return {
		"accuracy": accuracy_score(y_true, y_pred),
		"precision": precision_score(y_true, y_pred),
		"recall": recall_score(y_true, y_pred),
		"f1": f1_score(y_true, y_pred),
		"roc_auc": roc_auc_score(y_true, y_prob),
	}


def train_logistic_regression() -> Dict[str, Any]:
	"""Train the final Logistic Regression model and persist it.

	Steps
	-----
	1. Load (or create) the processed dataset.
	2. Split into train/test sets with stratification.
	3. Train :class:`sklearn.linear_model.LogisticRegression` with
	   ``max_iter=1000`` and fixed ``random_state``.
	4. Evaluate using accuracy, precision, recall, F1 and ROC AUC.
	5. Save the trained model to :data:`LOGISTIC_MODEL_PATH`.

	Returns
	-------
	Dict[str, Any]
		Dictionary containing the trained model and evaluation metrics.
	"""

	logger.info("Loading processed dataset for training...")
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

	logger.info("Training Logistic Regression model...")
	model = LogisticRegression(max_iter=1000, random_state=RANDOM_STATE)
	model.fit(X_train, y_train)

	y_pred_test = model.predict(X_test)
	y_prob_test = model.predict_proba(X_test)[:, 1]
	y_pred_train = model.predict(X_train)
	y_prob_train = model.predict_proba(X_train)[:, 1]

	metrics_test = _compute_classification_metrics(y_test, y_pred_test, y_prob_test)
	metrics_train = _compute_classification_metrics(y_train, y_pred_train, y_prob_train)

	MODELS_DIR.mkdir(parents=True, exist_ok=True)
	joblib.dump(model, LOGISTIC_MODEL_PATH)
	logger.info("Saved Logistic Regression model to %s", LOGISTIC_MODEL_PATH)

	return {
		"model": model,
		"train_metrics": metrics_train,
		"test_metrics": metrics_test,
	}


if __name__ == "__main__":
	logging.basicConfig(level=logging.INFO)
	results = train_logistic_regression()
	print("Training complete. Test metrics:")
	for name, value in results["test_metrics"].items():
		print(f"  {name}: {value:.4f}")

