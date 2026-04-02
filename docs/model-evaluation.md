# Model Evaluation – Telecom Churn Prediction

This document summarizes how the churn prediction models were evaluated and how the final model was selected, based on the modeling notebooks and the code in `ml-service/src/train.py` and `ml-service/src/evaluate.py`.

---

## Evaluation Setup

- **Input data**: `data/processed/telecom_churn_clean.csv`
- **Target variable**: `churn`
- **Train/test split**:
	- `test_size = 0.2`
	- `random_state = 42`
	- Stratified by `churn` to preserve class balance.

### Models Compared

1. **Logistic Regression (Baseline)**
	 - Implementation: `sklearn.linear_model.LogisticRegression`
	 - Key parameters:
		 - `max_iter = 1000`
		 - `random_state = 42`

2. **Random Forest (Baseline)**
	 - Implementation: `sklearn.ensemble.RandomForestClassifier`
	 - Key parameters:
		 - `n_estimators = 200`
		 - `max_depth = None`
		 - `n_jobs = -1`
		 - `random_state = 42`

---

## Metrics

The following metrics are computed on the test set for each model:

- **Accuracy** – Overall fraction of correct predictions.
- **Precision** – Among predicted churners, how many actually churned.
- **Recall** – Among actual churners, how many were correctly predicted.
- **F1 Score** – Harmonic mean of precision and recall.
- **ROC-AUC** – Area under the ROC curve, measuring ranking quality across thresholds.

ROC curves and confusion matrices are plotted in the notebooks:

- `ml-service/notebooks/03_logistic_regression_baseline.ipynb`
- `ml-service/notebooks/04_random_forest_baseline.ipynb`
- `ml-service/notebooks/05_model_comparison_and_selection.ipynb`

---

## Model Comparison and Selection

The selection process is implemented in the notebook `05_model_comparison_and_selection.ipynb` and mirrored programmatically in `ml-service/src/train.py`:

1. Train both Logistic Regression and Random Forest on the same training split.
2. Generate predictions and predicted probabilities for the test set.
3. Compute the evaluation metrics listed above.
4. Build a comparison table capturing:
	 - Model name
	 - Accuracy
	 - Precision
	 - Recall
	 - F1 Score
	 - ROC-AUC
5. **Select the best model based on ROC-AUC**, as it is well-suited for imbalanced classification problems like churn prediction.
6. Save:
	 - Baseline models:
		 - `ml-service/models/logistic_regression_baseline.pkl`
		 - `ml-service/models/random_forest_baseline.pkl`
	 - Final selected model:
		 - `ml-service/models/final_model.pkl`

The `final_model.pkl` artifact is the one served by the FastAPI prediction service in `ml-service/app.py`.

---

## Scriptable Evaluation

While the notebooks provide rich visual analysis, you can also evaluate the final model from the command line using `ml-service/src/evaluate.py`:

```bash
cd ml-service
python -m src.evaluate
```

This script:

1. Loads the processed dataset (or triggers preprocessing if needed).
2. Performs a stratified train/test split using the same configuration as training.
3. Loads `final_model.pkl`.
4. Computes and prints Accuracy, Precision, Recall, F1, and ROC-AUC.

---

## Interpretation and Next Steps

- Metrics provide a baseline understanding of how well the current model distinguishes churners from non-churners.
- Future improvements may include:
	- Hyperparameter tuning (e.g., grid search or randomized search).
	- Cross-validation for more robust estimates.
	- Trying additional model families (e.g., gradient boosting, XGBoost, LightGBM).
	- Calibrating predicted probabilities if needed for downstream decision thresholds.

