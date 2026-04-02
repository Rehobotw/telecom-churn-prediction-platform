"""Global configuration for the telecom churn ML service.

This module centralises paths and core training/evaluation constants so
that the notebooks and production code remain aligned.
"""

from pathlib import Path


# Directory layout ---------------------------------------------------------

# ml-service/
BASE_DIR = Path(__file__).resolve().parents[1]
# telecom-churn-prediction-platform/
PROJECT_ROOT = BASE_DIR.parent


# Data paths (match the notebooks)
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_PATH = DATA_DIR / "raw" / "telecom_churn.csv"
PROCESSED_DATA_PATH = DATA_DIR / "processed" / "telecom_churn_clean.csv"


# Model artifacts
MODELS_DIR = BASE_DIR / "models"

# Baseline model artifacts (from the baseline notebooks)
LOGISTIC_MODEL_PATH = MODELS_DIR / "logistic_regression_baseline.pkl"
RANDOM_FOREST_MODEL_PATH = MODELS_DIR / "random_forest_baseline.pkl"

# Final selected model from `05_model_comparison_and_selection.ipynb`
# Kept for reproducibility/documentation. Not used by deployment.
FINAL_MODEL_PATH = MODELS_DIR / "final_model.pkl"

# Deployment decision from model comparison:
# Logistic Regression is the selected production model.
DEPLOYED_MODEL_PATH = LOGISTIC_MODEL_PATH

# Persisted scaler fitted on training-time preprocessing data.
PREPROCESSOR_SCALER_PATH = MODELS_DIR / "preprocessing_scaler.pkl"


# Training / evaluation parameters ----------------------------------------

# Target column name in the processed dataset, matching the notebooks
# ("Churn" with capital C in `telecom_churn_clean.csv`).
TARGET_COLUMN = "Churn"

# Train/test split
TEST_SIZE = 0.2
RANDOM_STATE = 42

# Default probability threshold for converting probabilities to labels
DEFAULT_THRESHOLD = 0.5

# Tuned Logistic Regression hyperparameters from
# `03_logistic_regression_baseline.ipynb` GridSearchCV best estimator.
DEPLOYED_LOGISTIC_PARAMS = {
	"C": 10,
	"penalty": "l2",
	"solver": "liblinear",
	"class_weight": "balanced",
	"max_iter": 1000,
	"random_state": RANDOM_STATE,
}


# Preprocessing parameters (must mirror notebook final cells) -------------

DROP_COLUMNS = ["customerID", "TotalCharges", "MultipleLines", "SeniorCitizen", "Partner"]

SERVICE_COLUMNS = [
	"OnlineSecurity",
	"OnlineBackup",
	"DeviceProtection",
	"TechSupport",
	"StreamingTV",
	"StreamingMovies",
]

TENURE_BINS = [0, 12, 24, 48, 72]
TENURE_LABELS = ["new", "early", "established", "loyal"]

CHARGE_BINS = [0, 40, 80, 120]
CHARGE_LABELS = ["low", "medium", "high"]

CATEGORICAL_COLUMNS = [
	"gender",
	"Dependents",
	"PhoneService",
	"InternetService",
	"Contract",
	"PaperlessBilling",
	"PaymentMethod",
	"charge_level",
	"tenure_group",
]

NUMERIC_FEATURES_TO_SCALE = ["tenure", "MonthlyCharges", "num_services"]


__all__ = [
	"BASE_DIR",
	"PROJECT_ROOT",
	"DATA_DIR",
	"RAW_DATA_PATH",
	"PROCESSED_DATA_PATH",
	"MODELS_DIR",
	"LOGISTIC_MODEL_PATH",
	"RANDOM_FOREST_MODEL_PATH",
	"FINAL_MODEL_PATH",
	"DEPLOYED_MODEL_PATH",
	"PREPROCESSOR_SCALER_PATH",
	"TARGET_COLUMN",
	"TEST_SIZE",
	"RANDOM_STATE",
	"DEFAULT_THRESHOLD",
	"DEPLOYED_LOGISTIC_PARAMS",
	"DROP_COLUMNS",
	"SERVICE_COLUMNS",
	"TENURE_BINS",
	"TENURE_LABELS",
	"CHARGE_BINS",
	"CHARGE_LABELS",
	"CATEGORICAL_COLUMNS",
	"NUMERIC_FEATURES_TO_SCALE",
]

