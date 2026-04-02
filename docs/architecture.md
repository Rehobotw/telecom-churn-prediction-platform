# Telecom Churn Prediction Platform – Architecture

This document provides a high-level overview of the telecom churn prediction platform, including its main components, data flow, and how the machine learning service fits into the overall system.

---

## High-Level Components

The project is organized into the following main folders:

- `backend/` – (placeholder) API/backend service that orchestrates requests from clients and communicates with the ML service.
- `frontend/` – (placeholder) user-facing interface for visualizing churn predictions and related analytics.
- `ml-service/` – machine learning microservice responsible for data preprocessing, model training, evaluation, and online prediction.
- `data/` – raw and processed datasets used across the ML workflow.
- `docs/` – project documentation, including EDA, architecture, API, and model evaluation.

---

## Data Flow

1. **Raw Data Ingestion**
	 - Source: `data/raw/telecom_churn.csv`.
	 - Contains customer demographics, service usage metrics, registration information, and the target label `churn`.

2. **Exploratory Data Analysis (EDA)**
	 - Performed in `ml-service/notebooks/01_eda.ipynb`.
	 - Goals:
		 - Understand feature distributions and class balance.
		 - Identify missing values and invalid values (e.g., negative usage counts).
		 - Explore relationships between features and churn.

3. **Preprocessing & Feature Engineering**
	 - Implemented in:
		 - Notebook: `ml-service/notebooks/02_preprocessing_and_feature_engineering.ipynb`.
		 - Code: `ml-service/src/preprocessing.py`.
	 - Main steps:
		 - Drop non-predictive identifiers (`customer_id`, `pincode`).
		 - Convert `date_of_registration` to datetime and derive `registration_year`.
		 - Create `age_group` and `tenure_bucket` categorical features.
		 - Replace negative values in `calls_made`, `sms_sent`, and `data_used` with the median of valid values.
		 - One-hot encode selected categorical features.
		 - Standard-scale numeric features.
		 - Save the model-ready dataset to `data/processed/telecom_churn_clean.csv`.

4. **Model Training & Selection**
	 - Implemented in:
		 - Notebooks:
			 - `ml-service/notebooks/03_logistic_regression_baseline.ipynb`
			 - `ml-service/notebooks/04_random_forest_baseline.ipynb`
			 - `ml-service/notebooks/05_model_comparison_and_selection.ipynb`
		 - Code: `ml-service/src/train.py`.
	 - Main steps:
		 - Load the processed dataset.
		 - Split into train/test sets (stratified by `churn`).
		 - Train baseline models: Logistic Regression and Random Forest.
		 - Evaluate using accuracy, precision, recall, F1, and ROC-AUC.
		 - Select the best model based on ROC-AUC and save it as `ml-service/models/final_model.pkl`.

5. **Model Evaluation**
	 - Additional evaluation and comparison documented in:
		 - `ml-service/notebooks/03_logistic_regression_baseline.ipynb`
		 - `ml-service/notebooks/04_random_forest_baseline.ipynb`
		 - `ml-service/notebooks/05_model_comparison_and_selection.ipynb`
	 - Scriptable evaluation is provided in `ml-service/src/evaluate.py`.

6. **Online Prediction (ML Service)**
	 - Implemented in `ml-service/app.py` using FastAPI.
	 - Endpoints (see `docs/api-documentation.md` for details):
		 - `GET /health` – health check.
		 - `POST /predict` – single-customer prediction using preprocessed features.
		 - `POST /batch-predict` – batch prediction using preprocessed features.

---

## Component Responsibilities

### ML Service (`ml-service/`)

- **Preprocessing** (`src/preprocessing.py`)
	- Encapsulates the same logic used in the preprocessing notebook.
	- Can be called as a library function (`preprocess_and_save`) or indirectly via `src/train.py` and `src/evaluate.py`.

- **Training** (`src/train.py`)
	- Handles end-to-end model training and selection.
	- Saves baseline and final models to `ml-service/models/`.

- **Evaluation** (`src/evaluate.py`)
	- Loads the final model and computes evaluation metrics on a held-out test split.

- **Prediction** (`src/predict.py` and `app.py`)
	- Provides utilities to load the final model and score preprocessed feature inputs.
	- FastAPI app exposes this functionality as HTTP endpoints.

### Backend (`backend/`)

- Acts as an orchestration layer between the frontend and the ML service.
- Responsibilities could include:
	- Validating and transforming raw customer data.
	- Calling the ML service’s `/predict` or `/batch-predict` endpoints.
	- Managing authentication, rate limiting, and logging.

### Frontend (`frontend/`)

- Provides visual interfaces for:
	- Viewing customer churn risk scores.
	- Highlighting key drivers of churn (future enhancement).
	- Exploring basic analytics and dashboards.

---

## Deployment Considerations

- **Containerization**: The ML service and backend can be containerized (e.g., Docker) and deployed independently.
- **Scaling**: The ML service can scale horizontally based on prediction traffic.
- **Monitoring**:
	- Monitor `/health` endpoint for readiness/liveness.
	- Track latency and error rates of prediction endpoints.
- **Model lifecycle**:
	- Retrain the model periodically as new data becomes available.
	- Version model artifacts under `ml-service/models/`.

---

## Future Enhancements

- Add a raw-input prediction endpoint that accepts unprocessed customer data and applies the preprocessing pipeline inside the ML service.
- Integrate feature importance and explanation tools (e.g., SHAP) into the API.
- Add CI/CD pipelines for automated testing, training, and deployment.

