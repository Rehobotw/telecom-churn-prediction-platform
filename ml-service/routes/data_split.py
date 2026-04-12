from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query

from src.data_split import get_split_partition

router = APIRouter(prefix="/data", tags=["data"])


@router.get("/train")
def training_data_route(
    limit: int | None = Query(default=50, ge=1, le=1000),
    include_target: bool = True,
) -> dict[str, Any]:
    try:
        return get_split_partition("train", limit=limit, include_target=include_target)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/test")
def test_data_route(
    limit: int | None = Query(default=50, ge=1, le=1000),
    include_target: bool = True,
) -> dict[str, Any]:
    try:
        return get_split_partition("test", limit=limit, include_target=include_target)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
