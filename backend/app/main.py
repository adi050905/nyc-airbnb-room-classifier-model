import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = Path(os.getenv("MODEL_PATH", str(PROJECT_ROOT / "Model_Pipeline.pkl"))).resolve()
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]


class ListingFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    price: float = Field(ge=0)
    minimum_nights: float = Field(ge=0)
    number_of_reviews: float = Field(ge=0)
    reviews_per_month: float | None = Field(default=None, ge=0)
    calculated_host_listings_count: float = Field(ge=0)
    availability_365: float = Field(ge=0, le=365)
    neighbourhood_group: str = Field(min_length=1)
    neighbourhood: str = Field(min_length=1)


class PredictionResponse(BaseModel):
    room_type: str
    confidence: float
    probabilities: dict[str, float]


class HealthResponse(BaseModel):
    status: str
    model: str
    sklearn_version: str


@lru_cache(maxsize=1)
def get_model() -> Any:
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Model artifact not found: {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


def _as_frame(payload: ListingFeatures) -> pd.DataFrame:
    return pd.DataFrame([payload.model_dump()])


app = FastAPI(
    title="NYC Airbnb Room Type Classifier",
    version="1.0.0",
    description="Predicts an Airbnb listing's room type using the trained sklearn pipeline.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    try:
        import sklearn

        get_model()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {exc}") from exc
    return HealthResponse(status="ok", model=MODEL_PATH.name, sklearn_version=sklearn.__version__)


@app.get("/metadata")
def metadata() -> dict[str, Any]:
    try:
        model = get_model()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {exc}") from exc

    return {
        "model_file": MODEL_PATH.name,
        "classes": [str(value) for value in getattr(model, "classes_", [])],
        "features": list(getattr(model, "feature_names_in_", [])),
        "pipeline_steps": list(getattr(model, "named_steps", {}).keys()),
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: ListingFeatures) -> PredictionResponse:
    try:
        model = get_model()
        frame = _as_frame(payload)
        label = str(model.predict(frame)[0])
        probabilities = model.predict_proba(frame)[0]
        classes = getattr(model, "classes_", [])
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Prediction failed: {exc}") from exc

    probability_map = {
        str(class_name): round(float(probability), 6)
        for class_name, probability in zip(classes, probabilities)
    }
    return PredictionResponse(
        room_type=label,
        confidence=round(float(max(probabilities)), 6),
        probabilities=probability_map,
    )