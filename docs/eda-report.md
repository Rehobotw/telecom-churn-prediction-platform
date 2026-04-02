# Exploratory Data Analysis – Telecom Churn Dataset

This report summarizes the main findings from exploratory data analysis (EDA) performed in `ml-service/notebooks/01_eda.ipynb` on the raw telecom churn dataset.

---

## Dataset Overview

- **Source file**: `data/raw/telecom_churn.csv`
- **Number of records**: approximately 243,553 customers.
- **Target variable**: `churn` (binary: `0` = stayed, `1` = churned).

### Key Columns

- **Customer identifiers**: `customer_id`, `pincode`.
- **Demographics**:
	- `gender` (M/F)
	- `age`
	- `state`, `city`
- **Account information**:
	- `telecom_partner` (e.g., Airtel, Vodafone, BSNL, Reliance Jio)
	- `date_of_registration`
	- `num_dependents`
	- `estimated_salary`
- **Usage metrics**:
	- `calls_made`
	- `sms_sent`
	- `data_used`

---

## Data Quality

- **Missing values**:
	- EDA showed no significant missing data across key columns; missingness was negligible or zero for most fields.
- **Invalid values**:
	- Some usage columns contained **negative values**, which are not logically valid:
		- `calls_made`
		- `sms_sent`
		- `data_used`
	- These anomalies are handled later during preprocessing by replacing negatives with the median of valid values.

---

## Target Distribution (Churn)

- The dataset is **moderately imbalanced**:
	- Roughly **20%** of customers churn and **80%** remain.
- Implications:
	- Accuracy alone is not sufficient; metrics such as recall, precision, F1, and ROC-AUC are important during model evaluation.

---

## Categorical Features

### Telecom Partner

- The dataset includes multiple telecom partners (e.g., Airtel, Vodafone, BSNL, Reliance Jio).
- Distribution plots show:
	- Some partners have a larger share of customers.
	- Churn rate varies by partner but most customers across all partners do not churn.

### Gender

- No strong gender-based skew in churn probability was observed.

### Region (State and City)

- Customers are distributed across many states and cities.
- Churn distribution by **state** and **city** reveals that some regions may have slightly higher churn, but patterns are not dominated by a single area.

### Registration Date

- `date_of_registration` was converted to:
	- `registration_month`
	- `registration_year`
	- `days_since_registration`
- EDA examined churn over months and years:
	- Churn shows some variation by registration period, providing motivation for tenure-related features in preprocessing.

---

## Numerical Features

### Age

- Age ranges roughly from 18 to the mid-70s.
- The distribution peaks around middle-aged groups.
- An `age_group` feature was introduced to bucket ages into:
	- Young
	- Early Middle Age
	- Late Middle Age
	- Senior

### Estimated Salary

- Salary distribution is broad with no extreme missingness.
- Churn appears across the full salary range, with some mild variation in churn rates.

### Usage Metrics: Calls, SMS, Data

- `calls_made`, `sms_sent`, and `data_used` show reasonable usage patterns overall, with clear differences between low and high-usage customers.
- EDA highlighted the presence of **negative values**, motivating the median-imputation strategy for these features in preprocessing.

---

## Correlation Analysis

- A correlation heatmap (using numeric columns) was built after setting negative usage values to `NaN` and excluding identifiers.
- Findings:
	- Usage metrics (`calls_made`, `sms_sent`, `data_used`) have moderate correlations with each other.
	- The target `churn` shows useful but not extreme correlations with several features, supporting a multivariate modeling approach.

---

## Key EDA Insights

1. **Moderate class imbalance** (approximately 20% churn) requires careful choice of evaluation metrics.
2. **Negative usage values** in `calls_made`, `sms_sent`, and `data_used` must be corrected before modeling.
3. **Temporal and tenure-related patterns** suggest value in features like `registration_year` and `tenure_bucket`.
4. **Demographics and region** provide additional signal but do not dominate churn behavior alone.
5. EDA guided the design of the preprocessing pipeline and feature engineering implemented in `ml-service/src/preprocessing.py` and the corresponding notebook.

