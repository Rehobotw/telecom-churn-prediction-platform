from __future__ import annotations

from typing import Any

from sklearn.model_selection import train_test_split

from .config import PROCESSED_DATA_PATH, RANDOM_STATE, TARGET_COLUMN, TEST_SIZE
from .preprocessing import load_dataset, split_features_target


def get_train_test_split(
    limit: int | None = None,
    include_target: bool = True,
) -> dict[str, Any]:
    df = load_dataset(PROCESSED_DATA_PATH)
    X, y = split_features_target(df, target_column=TARGET_COLUMN)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    train_df = X_train.copy()
    test_df = X_test.copy()
    if include_target:
        train_df[TARGET_COLUMN] = y_train.values
        test_df[TARGET_COLUMN] = y_test.values

    if limit is not None:
        train_df = train_df.head(limit)
        test_df = test_df.head(limit)

    return {
        "target_column": TARGET_COLUMN,
        "feature_columns": X.columns.tolist(),
        "split": {
            "random_state": RANDOM_STATE,
            "test_size": TEST_SIZE,
            "stratified": True,
            "dataset": str(PROCESSED_DATA_PATH),
        },
        "train": {
            "rows": int(len(X_train)),
            "records": train_df.to_dict(orient="records"),
        },
        "test": {
            "rows": int(len(X_test)),
            "records": test_df.to_dict(orient="records"),
        },
    }


def get_split_partition(
    partition: str,
    limit: int | None = None,
    include_target: bool = True,
) -> dict[str, Any]:
    split_data = get_train_test_split(limit=limit, include_target=include_target)

    if partition not in {"train", "test"}:
        raise ValueError("partition must be either 'train' or 'test'.")

    return {
        "target_column": split_data["target_column"],
        "feature_columns": split_data["feature_columns"],
        "split": split_data["split"],
        "partition": partition,
        "rows": split_data[partition]["rows"],
        "returned_records": len(split_data[partition]["records"]),
        "records": split_data[partition]["records"],
    }
