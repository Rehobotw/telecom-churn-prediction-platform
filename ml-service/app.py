"""FastAPI application exposing the churn prediction model.

The API accepts raw customer attributes, applies the same
preprocessing steps as the notebooks, and returns churn predictions
and probabilities.
"""

from __future__ import annotations

import io
import json
from pathlib import Path
from typing import List

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field, ValidationError

from src.config import (
	DEPLOYED_MODEL_PATH,
	PROCESSED_DATA_PATH,
	PREPROCESSOR_SCALER_PATH,
	DEFAULT_THRESHOLD,
)
from src.predict import predict_single


app = FastAPI(
	title="Telecom Churn Prediction Service",
	description=(
		"ML microservice exposing the deployed Logistic Regression churn "
		"model for inference."
	),
	version="1.0.0",
)


class CustomerFeatures(BaseModel):
	"""Raw customer payload expected by notebook-aligned preprocessing."""

	customerID: str | None = None
	gender: str
	SeniorCitizen: int = Field(..., ge=0, le=1)
	Partner: str
	Dependents: str
	tenure: int = Field(..., ge=0)
	PhoneService: str
	MultipleLines: str
	InternetService: str
	OnlineSecurity: str
	OnlineBackup: str
	DeviceProtection: str
	TechSupport: str
	StreamingTV: str
	StreamingMovies: str
	Contract: str
	PaperlessBilling: str
	PaymentMethod: str
	MonthlyCharges: float = Field(..., ge=0.0)
	TotalCharges: str | float


class PredictionResponse(BaseModel):
	prediction: str
	probability: float = Field(..., ge=0.0, le=1.0)


@app.get("/", tags=["system"])
def root() -> dict:
	"""Health check endpoint required by the spec."""

	# Deployment intentionally serves Logistic Regression only.
	model_exists = Path(DEPLOYED_MODEL_PATH).exists()
	processed_exists = Path(PROCESSED_DATA_PATH).exists()
	scaler_exists = Path(PREPROCESSOR_SCALER_PATH).exists()
	status = "Churn prediction service running"
	if not model_exists:
		status += " (model not trained yet)"
	return {
		"message": status,
		"model_available": model_exists,
		"deployed_model": "Logistic Regression",
		"deployed_model_path": str(DEPLOYED_MODEL_PATH),
		"processed_data_available": processed_exists,
		"scaler_available": scaler_exists,
	}


@app.post("/predict", response_model=PredictionResponse, tags=["prediction"])
def predict_endpoint(payload: CustomerFeatures) -> PredictionResponse:
	"""Predict churn for a single customer from raw attributes."""

	if not Path(DEPLOYED_MODEL_PATH).exists():
		raise HTTPException(
			status_code=500,
			detail=(
				"Deployed Logistic Regression artifact not found. "
				"Run the logistic training pipeline before serving predictions."
			),
		)

	result = predict_single(payload.model_dump(), threshold=DEFAULT_THRESHOLD)
	label = "Churn" if result["churn_prediction"] == 1 else "No Churn"
	return PredictionResponse(
		prediction=label,
		probability=result["churn_probability"],
	)


@app.post("/batch-predict", response_model=List[PredictionResponse], tags=["prediction"])
async def batch_predict_endpoint(
	request: Request,
	file: UploadFile | None = File(default=None),
) -> List[PredictionResponse]:
	"""Batch prediction endpoint supporting CSV uploads or JSON payloads."""

	if not Path(DEPLOYED_MODEL_PATH).exists():
		raise HTTPException(
			status_code=500,
			detail=(
				"Deployed Logistic Regression artifact not found. "
				"Run the logistic training pipeline before serving predictions."
			),
		)

	payload: List[CustomerFeatures] = []

	if file is not None:
		content = await file.read()
		if not content.strip():
			raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

		try:
			df = pd.read_csv(io.BytesIO(content))
		except Exception as exc:
			raise HTTPException(status_code=400, detail="Invalid CSV file.") from exc

		if df.empty:
			raise HTTPException(status_code=400, detail="Uploaded CSV contains no rows.")

		required_columns = {
			name for name, field in CustomerFeatures.model_fields.items() if field.is_required()
		}
		missing_columns = sorted(required_columns - set(df.columns))
		if missing_columns:
			raise HTTPException(
				status_code=400,
				detail=f"CSV is missing required columns: {', '.join(missing_columns)}",
			)

		for idx, row in df.iterrows():
			try:
				payload.append(CustomerFeatures(**row.to_dict()))
			except ValidationError as exc:
				raise HTTPException(
					status_code=400,
					detail=f"Invalid data in CSV row {idx + 2}: {exc.errors()}",
				) from exc
	else:
		try:
			raw_payload = await request.json()
		except json.JSONDecodeError as exc:
			raise HTTPException(status_code=400, detail="Invalid JSON payload.") from exc

		if not isinstance(raw_payload, list):
			raise HTTPException(status_code=400, detail="JSON payload must be a list of items.")
		if not raw_payload:
			raise HTTPException(status_code=400, detail="Request body must contain at least one item.")

		for idx, item in enumerate(raw_payload):
			try:
				payload.append(CustomerFeatures.model_validate(item))
			except ValidationError as exc:
				raise HTTPException(
					status_code=400,
					detail=f"Invalid data in JSON item {idx}: {exc.errors()}",
				) from exc

	responses: List[PredictionResponse] = []
	for item in payload:
		res = predict_single(item.model_dump(), threshold=DEFAULT_THRESHOLD)
		label = "Churn" if res["churn_prediction"] == 1 else "No Churn"
		responses.append(
			PredictionResponse(prediction=label, probability=res["churn_probability"])
		)
	return responses


if __name__ == "__main__":
	import uvicorn

	uvicorn.run(
		"app:app",
		host="0.0.0.0",
		port=8000,
		reload=True,
	)

