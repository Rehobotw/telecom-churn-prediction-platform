# Exploratory Data Analysis

This report summarizes the dataset and feature checks used to prepare telecom customer records for churn modeling.

## Dataset and target

The modeling target is the binary churn label. The source data combines demographic, account, billing, and service attributes. The pipeline uses numeric fields such as tenure and monthly charges alongside categorical fields such as contract, payment method, and internet service.

## Data quality and preparation

- Preprocessing establishes the feature schema expected by the trained models.
- Batch validation checks uploaded CSV columns and values and returns warnings for rows that need attention.
- The backend validates single-prediction requests before forwarding model features to the ML service.
- Churn is a minority class in the evaluation split, so model review includes precision, recall, F1, and ROC-AUC alongside accuracy.

## Features used by the model

Current model metadata lists tenure, monthly charges, number of services, contract and payment attributes, internet service, paperless billing, dependents, and engineered tenure and charge groups.

## Risk bands

The application maps predicted probabilities to descriptive risk labels:

- Low: 0.00 to 0.33
- Medium: 0.34 to 0.66
- High: 0.67 to 1.00

These bands summarize model scores and are not a universal decision threshold.

## Further evaluation

Potential analytical follow-up includes temporal validation, calibration diagnostics, segment-level model evaluation, and monitoring for changes in input distributions. Current model comparison results are documented in [Model Evaluation](model-evaluation.md).
