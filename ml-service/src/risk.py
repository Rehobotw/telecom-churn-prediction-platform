from __future__ import annotations


def classify_risk(probability: float, threshold: float) -> str:
    if probability >= threshold:
        return "High"
    if probability >= threshold * 0.6:
        return "Medium"
    return "Low"
