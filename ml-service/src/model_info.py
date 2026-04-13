from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import pandas as pd

from .config import MODEL_METADATA_PATH, MODEL_PATH, PROCESSED_DATA_PATH, TEST_SIZE


def get_model_info() -> Dict[str, Any]:
    metadata = {}
    if Path(MODEL_METADATA_PATH).exists():
        metadata = json.loads(Path(MODEL_METADATA_PATH).read_text(encoding="utf-8"))

    last_trained = None
    if Path(MODEL_PATH).exists():
        last_trained = pd.Timestamp(Path(MODEL_PATH).stat().st_mtime, unit="s", tz="UTC").isoformat()

    training_samples = None
    if Path(PROCESSED_DATA_PATH).exists():
        total_rows = len(pd.read_csv(PROCESSED_DATA_PATH))
        training_samples = int(round(total_rows * (1 - TEST_SIZE)))

    return {
        "model_type": metadata.get("selected_model"),
        "last_trained": last_trained,
        "training_samples": training_samples,
        "features_used": len(metadata.get("feature_columns", [])),
    }
