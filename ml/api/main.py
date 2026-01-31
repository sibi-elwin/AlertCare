"""
FastAPI application for ML prediction service.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.models import PredictionRequest, PredictionResponse, HealthCheckResponse
from api.services.prediction_service import initialize_models, predict_anomaly_score

app = FastAPI(
    title="AlertCare ML API",
    version="1.0.0",
    description="ML prediction service for Silent Deterioration Detector (SDD)"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to track model loading
_models_loaded = False


@app.on_event("startup")
async def startup_event():
    """Load ML models on API startup."""
    global _models_loaded
    try:
        initialize_models()
        _models_loaded = True
        print("🚀 ML API started successfully")
    except Exception as e:
        print(f"❌ Failed to load models: {e}")
        _models_loaded = False


@app.get("/api/ml/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy" if _models_loaded else "unhealthy",
        "models_loaded": _models_loaded,
        "service": "AlertCare ML API"
    }


@app.post("/api/ml/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict health stability score from sensor readings.
    
    Requires at least 168 hours (7 days) of historical data for LSTM.
    Recommended: 720 hours (30 days) for better feature extraction.
    
    Args:
        request: PredictionRequest with array of sensor readings
    
    Returns:
        PredictionResponse with scores and risk category
    """
    try:
        # Convert Pydantic models to dicts
        readings = [r.dict() for r in request.readings]
        
        # Run prediction
        result = predict_anomaly_score(readings)
        
        return PredictionResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

