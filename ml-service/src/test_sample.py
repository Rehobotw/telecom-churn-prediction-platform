from __future__ import annotations

import pandas as pd

from src.batch_predict import batch_predict
from src.config import RAW_DATA_PATH
from src.predict import predict_single


def run_sample_tests() -> None:
    sample_df = pd.read_csv(RAW_DATA_PATH).head(5).drop(columns=["Churn"], errors="ignore")

    single_input = sample_df.iloc[0].to_dict()
    single_result = predict_single(single_input)
    print("Single prediction:")
    print(single_result)

    scored_df, records = batch_predict(sample_df)
    print("\nBatch prediction preview:")
    print(scored_df[["probability", "prediction", "risk"]].head())
    print("\nBatch prediction JSON preview:")
    print(records[:2])


if __name__ == "__main__":
    run_sample_tests()