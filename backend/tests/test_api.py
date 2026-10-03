from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


SAMPLE_LISTING = {
    "latitude": 40.75362,
    "longitude": -73.98377,
    "price": 150,
    "minimum_nights": 3,
    "number_of_reviews": 45,
    "reviews_per_month": 1.2,
    "calculated_host_listings_count": 2,
    "availability_365": 200,
    "neighbourhood_group": "Manhattan",
    "neighbourhood": "Midtown",
}


def test_health_loads_model():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["sklearn_version"] == "1.6.1"


def test_predict_returns_class_and_probabilities():
    response = client.post("/predict", json=SAMPLE_LISTING)
    assert response.status_code == 200
    body = response.json()
    assert body["room_type"] in {"Entire home/apt", "Private room", "Shared room"}
    assert 0 <= body["confidence"] <= 1
    assert abs(sum(body["probabilities"].values()) - 1) < 0.001


def test_unknown_fields_are_rejected():
    response = client.post("/predict", json={**SAMPLE_LISTING, "room_type": "Private room"})
    assert response.status_code == 422