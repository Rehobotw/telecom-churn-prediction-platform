from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import joblib
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split

from .config import METRICS_PATH, MODEL_PATH, RAW_DATA_PATH, RANDOM_STATE, TARGET_COLUMN, TEST_SIZE, THRESHOLD
from .preprocessing import load_dataset, load_preprocessor, split_features_target, transform_data


def evaluate_and_save_metrics(raw_data_path: Path | str = RAW_DATA_PATH) -> Dict[str, Any]:
    if not Path(MODEL_PATH).exists():
        raise FileNotFoundError("Model artifact is missing. Train the model first.")

    model = joblib.load(MODEL_PATH)
    preprocessor = load_preprocessor()

    df = load_dataset(raw_data_path)
    X, y = split_features_target(df, target_column=TARGET_COLUMN)

    _, X_test, _, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    X_test_transformed = transform_data(preprocessor, X_test)
    y_prob = model.predict_proba(X_test_transformed)[:, 1]
    y_pred = (y_prob >= THRESHOLD).astype(int)

    fpr, tpr, _ = roc_curve(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)

    metrics_payload = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "threshold": float(THRESHOLD),
        "confusion_matrix": cm.tolist(),
        "roc_curve": {
            "fpr": [float(value) for value in fpr.tolist()],
            "tpr": [float(value) for value in tpr.tolist()],
        },
    }

    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.write_text(json.dumps(metrics_payload, indent=2), encoding="utf-8")
    return metrics_payload


if __name__ == "__main__":
    print(evaluate_and_save_metrics())


