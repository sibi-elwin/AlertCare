"""
Pydantic models for ML API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class SensorReading(BaseModel):
    """Single sensor reading input."""
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    bloodPressure: Optional[float] = Field(None, description="Systolic blood pressure (mmHg)")
    bloodGlucose: Optional[float] = Field(None, description="Blood glucose level (mg/dL)")
    heartRate: Optional[float] = Field(None, description="Heart rate (bpm)")
    activity: Optional[float] = Field(None, description="Activity level (steps/hour equivalent)")


class PredictionRequest(BaseModel):
    """Request body for prediction endpoint."""
    readings: List[SensorReading] = Field(..., description="Array of sensor readings (minimum 168 hours required)")


class PredictionResponse(BaseModel):
    """Response from prediction endpoint."""
    healthStabilityScore: float = Field(..., description="Main health stability score (0-100)")
    isolationScore: float = Field(..., description="Isolation Forest score (0-100)")
    lstmScore: float = Field(..., description="LSTM Autoencoder score (0-100)")
    reconstructionError: Optional[float] = Field(None, description="LSTM reconstruction error (MSE)")
    riskCategory: str = Field(..., description="Risk category: Stable, Early Instability, Sustained Deterioration, High-Risk Decline")
    timestamp: str = Field(..., description="Timestamp of the prediction")


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str
    models_loaded: bool
    service: str

