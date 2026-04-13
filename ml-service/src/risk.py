from __future__ import annotations


def classify_risk(probability: float, threshold: float) -> str:
    del threshold
    if probability >= 0.67:
        return "High"
    if probability >= 0.34:
        return "Medium"
    return "Low"
