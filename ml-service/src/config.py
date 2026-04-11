from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BASE_DIR.parent

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_PATH = DATA_DIR / "raw" / "telecom_churn.csv"
PROCESSED_DATA_PATH = DATA_DIR / "processed" / "telecom_churn_clean.csv"

MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "final_model.pkl"
PREPROCESSOR_PATH = MODELS_DIR / "preprocessor.pkl"
METRICS_PATH = MODELS_DIR / "metrics.json"
FEATURE_IMPORTANCE_PATH = MODELS_DIR / "feature_importance.json"
MODEL_METADATA_PATH = MODELS_DIR / "model_metadata.json"

TARGET_COLUMN = "Churn"
TEST_SIZE = 0.2
RANDOM_STATE = 42
THRESHOLD = 0.5

IGNORE_COLUMNS = ["customerID"]


__all__ = [
    "BASE_DIR",
    "PROJECT_ROOT",
    "DATA_DIR",
    "RAW_DATA_PATH",
    "PROCESSED_DATA_PATH",
    "MODELS_DIR",
    "MODEL_PATH",
    "PREPROCESSOR_PATH",
    "METRICS_PATH",
    "FEATURE_IMPORTANCE_PATH",
    "MODEL_METADATA_PATH",
    "TARGET_COLUMN",
    "TEST_SIZE",
    "RANDOM_STATE",
    "THRESHOLD",
    "IGNORE_COLUMNS",
]

