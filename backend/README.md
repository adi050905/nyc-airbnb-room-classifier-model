# NYC Airbnb classifier backend

This API serves `Model_Pipeline.pkl` with the same scikit-learn version used to create it: Python 3.12 and scikit-learn 1.6.1.

## Setup on Windows

From this `backend` directory. Set `$python` to the Python 3.12 executable installed on your machine:

```powershell
$python = "$env:USERPROFILE\AppData\Roaming\uv\python\cpython-3.12.13-windows-x86_64-none\python.exe"
& $python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Run

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the interactive API documentation.

## Verify

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

The model is loaded lazily on the first health or prediction request. The complete sklearn pipeline owns preprocessing; the API does not duplicate or bypass it.