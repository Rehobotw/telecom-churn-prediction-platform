# Exploratory Data Analysis and Strategic Research Synthesis

This report consolidates:

1. Empirical EDA findings from the telecom churn dataset used in this project.
2. Strategic decision guidance for converting churn scores into risk-action policy.
3. Business interpretation of model-ready features and operational implications.

## 1. Business Objective of EDA

The objective is not only to understand data quality and feature behavior, but to support a business-ready churn decision engine.

EDA therefore answers three practical questions:

1. Which variables are stable and reliable enough for production scoring?
2. Which customer segments show concentration of churn risk?
3. How should probability outputs map to intervention policy and capacity?

## 2. Dataset Profile

Primary sources in this project:

- Raw dataset: data/raw/telecom_churn.csv
- Processed dataset: data/processed/telecom_churn_clean.csv

Modeling target:

- Churn (binary event label)

Observed dataset characteristics used in project pipelines:

- Mixed feature space: demographic, account, billing, and service/usage indicators.
- Binary and categorical service attributes (for example contract, payment method, internet service).
- Numeric predictors (for example tenure and monthly charges).

## 3. Data Quality Findings

### 3.1 Missingness and Schema Integrity

EDA and preprocessing checks indicate that the core model fields are usable after standard cleaning steps. The pipeline enforces explicit feature schema before model input.

### 3.2 Invalid and Anomalous Values

Several operationally implausible entries (for example negative usage-like values in historical iterations) are handled during preprocessing and batch validation logic.

Data quality strategy in current implementation:

1. Strict input validation at backend prediction API.
2. ML-side batch validation and warning emission.
3. Controlled feature mapping from backend to ML schema.

### 3.3 Class Imbalance

Churn remains a minority class in the evaluation split, requiring threshold-sensitive metrics rather than accuracy-only optimization.

## 4. Feature Behavior and Business Signals

Project-level model metadata and analytics outputs show reliance on a compact feature set with interpretable drivers:

- Tenure
- MonthlyCharges
- num_services
- Contract category
- Payment method category
- Internet service category
- Paperless billing
- Dependents
- Derived tenure_group and charge_level features

Business interpretation:

1. Tenure and contract structure indicate commitment depth.
2. Billing/charges and payment behavior often indicate commercial friction or affordability stress.
3. Service mix and connectivity profile indicate experience and usage dependence.
4. Engineered grouping variables improve operational interpretability for segmentation.

## 5. Strategic Risk Classification Framework

The platform aligns with a three-band probability-to-action conversion:

- Low Risk: 0.00 to 0.33
- Medium Risk: 0.34 to 0.66
- High Risk: 0.67 to 1.00

This is implemented as an operational default and should be treated as a calibratable policy, not a fixed universal standard.

### 5.1 Why Probability Bands Instead of Binary Labels

Probability-first design supports:

1. Ranking customers by expected churn likelihood.
2. Capacity-aware intervention queues.
3. Economic threshold tuning against retention cost/benefit.

### 5.2 Action Mapping

- High Risk:
  - Immediate retention action.
  - Priority outreach and high-touch intervention.
- Medium Risk:
  - Proactive support and targeted lower-cost remediation.
- Low Risk:
  - Standard engagement and monitoring.

### 5.3 Capacity and Economics Interpretation

EDA-informed segmentation should be tied to execution limits:

1. Human retention team bandwidth.
2. Campaign channel capacity.
3. Cost of intervention versus expected churn loss.

## 6. Industry and Research Alignment

The strategic framework used in this project is consistent with telecom churn literature and standards-oriented guidance that emphasize:

1. Experience and service quality as key churn signals.
2. Operational behavior and switching outcomes over intention-only indicators.
3. Closed-loop customer experience management with measurable QoS and QoE context.

Implication for this platform:

- The current feature and policy structure is directionally aligned with evidence-backed churn management practice and can be extended with richer network QoS/QoE variables in future iterations.

## 7. Evidence-to-Implementation Bridge in This Project

### Implemented Today

1. Probability-based scoring.
2. Risk-level labeling from score.
3. Action-oriented risk messaging in UI.
4. Notification policy tied to high-risk and summary preferences.

### Not Yet Fully Implemented

1. Periodic threshold recalibration using realized outcomes.
2. Explicit intervention outcome tracking loop (did contacted high-risk customers retain?).
3. Formal cost-benefit optimizer for cutoff selection.

## 8. Calibration Plan (Recommended Operational Next Step)

To evolve from default thresholds to business-optimized thresholds:

1. Build decile lift table from historical scored predictions.
2. Estimate intervention success probability by risk segment.
3. Define marginal retention value and channel cost.
4. Solve for actionable cutoffs under weekly/monthly capacity constraints.
5. Review quarterly with model drift and campaign outcome data.

## 9. Literature Matrix (Compact Appendix)

| Evidence Source Category | Dataset/Scope Type | Key Drivers Highlighted | Threshold/Relevance to This Project |
| --- | --- | --- | --- |
| Systematic telecom churn reviews | Multi-study synthesis | Satisfaction, switching behavior, service quality | Supports probability-centric segmentation and calibrated threshold policy |
| Industry market intelligence (GSMA style) | Multi-market churn behavior and reasons | Experience quality, network performance, retention levers | Supports action-first prioritization and operational banding |
| Standards-oriented CEM guidance (ITU style) | QoS/QoE and journey management requirements | Service quality, escalation, experience governance | Supports closed-loop churn intervention design |

## 10. Final EDA Decision Statement

The current data and feature behavior support a probability-driven churn engine with three operational risk bands. The project should continue using the existing Low/Medium/High defaults as a controlled baseline, while introducing periodic calibration against capacity and economics to ensure the score-to-action policy remains defensible and high-impact.

