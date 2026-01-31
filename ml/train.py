"""
Training script for SDD System
Trains the Silent Deterioration Detector on healthy baseline data.
"""

import os
import sys
import numpy as np
import tensorflow as tf
import pickle

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data.simulator import WearableDataSimulator
from system.sdd_system import SDDSystem


# =========================
# Model paths (STRICT RULE)
# =========================
# IMPORTANT:
# - `/app/models` is used for Python source package `models/`
# - Persisted ML artifacts MUST live in a DIFFERENT directory
#   to avoid shadowing the code with a Docker volume.
# - We use `/app/model_store` for all saved artifacts.
MODEL_ROOT = os.getenv("ML_MODEL_PATH", "/app/model_store")

ISO_PATH  = f"{MODEL_ROOT}/isolation_forest"
LSTM_PATH = f"{MODEL_ROOT}/lstm_autoencoder"

os.makedirs(ISO_PATH, exist_ok=True)
os.makedirs(LSTM_PATH, exist_ok=True)


def main():
    """
    Train SDD system on synthetic healthy baseline data.
    """

    # Output directory (plots only)
    os.makedirs("/app/output", exist_ok=True)

    # Reproducibility
    np.random.seed(42)
    tf.random.set_seed(42)

    print("\n" + "=" * 70)
    print(" " * 15 + "SDD SYSTEM TRAINING")
    print("=" * 70)

    # =========================
    # Generate healthy baseline
    # =========================
    print("\n📡 Generating synthetic wearable sensor data...")
    simulator = WearableDataSimulator(days=90, samples_per_day=24)
    healthy_data = simulator.generate_healthy_baseline()

    print(f"   Total samples: {len(healthy_data)}")
    print("   Healthy baseline only")

    # =========================
    # Train SDD system
    # =========================
    sdd = SDDSystem()

    sdd.train(
        healthy_data,
        lstm_epochs=50,
        lstm_batch_size=32,
        verbose=1
    )

    # =========================
    # Save Isolation Forest
    # =========================
    print("\n💾 Saving Isolation Forest artifacts...")
    with open(f"{ISO_PATH}/model.pkl", "wb") as f:
        pickle.dump(sdd.isolation_detector.model, f)

    with open(f"{ISO_PATH}/scaler.pkl", "wb") as f:
        pickle.dump(sdd.isolation_detector.scaler, f)

    # =========================
    # Save LSTM Autoencoder
    # =========================
    print("\n💾 Saving LSTM Autoencoder artifacts...")

    # Keras model (use .keras extension as required by TF/Keras 3)
    sdd.lstm_detector.model.save(f"{LSTM_PATH}/model.keras")

    # Scaler
    with open(f"{LSTM_PATH}/scaler.pkl", "wb") as f:
        pickle.dump(sdd.lstm_detector.scaler, f)

    # Baseline statistics
    stats = {
        "mean_baseline_error": sdd.lstm_detector.mean_baseline_error,
        "std_baseline_error": sdd.lstm_detector.std_baseline_error,
        "threshold_95": sdd.lstm_detector.error_threshold_95,
        "threshold_99": sdd.lstm_detector.error_threshold_99,
        "sequence_length": sdd.lstm_detector.sequence_length,
    }

    with open(f"{LSTM_PATH}/stats.pkl", "wb") as f:
        pickle.dump(stats, f)

    # =========================
    # Training history plot
    # =========================
    sdd.lstm_detector.plot_training_history(
        "/app/output/lstm_training_history.png"
    )

    print("\n" + "=" * 70)
    print("✨ TRAINING COMPLETE!")
    print("=" * 70)
    print("\n📁 Saved model artifacts:")
    print(f"   • {ISO_PATH}/model.pkl")
    print(f"   • {ISO_PATH}/scaler.pkl")
    print(f"   • {LSTM_PATH}/model/")
    print(f"   • {LSTM_PATH}/scaler.pkl")
    print(f"   • {LSTM_PATH}/stats.pkl")
    print("\n💡 The system is now ready for inference.\n")


if __name__ == "__main__":
    main()
