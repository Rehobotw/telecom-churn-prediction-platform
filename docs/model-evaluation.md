# Model Evaluation and Decision Utility Report

This report documents the saved dataset evaluation results and model selection logic for the telecom churn platform.

## 1. Evaluation Objective

The evaluation goal is two-layered:

1. Statistical quality: identify a model with strong minority-class ranking and detection performance.
2. Score interpretation: map model probabilities to descriptive risk bands (Low/Medium/High).

## 2. Current Model Selection State

From current model metadata:

- Selected model: random_forest
- Baseline alternatives tracked: logistic_regression, random_forest
- Selection criterion: best ROC-AUC on test split

Relevant saved artifacts:

- final_model.pkl
- preprocessor.pkl
- model_metadata.json
- metrics.json

## 3. Current Test Metrics (From metrics.json)

Random Forest test metrics:

- Accuracy: 0.7601
- Precision: 0.5340
- Recall: 0.7567
- F1 Score: 0.6261
- ROC-AUC: 0.8424
- Confusion matrix:
  - TN: 788
  - FP: 247
  - FN: 91
  - TP: 283

Logistic Regression comparison metrics (from model_metadata.json):

- Accuracy: 0.7353
- Precision: 0.5009
- Recall: 0.7781
- F1 Score: 0.6094
- ROC-AUC: 0.8409

Interpretation:

- Random forest achieved the best AUC and better precision/F1 than logistic baseline, with slightly lower recall.
- This supports its selection as the current model in the saved project metadata.

## 4. Why Accuracy Is Secondary

Churn prediction is class-imbalanced. Therefore:

- Accuracy is not sufficient to evaluate the minority class.
- Precision and recall help describe positive-class detection and false positives.
- ROC-AUC is central for ranking quality before thresholding.

This is consistent with current selection logic and downstream risk-band usage.

## 5. Probability-to-Risk Decision Layer

The platform uses probability score as primary output and maps it to risk labels:

- Low: 0.00 to 0.33
- Medium: 0.34 to 0.66
- High: 0.67 to 1.00

Decision impact:

1. Supports ranking customers by model score.
2. Separates score ranges for review.
3. Makes model outputs easier to interpret.

## 6. Threshold Strategy and Calibration Guidance

Current thresholds are a default operational baseline. To mature into a governed decision policy, apply the following calibration cycle:

1. Build probability deciles and realized churn rates.
2. Compare calibration and realized outcomes by score range.
3. Review high-risk cutoff against validation results.
4. Re-evaluate cutoffs when the data or model changes.
5. Revalidate after model retrain or data distribution shift.

## 7. Validation Design Review

Implemented/available validation elements:

- Stratified train/test evaluation in training/evaluation scripts.
- Confusion matrix and ROC curve artifacts.
- Side-by-side baseline model comparison.
- Metrics endpoint for runtime observability.

Recommended next hardening:

1. Cross-validation confidence intervals.
2. Temporal validation split for drift-sensitive checks.
3. Calibration diagnostics (reliability curve, Brier score).
4. Segment-level evaluation (contract type, tenure buckets, payment methods).

## 8. Operational Metrics to Track Post-Deployment

To close the model-to-business loop, track monthly:

1. Precision and recall by evaluation period.
2. Calibration by probability range.
3. False positive and false negative counts.
4. Drift in input and risk-band distributions.

## 9. Final Evaluation Decision Statement

The saved Random Forest evaluation has the highest ROC-AUC among the tracked baselines. These are dataset evaluation results and do not guarantee production performance. The probability bands are descriptive defaults and should be reviewed with new validation data.

