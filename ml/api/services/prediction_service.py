"""
Prediction service for ML API.
Handles rolling window validation and prediction logic.
"""

import os
import sys
import pandas as pd
import numpy as np

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from system.sdd_system import SDDSystem
import pickle
import tensorflow as tf

# Model paths
MODEL_ROOT = os.getenv("ML_MODEL_PATH", "/app/model_store")
ISO_PATH = f"{MODEL_ROOT}/isolation_forest"
LSTM_PATH = f"{MODEL_ROOT}/lstm_autoencoder"

# Global SDD system instance (loaded on startup)
_sdd_system = None


def load_trained_models(sdd: SDDSystem) -> None:
    """
    Load trained Isolation Forest and LSTM Autoencoder from disk into the SDDSystem instance.
    """
    # Isolation Forest
    with open(f"{ISO_PATH}/model.pkl", "rb") as f:
        sdd.isolation_detector.model = pickle.load(f)

    with open(f"{ISO_PATH}/scaler.pkl", "rb") as f:
        sdd.isolation_detector.scaler = pickle.load(f)

    # LSTM Autoencoder
    sdd.lstm_detector.model = tf.keras.models.load_model(
        f"{LSTM_PATH}/model.keras"
    )

    with open(f"{LSTM_PATH}/scaler.pkl", "rb") as f:
        sdd.lstm_detector.scaler = pickle.load(f)

    with open(f"{LSTM_PATH}/stats.pkl", "rb") as f:
        stats = pickle.load(f)

    sdd.lstm_detector.mean_baseline_error = stats["mean_baseline_error"]
    sdd.lstm_detector.std_baseline_error = stats["std_baseline_error"]
    sdd.lstm_detector.error_threshold_95 = stats["threshold_95"]
    sdd.lstm_detector.error_threshold_99 = stats["threshold_99"]
    sdd.lstm_detector.sequence_length = stats["sequence_length"]


def initialize_models():
    """Load models on API startup."""
    global _sdd_system
    if _sdd_system is None:
        _sdd_system = SDDSystem()
        load_trained_models(_sdd_system)
        print("✅ ML models loaded successfully")
    return _sdd_system


def validate_rolling_window(readings, min_hours=168):
    """
    Validate that readings have sufficient history for LSTM.
    
    Args:
        readings: List of sensor reading dicts
        min_hours: Minimum hours required (default: 168 = 7 days)
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if not readings or len(readings) < 2:
        return False, "Need at least 2 readings"
    
    # Check if timestamps are in order
    try:
        timestamps = [pd.to_datetime(r['timestamp']) for r in readings]
        if timestamps != sorted(timestamps):
            return False, "Readings must be in chronological order"
        
        # Calculate time span
        time_span = (timestamps[-1] - timestamps[0]).total_seconds() / 3600  # hours
        
        if time_span < min_hours:
            return False, f"Need at least {min_hours} hours of data. Got {time_span:.1f} hours"
    except Exception as e:
        return False, f"Invalid timestamp format: {str(e)}"
    
    # Check for required fields
    required_fields = ['timestamp']
    for i, reading in enumerate(readings):
        missing = [f for f in required_fields if f not in reading]
        if missing:
            return False, f"Reading {i} missing required field: {missing[0]}"
    
    return True, None


def convert_to_dataframe(readings):
    """
    Convert list of sensor readings to pandas DataFrame.
    
    Args:
        readings: List of dicts with sensor data
    
    Returns:
        DataFrame with columns: timestamp, blood_pressure, blood_glucose, heart_rate, activity
    """
    df = pd.DataFrame(readings)
    
    # Rename columns to match ML system expectations
    column_mapping = {
        'bloodPressure': 'blood_pressure',
        'bloodGlucose': 'blood_glucose',
        'heartRate': 'heart_rate',
    }
    df = df.rename(columns=column_mapping)
    
    # Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Sort by timestamp (ensure chronological order)
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    # Ensure required columns exist (fill missing with None)
    required_cols = ['timestamp', 'blood_pressure', 'blood_glucose', 'heart_rate', 'activity']
    for col in required_cols:
        if col not in df.columns:
            df[col] = None
    
    # Forward fill missing values (for sparse data)
    # Note: pandas 2.0+ removed 'method' parameter, use ffill() and bfill() directly
    df[['blood_pressure', 'blood_glucose', 'heart_rate', 'activity']] = df[
        ['blood_pressure', 'blood_glucose', 'heart_rate', 'activity']
    ].ffill().bfill().fillna(0)  # Fill any remaining NaN with 0
    
    return df


def predict_anomaly_score(readings):
    """
    Main prediction function with rolling window handling.
    
    Args:
        readings: List of sensor reading dicts (should include rolling window)
    
    Returns:
        dict: Prediction results with scores for the most recent reading
    """
    global _sdd_system
    
    # Initialize models if not loaded
    if _sdd_system is None:
        _sdd_system = initialize_models()
    
    # Validate rolling window
    is_valid, error_msg = validate_rolling_window(readings, min_hours=168)
    if not is_valid:
        raise ValueError(f"Invalid rolling window: {error_msg}")
    
    # Convert to DataFrame
    data = convert_to_dataframe(readings)
    
    # Run prediction (SDD system handles rolling windows internally)
    results = _sdd_system.predict(data)
    
    # Get the LAST prediction (most recent reading)
    last_idx = len(results['health_stability_score']) - 1
    
    # Get risk category
    from scoring.stability_scorer import HealthStabilityScorer
    scorer = HealthStabilityScorer()
    risk_category = scorer.interpret_score(results['health_stability_score'][last_idx])
    
    # Return prediction for the most recent reading
    return {
        'healthStabilityScore': float(results['health_stability_score'][last_idx]),
        'isolationScore': float(results['isolation_scores'][last_idx]),
        'lstmScore': float(results['lstm_scores'][last_idx]),
        'reconstructionError': float(results['reconstruction_errors'][last_idx]) if results['reconstruction_errors'][last_idx] > 0 else None,
        'riskCategory': risk_category,
        'timestamp': data['timestamp'].iloc[last_idx].isoformat(),
    }

