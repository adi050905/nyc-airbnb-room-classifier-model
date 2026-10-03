# NYC Airbnb Room Classifier 🏙️

This project predicts the room type of an Airbnb listing in New York City.

The classifier supports three room types:

- Entire home or apartment
- Private room
- Shared room

The project includes a FastAPI backend, a React frontend, and the trained scikit-learn pipeline used for predictions.

## What It Does

You enter details about one listing, such as price, location, minimum nights, reviews, and availability. The application returns:

- The predicted room type
- A confidence score
- The probability for each room type

The frontend does not upload files or run batch predictions. It sends one listing at a time to the backend.

## Project Files

```text
backend/                                  FastAPI backend and tests
frontend/                                 React and Vite frontend
Model_Pipeline.pkl                        Trained model pipeline
nyc_airbnb_room_type_classification.ipynb Training and analysis notebook
```

## Requirements

- Python 3.12
- scikit-learn 1.6.1
- Node.js and npm
- Git LFS for the model file

## Start the Backend

Open PowerShell in the project folder:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

Open the API documentation here:

```text
http://127.0.0.1:8000/docs
```

## Start the Frontend

Open another PowerShell window:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open the frontend here:

```text
http://127.0.0.1:5173
```

The frontend uses `VITE_API_BASE_URL` from `frontend/.env` to find the backend.

## API Example

Send a request to `POST /predict`:

```json
{
  "latitude": 40.75362,
  "longitude": -73.98377,
  "price": 150,
  "minimum_nights": 3,
  "number_of_reviews": 45,
  "reviews_per_month": 1.2,
  "calculated_host_listings_count": 2,
  "availability_365": 200,
  "neighbourhood_group": "Manhattan",
  "neighbourhood": "Midtown"
}
```

Example response:

```json
{
  "room_type": "Entire home/apt",
  "confidence": 0.61683,
  "probabilities": {
    "Entire home/apt": 0.61683,
    "Private room": 0.38317,
    "Shared room": 0
  }
}
```

The confidence score is the model's probability for the selected class. It is not a guarantee of correctness.

## Run Tests

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

Build the frontend:

```powershell
cd frontend
npm run build
```

## Git LFS and the Model File

The model file is about 290 MB. GitHub normally rejects files larger than 100 MB, so this project uses Git LFS.

```powershell
git lfs install
git lfs track "Model_Pipeline.pkl"
git add .gitattributes Model_Pipeline.pkl
```

For a hosted service, you can also store the model in object storage and set `MODEL_PATH` to the mounted file path.

## Production Settings 🔒

Set these backend environment variables on your hosting platform:

```env
MODEL_PATH=/models/Model_Pipeline.pkl
CORS_ORIGINS=https://your-frontend-domain.com
```

Keep these files private and never commit them:

- `.env`
- API keys
- Passwords
- Cloud credentials
- Private data exports

Only use the `.env.example` files as templates.

## Notes

The complete preprocessing pipeline is stored inside `Model_Pipeline.pkl`. The backend sends the raw listing features to that pipeline, so the frontend does not duplicate the training transformations.