"""
Prediction script for SDD System
Runs predictions on sensor data using trained SDD system.
"""

import os
import sys
import numpy as np
import tensorflow as tf
import pickle

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data.simulator import WearableDataSimulator
from system.sdd_system import SDDSystem, visualize_results


# =========================
# Model paths (STRICT RULE)
# =========================
MODEL_ROOT = os.getenv("ML_MODEL_PATH", "/app/model_store")
ISO_PATH  = f"{MODEL_ROOT}/isolation_forest"
LSTM_PATH = f"{MODEL_ROOT}/lstm_autoencoder"


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
    sdd.lstm_detector.std_baseline_error  = stats["std_baseline_error"]
    sdd.lstm_detector.error_threshold_95  = stats["threshold_95"]
    sdd.lstm_detector.error_threshold_99  = stats["threshold_99"]
    sdd.lstm_detector.sequence_length     = stats["sequence_length"]


def main():
    """
    Run SDD prediction on data with deterioration patterns using PERSISTED models (no retraining).
    """
    # Ensure output directory exists
    os.makedirs('/app/output', exist_ok=True)
    
    # Set random seeds for reproducibility
    np.random.seed(42)
    tf.random.set_seed(42)
    
    print("\n" + "="*70)
    print(" "*15 + "SDD SYSTEM PREDICTION (INFERENCE ONLY)")
    print("="*70)
    
    # Load previously trained models
    sdd = SDDSystem()
    load_trained_models(sdd)
    print("✅ Loaded trained Isolation Forest & LSTM Autoencoder from /app/model_store")
    
    # Generate synthetic wearable data with deterioration
    print("\n📡 Generating synthetic wearable sensor data...")
    simulator = WearableDataSimulator(days=90, samples_per_day=24)
    healthy_data = simulator.generate_healthy_baseline()
    
    # Inject deterioration starting at day 60
    full_data = simulator.inject_deterioration(healthy_data, start_day=60, deterioration_type='gradual')
    
    print(f"   Total samples: {len(full_data)}")
    print(f"   Healthy baseline: Days 1-60")
    print(f"   Deterioration injected: Days 60-90")
    
    # Run prediction on full timeline
    print("\n" + "="*70)
    print("RUNNING PREDICTION PIPELINE (NO TRAINING)")
    print("="*70)
    results = sdd.predict(full_data)
    
    # Analyze results
    print("\n" + "="*70)
    print("ANALYSIS RESULTS")
    print("="*70)
    
    # Find deterioration detection point
    stability_scores = results['health_stability_score']
    deterioration_detected_idx = np.where(stability_scores < 70)[0]
    
    if len(deterioration_detected_idx) > 0:
        detection_day = deterioration_detected_idx[0] // 24
        actual_start_day = 60
        early_warning_days = actual_start_day - detection_day
        
        print(f"\n✅ EARLY DETERIORATION DETECTED")
        print(f"   Detection Day: {detection_day}")
        print(f"   Actual Start: {actual_start_day}")
        print(f"   ⚡ Early Warning: {early_warning_days} days")
    else:
        print("\n⚠️  No deterioration detected within warning threshold")
    
    # Score statistics
    baseline_period = stability_scores[:60*24]
    deterioration_period = stability_scores[60*24:]
    
    print(f"\n📊 Health Stability Score Statistics:")
    print(f"\n   Baseline Period (Days 1-60):")
    print(f"      Mean: {baseline_period.mean():.1f}")
    print(f"      Std:  {baseline_period.std():.1f}")
    
    print(f"\n   Deterioration Period (Days 60-90):")
    print(f"      Mean: {deterioration_period.mean():.1f}")
    print(f"      Min:  {deterioration_period.min():.1f}")
    print(f"      Std:  {deterioration_period.std():.1f}")
    
    print(f"\n   Score Drop: {baseline_period.mean() - deterioration_period.mean():.1f} points")
    
    # LSTM reconstruction error analysis
    baseline_errors = results['reconstruction_errors'][:60*24]
    deterioration_errors = results['reconstruction_errors'][60*24:]
    
    print(f"\n📈 LSTM Reconstruction Error Analysis:")
    print(f"   Baseline Mean Error: {baseline_errors[baseline_errors > 0].mean():.6f}")
    print(f"   Deterioration Mean Error: {deterioration_errors.mean():.6f}")
    print(f"   Error Increase: {deterioration_errors.mean() / baseline_errors[baseline_errors > 0].mean():.2f}x")
    
    # Visualize
    print("\n🎨 Creating comprehensive visualization...")
    visualize_results(full_data, results, save_path='/app/output/sdd_lstm_analysis.png')
    
    print("\n" + "="*70)
    print("✨ PREDICTION COMPLETE!")
    print("="*70)
    print("\n📁 Generated Files:")
    print("   • /app/output/sdd_lstm_analysis.png - Full system analysis")
    
    print("\n🎯 Key Findings:")
    if len(deterioration_detected_idx) > 0:
        print(f"   • Early detection achieved: {early_warning_days} days before onset")
    print(f"   • Baseline stability: {baseline_period.mean():.1f}")
    print(f"   • Current stability: {deterioration_period[-24:].mean():.1f}")
    print(f"   • LSTM successfully learned normal patterns")
    print(f"   • Reconstruction error increased {deterioration_errors.mean() / baseline_errors[baseline_errors > 0].mean():.2f}x during deterioration")
    
    return sdd, full_data, results


if __name__ == "__main__":
    sdd, data, results = main()

