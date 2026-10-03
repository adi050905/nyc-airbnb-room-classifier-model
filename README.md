# NYC Airbnb Room Classifier

Production-style FastAPI and React application for classifying an NYC Airbnb listing as:

- Entire home/apt
- Private room
- Shared room

The backend serves the complete scikit-learn preprocessing and classifier pipeline. The frontend sends one validated listing at a time to `POST /predict`.

## Repository Layout

```text
backend/                         FastAPI service and tests
frontend/                        React + Vite client
Model_Pipeline.pkl               Trained model artifact
nyc_airbnb_room_type_classification.ipynb  Training and analysis notebook
```

## Model Artifact

`Model_Pipeline.pkl` is approximately 290 MB, so it must be stored with Git LFS or in an external model registry/object store. This repository includes `.gitattributes` for Git LFS.

```powershell
git lfs install
git lfs track "Model_Pipeline.pkl"
git add .gitattributes Model_Pipeline.pkl
```

Do not commit model credentials, API keys, `.env` files, raw exports, or generated build folders.

## Backend

The backend requires Python 3.12 and scikit-learn 1.6.1.

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

API documentation: `http://127.0.0.1:8000/docs`

For hosting, set `MODEL_PATH` to the mounted/downloaded model location and `CORS_ORIGINS` to the exact frontend origin. Never use `*` with credentials in production.

## Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the deployed backend URL before building:

```powershell
npm run build
```

The frontend contains no file-upload or batch-prediction flow and does not send `room_type`, because that is the prediction target.

## Validation

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```