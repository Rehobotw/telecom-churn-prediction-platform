from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV, train_test_split

from .config import (
    FEATURE_IMPORTANCE_PATH,
    MODEL_METADATA_PATH,
    MODEL_PATH,
    MODELS_DIR,
    PREPROCESSOR_PATH,
    PROCESSED_DATA_PATH,
    RANDOM_STATE,
    RAW_DATA_PATH,
    TARGET_COLUMN,
    TEST_SIZE,
)
from .preprocessing import preprocess_dataset, split_features_target

LOGISTIC_BASELINE_PATH = MODELS_DIR / "logistic_regression_baseline.pkl"
RANDOM_FOREST_BASELINE_PATH = MODELS_DIR / "random_forest_baseline.pkl"


def _get_train_test_data(processed_df: pd.DataFrame):
    X, y = split_features_target(processed_df, target_column=TARGET_COLUMN)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )
    return X, y, X_train, X_test, y_train, y_test


def _train_logistic_regression(X_train: pd.DataFrame, y_train: pd.Series) -> LogisticRegression:
    log_model = LogisticRegression(
        max_iter=1000,
        random_state=RANDOM_STATE,
        class_weight="balanced",
    )
    param_grid = {
        "C": [0.001, 0.01, 0.1, 1, 10, 100],
        "penalty": ["l1", "l2"],
        "solver": ["liblinear", "saga"],
    }
    grid_search = GridSearchCV(
        estimator=log_model,
        param_grid=param_grid,
        cv=5,
        scoring="f1",
        n_jobs=-1,
        verbose=0,
    )
    grid_search.fit(X_train, y_train)
    return grid_search.best_estimator_


def _train_random_forest(X_train: pd.DataFrame, y_train: pd.Series) -> RandomForestClassifier:
    rf_model = RandomForestClassifier(
        random_state=RANDOM_STATE,
        class_weight="balanced",
    )
    param_dist = {
        "n_estimators": [100, 200, 300, 500],
        "max_depth": [None, 10, 20, 30, 40],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
        "max_features": ["sqrt", "log2"],
    }
    search = RandomizedSearchCV(
        estimator=rf_model,
        param_distributions=param_dist,
        n_iter=25,
        cv=5,
        scoring="f1",
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbose=0,
    )
    search.fit(X_train, y_train)
    return search.best_estimator_


def _evaluate_model(model: Any, X_test: pd.DataFrame, y_test: pd.Series) -> dict[str, float]:
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    return {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
    }


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
    processed_df, preprocessor = preprocess_dataset(raw_data_path=raw_data_path)
    X, _, X_train, X_test, y_train, y_test = _get_train_test_data(processed_df)

    logistic_model = _train_logistic_regression(X_train, y_train)
    random_forest_model = _train_random_forest(X_train, y_train)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(logistic_model, LOGISTIC_BASELINE_PATH)
    joblib.dump(random_forest_model, RANDOM_FOREST_BASELINE_PATH)

    comparison = {
        "logistic_regression": _evaluate_model(logistic_model, X_test, y_test),
        "random_forest": _evaluate_model(random_forest_model, X_test, y_test),
    }
    selected_model_name = max(
        comparison,
        key=lambda model_name: comparison[model_name]["roc_auc"],
    )
    selected_model = (
        random_forest_model
        if selected_model_name == "random_forest"
        else logistic_model
    )

    joblib.dump(selected_model, MODEL_PATH)
    _save_feature_importance(selected_model, X.columns.tolist())

    MODEL_METADATA_PATH.write_text(
        json.dumps(
            {
                "selected_model": selected_model_name,
                "comparison_metrics": comparison,
                "test_scores": comparison[selected_model_name],
                "feature_columns": X.columns.tolist(),
                "processed_data_path": str(PROCESSED_DATA_PATH),
                "logistic_regression_path": str(LOGISTIC_BASELINE_PATH),
                "random_forest_path": str(RANDOM_FOREST_BASELINE_PATH),
                "model_path": str(MODEL_PATH),
                "preprocessor_path": str(PREPROCESSOR_PATH),
                "raw_feature_columns": preprocessor.feature_names_in_,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    return {
        "selected_model": selected_model_name,
        "comparison_metrics": comparison,
        "model_path": str(MODEL_PATH),
        "processed_data_path": str(PROCESSED_DATA_PATH),
    }


if __name__ == "__main__":
    print(train_and_save())
