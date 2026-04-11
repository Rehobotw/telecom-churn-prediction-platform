from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, roc_auc_score
from sklearn.model_selection import GridSearchCV, train_test_split

from .config import (
	FEATURE_IMPORTANCE_PATH,
	MODEL_METADATA_PATH,
	MODEL_PATH,
	MODELS_DIR,
	RAW_DATA_PATH,
	RANDOM_STATE,
	TARGET_COLUMN,
	TEST_SIZE,
)
from .preprocessing import fit_transform_data, load_dataset, save_preprocessor, split_features_target


def _train_candidates(X_train_transformed, y_train: pd.Series) -> Dict[str, GridSearchCV]:
	candidates = {
		"logistic_regression": GridSearchCV(
			estimator=LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
			param_grid={
				"C": [0.1, 1.0, 10.0],
				"solver": ["lbfgs"],
				"class_weight": [None, "balanced"],
			},
			scoring="roc_auc",
			cv=3,
			n_jobs=-1,
			refit=True,
		),
		"random_forest": GridSearchCV(
			estimator=RandomForestClassifier(random_state=RANDOM_STATE),
			param_grid={
				"n_estimators": [200, 300],
				"max_depth": [None, 10, 20],
				"min_samples_split": [2, 5],
				"class_weight": [None, "balanced"],
			},
			scoring="roc_auc",
			cv=3,
			n_jobs=-1,
			refit=True,
		),
	}

	for grid in candidates.values():
		grid.fit(X_train_transformed, y_train)

	return candidates


def _select_best_model(candidates: Dict[str, GridSearchCV], X_val_transformed, y_val: pd.Series) -> tuple[str, Any, Dict[str, float]]:
	ranking = []
	for name, grid in candidates.items():
		model = grid.best_estimator_
		y_prob = model.predict_proba(X_val_transformed)[:, 1]
		y_pred = (y_prob >= 0.5).astype(int)
		ranking.append(
			{
				"name": name,
				"model": model,
				"roc_auc": float(roc_auc_score(y_val, y_prob)),
				"f1": float(f1_score(y_val, y_pred)),
			}
		)

	ranking.sort(key=lambda item: (item["roc_auc"], item["f1"]), reverse=True)
	best = ranking[0]
	return best["name"], best["model"], {"roc_auc": best["roc_auc"], "f1": best["f1"]}


def _save_feature_importance(model: Any, feature_names: list[str]) -> None:
	if hasattr(model, "feature_importances_"):
		values = model.feature_importances_
	elif hasattr(model, "coef_"):
		values = abs(model.coef_[0])
	else:
		values = [0.0 for _ in feature_names]

	ranked = sorted(
		[
			{"feature": feature, "importance": float(importance)}
			for feature, importance in zip(feature_names, values)
		],
		key=lambda item: item["importance"],
		reverse=True,
	)

	FEATURE_IMPORTANCE_PATH.parent.mkdir(parents=True, exist_ok=True)
	FEATURE_IMPORTANCE_PATH.write_text(json.dumps(ranked, indent=2), encoding="utf-8")


def train_and_save(raw_data_path: Path | str = RAW_DATA_PATH) -> Dict[str, Any]:
	df = load_dataset(raw_data_path)
	X, y = split_features_target(df, target_column=TARGET_COLUMN)

	X_train, X_test, y_train, y_test = train_test_split(
		X,
		y,
		test_size=TEST_SIZE,
		random_state=RANDOM_STATE,
		stratify=y,
	)

	preprocessor, X_train_transformed, X_test_transformed = fit_transform_data(X_train, X_test)
	candidates = _train_candidates(X_train_transformed, y_train)
	model_name, best_model, scores = _select_best_model(candidates, X_test_transformed, y_test)

	MODELS_DIR.mkdir(parents=True, exist_ok=True)
	joblib.dump(best_model, MODEL_PATH)
	save_preprocessor(preprocessor)

	feature_names = preprocessor.get_feature_names_out().tolist()
	_save_feature_importance(best_model, feature_names)

	MODEL_METADATA_PATH.write_text(
		json.dumps(
			{
				"selected_model": model_name,
				"test_scores": scores,
				"feature_columns": preprocessor.feature_names_in_.tolist(),
			},
			indent=2,
		),
		encoding="utf-8",
	)

	return {
		"selected_model": model_name,
		"test_scores": scores,
		"model_path": str(MODEL_PATH),
	}


if __name__ == "__main__":
	print(train_and_save())

