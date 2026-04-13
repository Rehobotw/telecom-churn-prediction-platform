from __future__ import annotations

from dataclasses import asdict, dataclass
from functools import lru_cache
from typing import Any

import pandas as pd

from .config import RAW_DATA_PATH
from .preprocessing import (
    CATEGORICAL_COLUMNS,
    NUMERIC_COLUMNS,
    SERVICE_COLUMNS,
    load_dataset,
    load_preprocessor,
)

DERIVED_COLUMNS = {"num_services", "tenure_group", "charge_level"}
REQUIRED_BASE_COLUMNS = {
    "gender",
    "Dependents",
    "tenure",
    "PhoneService",
    "InternetService",
    "Contract",
    "PaperlessBilling",
    "PaymentMethod",
    "MonthlyCharges",
}
BOOLEAN_LIKE_COLUMNS = set(SERVICE_COLUMNS) | {"Dependents", "PhoneService", "PaperlessBilling"}
HEADER_ALIASES = {
    "customer_id": "customerID",
    "customerid": "customerID",
    "gender": "gender",
    "dependents": "Dependents",
    "tenure": "tenure",
    "phone_service": "PhoneService",
    "phoneservice": "PhoneService",
    "internet_service": "InternetService",
    "internetservice": "InternetService",
    "contract": "Contract",
    "contract_type": "Contract",
    "contracttype": "Contract",
    "paperless_billing": "PaperlessBilling",
    "paperlessbilling": "PaperlessBilling",
    "payment_method": "PaymentMethod",
    "paymentmethod": "PaymentMethod",
    "monthly_charges": "MonthlyCharges",
    "monthlycharges": "MonthlyCharges",
    "total_charges": "TotalCharges",
    "totalcharges": "TotalCharges",
    "num_services": "num_services",
    "numservices": "num_services",
    "tenure_group": "tenure_group",
    "tenuregroup": "tenure_group",
    "charge_level": "charge_level",
    "chargelevel": "charge_level",
    "online_security": "OnlineSecurity",
    "onlinesecurity": "OnlineSecurity",
    "online_backup": "OnlineBackup",
    "onlinebackup": "OnlineBackup",
    "device_protection": "DeviceProtection",
    "deviceprotection": "DeviceProtection",
    "tech_support": "TechSupport",
    "techsupport": "TechSupport",
    "streaming_tv": "StreamingTV",
    "streamingtv": "StreamingTV",
    "streaming_movies": "StreamingMovies",
    "streamingmovies": "StreamingMovies",
    "multiple_lines": "MultipleLines",
    "multiplelines": "MultipleLines",
    "partner": "Partner",
    "senior_citizen": "SeniorCitizen",
    "seniorcitizen": "SeniorCitizen",
    "churn": "Churn",
}
YES_NO_MAP = {
    "yes": "Yes",
    "y": "Yes",
    "true": "Yes",
    "t": "Yes",
    "1": "Yes",
    "no": "No",
    "n": "No",
    "false": "No",
    "f": "No",
    "0": "No",
}
GENDER_MAP = {
    "m": "Male",
    "male": "Male",
    "f": "Female",
    "female": "Female",
}
INTERNET_SERVICE_MAP = {
    "dsl": "DSL",
    "fiber": "Fiber optic",
    "fiber optic": "Fiber optic",
    "fiberoptic": "Fiber optic",
    "no": "No",
    "none": "No",
    "no internet service": "No",
}
CONTRACT_MAP = {
    "month to month": "Month-to-month",
    "month-to-month": "Month-to-month",
    "monthly": "Month-to-month",
    "one year": "One year",
    "1 year": "One year",
    "annual": "One year",
    "two year": "Two year",
    "2 year": "Two year",
}
PAYMENT_METHOD_MAP = {
    "electronic check": "Electronic check",
    "mailed check": "Mailed check",
    "bank transfer automatic": "Bank transfer (automatic)",
    "bank transfer (automatic)": "Bank transfer (automatic)",
    "credit card automatic": "Credit card (automatic)",
    "credit card (automatic)": "Credit card (automatic)",
}


@dataclass
class ValidationIssue:
    row: int
    column: str
    message: str


@dataclass
class BatchValidationResult:
    dataframe: pd.DataFrame
    warnings: list[str]
    row_warnings: list[dict[str, Any]]
    ignored_columns: list[str]


def _normalize_header(column_name: Any) -> str:
    text = str(column_name).strip()
    parts: list[str] = []
    previous_was_lower = False
    for char in text:
        if char.isupper() and previous_was_lower:
            parts.append("_")
        if char.isalnum():
            parts.append(char.lower())
        else:
            parts.append("_")
        previous_was_lower = char.islower() or char.isdigit()

    normalized = "".join(parts)
    while "__" in normalized:
        normalized = normalized.replace("__", "_")
    return normalized.strip("_")


def _canonicalize_headers(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, str]]:
    renamed_columns: dict[str, str] = {}
    seen_targets: dict[str, int] = {}
    for original_column in df.columns:
        normalized = _normalize_header(original_column)
        canonical = HEADER_ALIASES.get(normalized, original_column)
        if canonical in seen_targets:
            seen_targets[canonical] += 1
            canonical = f"{canonical}__duplicate_{seen_targets[canonical]}"
        else:
            seen_targets[canonical] = 0
        renamed_columns[original_column] = canonical

    return df.rename(columns=renamed_columns), renamed_columns


@lru_cache(maxsize=1)
def _training_profile() -> dict[str, Any]:
    training_df = load_dataset(RAW_DATA_PATH).copy()

    service_columns = [column for column in SERVICE_COLUMNS if column in training_df.columns]
    if "num_services" not in training_df.columns:
        training_df["num_services"] = (training_df[service_columns] == "Yes").sum(axis=1)
    if "tenure_group" not in training_df.columns and "tenure" in training_df.columns:
        training_df["tenure_group"] = pd.cut(
            training_df["tenure"],
            bins=[0, 12, 24, 48, 72],
            labels=["new", "early", "established", "loyal"],
        )
    if "charge_level" not in training_df.columns and "MonthlyCharges" in training_df.columns:
        training_df["charge_level"] = pd.cut(
            training_df["MonthlyCharges"],
            bins=[0, 40, 80, 120],
            labels=["low", "medium", "high"],
        )

    numeric_fill: dict[str, float] = {}
    for column in NUMERIC_COLUMNS:
        numeric_series = pd.to_numeric(training_df[column], errors="coerce")
        numeric_fill[column] = float(numeric_series.median()) if not numeric_series.dropna().empty else 0.0

    categorical_modes: dict[str, str] = {}
    categorical_allowed: dict[str, set[str]] = {}
    for column in CATEGORICAL_COLUMNS:
        series = training_df[column].dropna().astype(str).str.strip()
        series = series[series.ne("")]
        categorical_allowed[column] = set(series.unique().tolist())
        categorical_modes[column] = series.mode().iat[0] if not series.empty else "Unknown"

    return {
        "numeric_fill": numeric_fill,
        "categorical_modes": categorical_modes,
        "categorical_allowed": categorical_allowed,
    }


def _add_row_warning(issues: list[ValidationIssue], row_index: int, column: str, message: str) -> None:
    issues.append(ValidationIssue(row=row_index + 1, column=column, message=message))


def _normalize_categorical_value(
    value: Any,
    *,
    mapping: dict[str, str] | None = None,
    allowed_values: set[str] | None = None,
) -> tuple[Any, str | None]:
    if pd.isna(value):
        return pd.NA, None

    text = str(value).strip()
    if not text:
        return pd.NA, None

    normalized = mapping.get(text.lower(), text) if mapping else text
    if allowed_values and normalized not in allowed_values:
        return "Unknown", f"invalid categorical value '{text}' replaced with 'Unknown'"

    return normalized, None


def _coerce_numeric(series: pd.Series, *, column: str, issues: list[ValidationIssue]) -> pd.Series:
    original = series.copy()
    numeric = pd.to_numeric(series, errors="coerce")

    invalid_mask = numeric.isna() & original.notna() & original.astype(str).str.strip().ne("")
    for row_index in original.index[invalid_mask]:
        _add_row_warning(issues, int(row_index), column, f"non-numeric value '{original.loc[row_index]}' converted to missing")

    negative_mask = numeric < 0
    for row_index in numeric.index[negative_mask.fillna(False)]:
        _add_row_warning(issues, int(row_index), column, f"negative value '{original.loc[row_index]}' converted to missing")
    return numeric.mask(negative_mask)


def validate_batch_dataframe(input_df: pd.DataFrame, preprocessor: Any | None = None) -> BatchValidationResult:
    if input_df.empty:
        raise ValueError("CSV file is empty.")

    preprocessor = preprocessor or load_preprocessor()
    expected_columns = list(preprocessor.feature_names_in_)
    canonical_df, renamed_columns = _canonicalize_headers(input_df)
    profile = _training_profile()

    warnings: list[str] = []
    issues: list[ValidationIssue] = []

    normalized_name_changes = [
        f"{original} -> {renamed}"
        for original, renamed in renamed_columns.items()
        if str(original) != renamed and "__duplicate_" not in renamed
    ]
    if normalized_name_changes:
        preview = ", ".join(normalized_name_changes[:5])
        suffix = " ..." if len(normalized_name_changes) > 5 else ""
        warnings.append(f"Normalized column names: {preview}{suffix}")

    missing_columns = sorted(REQUIRED_BASE_COLUMNS - set(canonical_df.columns))
    if "num_services" not in canonical_df.columns:
        present_service_columns = [column for column in SERVICE_COLUMNS if column in canonical_df.columns]
        if len(present_service_columns) != len(SERVICE_COLUMNS):
            if present_service_columns:
                missing_columns.extend(sorted(set(SERVICE_COLUMNS) - set(present_service_columns)))
            else:
                missing_columns.append("num_services")

    missing_columns = sorted(dict.fromkeys(missing_columns))
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")

    ignored_columns = sorted(
        column
        for column in canonical_df.columns
        if column not in set(expected_columns) | set(SERVICE_COLUMNS)
    )
    if ignored_columns:
        warnings.append(f"{len(ignored_columns)} unused columns were ignored")

    working_df = canonical_df.copy()

    for column in BOOLEAN_LIKE_COLUMNS:
        if column not in working_df.columns:
            continue
        normalized_values: list[Any] = []
        for row_index, value in enumerate(working_df[column].tolist()):
            normalized, warning = _normalize_categorical_value(
                value,
                mapping=YES_NO_MAP,
                allowed_values={"Yes", "No"},
            )
            if warning:
                _add_row_warning(issues, row_index, column, warning)
            normalized_values.append(normalized)
        working_df[column] = normalized_values

    categorical_maps = {
        "gender": GENDER_MAP,
        "InternetService": INTERNET_SERVICE_MAP,
        "Contract": CONTRACT_MAP,
        "PaymentMethod": PAYMENT_METHOD_MAP,
    }
    for column in CATEGORICAL_COLUMNS:
        if column not in working_df.columns:
            continue
        allowed_values = profile["categorical_allowed"].get(column)
        normalized_values = []
        for row_index, value in enumerate(working_df[column].tolist()):
            normalized, warning = _normalize_categorical_value(
                value,
                mapping=categorical_maps.get(column),
                allowed_values=allowed_values,
            )
            if warning:
                _add_row_warning(issues, row_index, column, warning)
            normalized_values.append(normalized)
        working_df[column] = normalized_values

    present_service_columns = [column for column in SERVICE_COLUMNS if column in working_df.columns]
    if "num_services" not in working_df.columns and present_service_columns:
        working_df["num_services"] = (working_df[present_service_columns] == "Yes").sum(axis=1)

    for column in NUMERIC_COLUMNS:
        if column not in working_df.columns:
            continue
        working_df[column] = _coerce_numeric(working_df[column], column=column, issues=issues)

    for column in NUMERIC_COLUMNS:
        if column not in working_df.columns:
            working_df[column] = profile["numeric_fill"].get(column, 0.0)
        missing_mask = working_df[column].isna()
        if missing_mask.any():
            working_df.loc[missing_mask, column] = profile["numeric_fill"].get(column, 0.0)
            warnings.append(f"Filled missing numeric values in '{column}' using training median")

    if "tenure_group" not in working_df.columns:
        working_df["tenure_group"] = pd.cut(
            working_df["tenure"],
            bins=[0, 12, 24, 48, 72],
            labels=["new", "early", "established", "loyal"],
        )
    else:
        tenure_group_missing = working_df["tenure_group"].isna() | working_df["tenure_group"].astype(str).str.strip().eq("")
        if tenure_group_missing.any():
            working_df.loc[tenure_group_missing, "tenure_group"] = pd.cut(
                working_df.loc[tenure_group_missing, "tenure"],
                bins=[0, 12, 24, 48, 72],
                labels=["new", "early", "established", "loyal"],
            )

    if "charge_level" not in working_df.columns:
        working_df["charge_level"] = pd.cut(
            working_df["MonthlyCharges"],
            bins=[0, 40, 80, 120],
            labels=["low", "medium", "high"],
        )
    else:
        charge_level_missing = working_df["charge_level"].isna() | working_df["charge_level"].astype(str).str.strip().eq("")
        if charge_level_missing.any():
            working_df.loc[charge_level_missing, "charge_level"] = pd.cut(
                working_df.loc[charge_level_missing, "MonthlyCharges"],
                bins=[0, 40, 80, 120],
                labels=["low", "medium", "high"],
            )

    for column in CATEGORICAL_COLUMNS:
        if column not in working_df.columns:
            continue
        fill_mask = working_df[column].isna() | working_df[column].astype(str).str.strip().eq("")
        if fill_mask.any():
            working_df.loc[fill_mask, column] = profile["categorical_modes"].get(column, "Unknown")
            warnings.append(f"Filled missing categorical values in '{column}' using training mode")

    aligned_df = working_df.copy()
    for column in expected_columns:
        if column not in aligned_df.columns:
            if column in profile["numeric_fill"]:
                aligned_df[column] = profile["numeric_fill"][column]
            else:
                aligned_df[column] = profile["categorical_modes"].get(column, "Unknown")
    aligned_df = aligned_df[expected_columns]

    row_warnings = [asdict(issue) for issue in issues]
    if row_warnings:
        warnings.append(f"{len(row_warnings)} row-level validation warnings were recorded")

    return BatchValidationResult(
        dataframe=aligned_df,
        warnings=list(dict.fromkeys(warnings)),
        row_warnings=row_warnings,
        ignored_columns=ignored_columns,
    )
