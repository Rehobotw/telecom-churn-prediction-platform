# Telecom Churn Prediction API

This document describes the machine learning API exposed by the `ml-service` component. It allows other parts of the platform (backend, frontend, or external clients) to obtain churn probabilities from the trained model.

---

## Base Information

- **Base URL (local development)**: `http://localhost:8000`
- **Tech stack**: FastAPI, scikit-learn
- **Model artifact**: `ml-service/models/final_model.pkl`
- **Processed data schema**: `data/processed/telecom_churn_clean.csv`

The service assumes that the final model has already been trained and saved by running the training pipeline (see `ml-service/src/train.py`).

---

## Health Endpoint

### `GET /health`

Basic readiness/liveness check.

**Response 200**

```json
{
	"status": "ok",
	"model_available": true,
	"processed_data_available": true
}
```

- `status`: `ok` if both model and processed dataset are available, otherwise `degraded`.
- `model_available`: whether `final_model.pkl` exists.
- `processed_data_available`: whether `telecom_churn_clean.csv` exists.

---

## Single Prediction Endpoint

### `POST /predict`

Predict churn for a **single** customer using **preprocessed features**.

This endpoint is intended for internal usage where the caller already has data in the same feature space as the processed training dataset. The feature set is derived from `data/processed/telecom_churn_clean.csv` minus the target column `churn`.

#### Request Body

Content type: `application/json`

Example payload (truncated list of features for illustration only):

```json
{
	"age": 0.12,
	"num_dependents": -0.45,
	"estimated_salary": 0.31,
	"calls_made": 0.05,
	"sms_sent": -0.18,
	"data_used": 0.72,
	"registration_year": -0.09,
	"telecom_partner_Vodafone": 1,
	"gender_M": 0,
	"state_Karnataka": 1,
	"city_Bangalore": 1,
	"age_group_Senior": 0,
	"tenure_bucket_Loyal": 1
}
```

Notes:

- All numeric values must already be **standard-scaled** using the same `StandardScaler` fit during preprocessing.
- All categorical features must be **one-hot encoded** using the same columns that exist in the processed dataset.
- Any missing columns are implicitly filled with `0` on the server side, but clients should aim to provide the full feature vector when possible.

#### Response 200

```json
{
	"churn_probability": 0.27,
	"churn_prediction": 0
}
```

- `churn_probability`: model-estimated probability that the customer will churn (between 0 and 1).
- `churn_prediction`: binary label, `1` = churn, `0` = no churn, using default threshold 0.5.

#### Error Responses

- **400 Bad Request** – invalid JSON or empty body.
- **500 Internal Server Error** – model artifact missing or corrupted, or other unexpected failure.

---

## Batch Prediction Endpoint

### `POST /batch-predict`

Predict churn for a **batch** of customers, again using **preprocessed features**.

#### Request Body

Content type: `application/json`

Example payload:

```json
[
	{
		"age": 0.12,
		"num_dependents": -0.45,
		"estimated_salary": 0.31,
		"calls_made": 0.05,
		"sms_sent": -0.18,
		"data_used": 0.72,
		"registration_year": -0.09,
		"telecom_partner_Vodafone": 1,
		"gender_M": 0,
		"state_Karnataka": 1,
		"city_Bangalore": 1,
		"age_group_Senior": 0,
		"tenure_bucket_Loyal": 1
	},
	{
		"age": -0.42,
		"num_dependents": 0.11,
		"estimated_salary": -0.05,
		"calls_made": -0.33,
		"sms_sent": 0.27,
		"data_used": -0.14,
		"registration_year": 0.44,
		"telecom_partner_Airtel": 1,
		"gender_M": 1,
		"state_Tamil Nadu": 1,
		"city_Chennai": 1,
		"age_group_Early Middle Age": 1,
		"tenure_bucket_Established": 1
	}
]
```

#### Response 200

```json
[
	{
		"churn_probability": 0.27,
		"churn_prediction": 0
	},
	{
		"churn_probability": 0.61,
		"churn_prediction": 1
	}
]
```

#### Error Responses

- **400 Bad Request** – empty list or invalid JSON.
- **500 Internal Server Error** – model artifact or inference error.

---

## Running the Service Locally

1. **Activate the virtual environment** (if not already active):

	 ```bash
	 source .venv/bin/activate
	 ```

2. **Ensure the model is trained**:

	 ```bash
	 cd ml-service
	 python -m src.train
	 ```

3. **Start the FastAPI server**:

	 ```bash
	 cd ml-service
	 uvicorn app:app --reload --host 0.0.0.0 --port 8000
	 ```

4. Open the **interactive API docs** (Swagger UI):

	 - http://localhost:8000/docs

---

## Integration Notes

- The **backend service** can call `/predict` or `/batch-predict` when it needs churn scores for customers.
- The **frontend** can either call the backend (preferred) or, in a development setup, call the ML API directly.
- For a production-ready flow, consider adding:
	- Authentication/authorization around the prediction endpoints.
	- Request/response logging and correlation IDs.
	- Rate limiting and input payload size limits.

