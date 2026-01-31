"""
SDD System
Complete Silent Deterioration Detector System.
Orchestrates all components with real LSTM + Isolation Forest.
"""

import matplotlib.pyplot as plt
import seaborn as sns
import sys
import os

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from features.temporal_features import TemporalFeatureEngineer
from models.isolation_forest import IsolationForestDetector
from models.lstm_autoencoder import LSTMAutoencoder
from scoring.stability_scorer import HealthStabilityScorer


class SDDSystem:
    """
    Complete Silent Deterioration Detector System.
    Orchestrates all components with real LSTM + Isolation Forest.
    """
    
    def __init__(self):
        self.feature_engineer = TemporalFeatureEngineer()
        self.isolation_detector = IsolationForestDetector()
        self.lstm_detector = LSTMAutoencoder()
        self.stability_scorer = HealthStabilityScorer()
        
    def train(self, healthy_data, lstm_epochs=50, lstm_batch_size=32, verbose=1):
        """
        Train both detection layers on healthy baseline data.
        
        Args:
            healthy_data: DataFrame with raw sensor data from healthy period
            lstm_epochs: Number of epochs for LSTM training
            lstm_batch_size: Batch size for LSTM training
            verbose: Verbosity (0=silent, 1=progress, 2=one line per epoch)
        """
        print("\n" + "="*70)
        print("SDD SYSTEM TRAINING")
        print("="*70)
        
        # Extract features
        print("\n🔧 Extracting temporal features...")
        features = self.feature_engineer.extract_features(healthy_data)
        print(f"Features extracted: {features.shape[1]} features × {features.shape[0]} time points")
        
        # Train Isolation Forest
        print("\n🌲 Training Isolation Forest (Edge Layer)...")
        self.isolation_detector.fit(features)
        print("✅ Isolation Forest trained")
        
        # Train LSTM Autoencoder
        print("\n🧠 Training LSTM Autoencoder (Long-Term Intelligence Layer)...")
        self.lstm_detector.fit(
            features,
            epochs=lstm_epochs,
            batch_size=lstm_batch_size,
            verbose=verbose
        )
        
        print("\n" + "="*70)
        print("✅ SYSTEM TRAINING COMPLETE")
        print("="*70 + "\n")
        
    def predict(self, data):
        """
        Run full prediction pipeline on data.
        
        Args:
            data: DataFrame with raw sensor data
            
        Returns:
            Dictionary with scores and features
        """
        # Extract features
        features = self.feature_engineer.extract_features(data)
        
        # Get scores from both layers
        print("🌲 Running Isolation Forest detection...")
        isolation_scores = self.isolation_detector.predict_anomaly_score(features)
        
        print("🧠 Running LSTM Autoencoder detection...")
        lstm_scores = self.lstm_detector.predict_anomaly_score(features)
        
        # Fuse into Health Stability Score
        print("⚖️  Fusing detection layers...")
        health_stability = self.stability_scorer.calculate_score(isolation_scores, lstm_scores)
        
        return {
            'isolation_scores': isolation_scores,
            'lstm_scores': lstm_scores,
            'health_stability_score': health_stability,
            'features': features,
            'reconstruction_errors': self.lstm_detector.reconstruction_errors
        }


def visualize_results(data, results, save_path='sdd_lstm_analysis.png'):
    """
    Create comprehensive visualization of SDD analysis.
    """
    fig = plt.figure(figsize=(16, 14))
    gs = fig.add_gridspec(5, 2, hspace=0.3, wspace=0.3)
    
    # Plot 1: Raw physiological signals
    ax1 = fig.add_subplot(gs[0, :])
    ax1.plot(data['timestamp'], data['blood_pressure'], label='Blood Pressure', alpha=0.7, linewidth=1.5)
    ax1.plot(data['timestamp'], data['blood_glucose'], label='Blood Glucose', alpha=0.7, linewidth=1.5)
    ax1.set_ylabel('Value', fontsize=11)
    ax1.set_title('Raw Physiological Signals', fontsize=13, fontweight='bold')
    ax1.legend(loc='upper right')
    ax1.grid(True, alpha=0.3)
    
    # Plot 2: Heart Rate & Activity
    ax2 = fig.add_subplot(gs[1, :])
    ax2_twin = ax2.twinx()
    ax2.plot(data['timestamp'], data['heart_rate'], label='Heart Rate', color='red', alpha=0.7, linewidth=1.5)
    ax2_twin.plot(data['timestamp'], data['activity'], label='Activity', color='green', alpha=0.5, linewidth=1.5)
    ax2.set_ylabel('Heart Rate (bpm)', color='red', fontsize=11)
    ax2_twin.set_ylabel('Activity Level', color='green', fontsize=11)
    ax2.set_title('Heart Rate & Activity Patterns', fontsize=13, fontweight='bold')
    ax2.grid(True, alpha=0.3)
    
    # Plot 3: Detection layer scores
    ax3 = fig.add_subplot(gs[2, :])
    ax3.plot(data['timestamp'], results['isolation_scores'], 
            label='Isolation Forest (Edge)', linewidth=2, alpha=0.8)
    ax3.plot(data['timestamp'], results['lstm_scores'], 
            label='LSTM Autoencoder (Long-Term)', linewidth=2, alpha=0.8)
    ax3.axhline(y=70, color='orange', linestyle='--', alpha=0.5, linewidth=2, label='Warning')
    ax3.axhline(y=50, color='red', linestyle='--', alpha=0.5, linewidth=2, label='Critical')
    ax3.set_ylabel('Stability Score (0-100)', fontsize=11)
    ax3.set_title('Dual-Layer Anomaly Detection Scores', fontsize=13, fontweight='bold')
    ax3.legend(loc='upper right')
    ax3.grid(True, alpha=0.3)
    
    # Plot 4: Health Stability Score (MAIN OUTPUT)
    ax4 = fig.add_subplot(gs[3, :])
    stability = results['health_stability_score']
    
    ax4.fill_between(data['timestamp'], stability, 100, alpha=0.3, color='lightgreen')
    ax4.fill_between(data['timestamp'], stability, 0, alpha=0.3, color='lightcoral')
    ax4.plot(data['timestamp'], stability, color='darkblue', linewidth=3, label='Health Stability Score')
    
    # Risk zones
    ax4.axhline(y=90, color='green', linestyle='--', alpha=0.7, linewidth=2, label='Stable')
    ax4.axhline(y=70, color='yellow', linestyle='--', alpha=0.7, linewidth=2, label='Early Instability')
    ax4.axhline(y=50, color='orange', linestyle='--', alpha=0.7, linewidth=2, label='Deterioration')
    
    ax4.set_xlabel('Time', fontsize=12)
    ax4.set_ylabel('Health Stability Score', fontsize=12)
    ax4.set_title('🎯 Health Stability Score (SDD Core Output)', fontsize=14, fontweight='bold')
    ax4.set_ylim(0, 105)
    ax4.legend(loc='upper right')
    ax4.grid(True, alpha=0.3)
    
    # Plot 5: LSTM Reconstruction Error
    ax5 = fig.add_subplot(gs[4, :])
    errors = results['reconstruction_errors']
    ax5.plot(data['timestamp'], errors, color='purple', linewidth=1.5, alpha=0.8, label='Reconstruction Error')
    ax5.axhline(y=errors[:int(len(errors)*0.6)].mean(), color='blue', linestyle='--', 
                alpha=0.5, linewidth=2, label='Baseline Mean')
    ax5.set_xlabel('Time', fontsize=12)
    ax5.set_ylabel('MSE', fontsize=11)
    ax5.set_title('LSTM Autoencoder Reconstruction Error', fontsize=13, fontweight='bold')
    ax5.legend(loc='upper right')
    ax5.grid(True, alpha=0.3)
    ax5.set_yscale('log')
    
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"\n📊 Comprehensive visualization saved: {save_path}")
    
    return fig

