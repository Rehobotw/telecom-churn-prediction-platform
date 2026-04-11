from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from .config import METRICS_PATH


def get_metrics() -> Dict[str, Any]:
    if not Path(METRICS_PATH).exists():
        raise FileNotFoundError("metrics.json not found. Run model evaluation first.")

    payload = json.loads(Path(METRICS_PATH).read_text(encoding="utf-8"))
    return {
        "accuracy": payload.get("accuracy"),
        "precision": payload.get("precision"),
        "recall": payload.get("recall"),
        "f1": payload.get("f1"),
        "roc_auc": payload.get("roc_auc"),
        "confusion_matrix": payload.get("confusion_matrix", []),
        "roc_curve": payload.get("roc_curve", {"fpr": [], "tpr": []}),
    }
