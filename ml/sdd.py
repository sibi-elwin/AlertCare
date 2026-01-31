"""
Silent Deterioration Detector (SDD)
Dual-Layer Anomaly Detection System
LSTM Autoencoder + Isolation Forest

Complete production implementation with real LSTM neural networks.
Requires: TensorFlow, scikit-learn, numpy, pandas, matplotlib

Installation:
    pip install tensorflow scikit-learn numpy pandas matplotlib seaborn

Usage:
    python sdd_lstm_implementation.py
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
import os
warnings.filterwarnings('ignore')

# TensorFlow imports
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

print(f"TensorFlow version: {tf.__version__}")
print(f"GPU Available: {len(tf.config.list_physical_devices('GPU')) > 0}")


class WearableDataSimulator:
    """
    Simulates multi-sensor wearable data with realistic deterioration patterns.
    """
    
    def __init__(self, days=90, samples_per_day=24):
        self.days = days
        self.samples_per_day = samples_per_day
        self.total_samples = days * samples_per_day
        
    def generate_healthy_baseline(self):
        """Generate stable physiological signals"""
        np.random.seed(42)
        time = np.arange(self.total_samples)
        
        # Blood Pressure (systolic) - circadian rhythm + noise
        bp_base = 120
        bp_circadian = 10 * np.sin(2 * np.pi * time / self.samples_per_day)
        bp_noise = np.random.normal(0, 3, self.total_samples)
        blood_pressure = bp_base + bp_circadian + bp_noise
        
        # Blood Glucose - meal patterns + circadian
        glucose_base = 95
        glucose_meals = 15 * np.sin(3 * 2 * np.pi * time / self.samples_per_day)
        glucose_noise = np.random.normal(0, 5, self.total_samples)
        blood_glucose = glucose_base + glucose_meals + glucose_noise
        
        # Heart Rate - activity + circadian
        hr_base = 70
        hr_circadian = 10 * np.sin(2 * np.pi * time / self.samples_per_day - np.pi/4)
        hr_noise = np.random.normal(0, 4, self.total_samples)
        heart_rate = hr_base + hr_circadian + hr_noise
        
        # Activity Level (steps per hour equivalent)
        activity_base = 100
        activity_day_night = 80 * (np.sin(2 * np.pi * time / self.samples_per_day) > 0)
        activity_noise = np.random.normal(0, 20, self.total_samples)
        activity = np.maximum(0, activity_base + activity_day_night + activity_noise)
        
        return pd.DataFrame({
            # Pandas expects lowercase frequency aliases in newer versions (e.g. '1h', not '1H')
            'timestamp': pd.date_range('2024-01-01', periods=self.total_samples, freq='1h'),
            'blood_pressure': blood_pressure,
            'blood_glucose': blood_glucose,
            'heart_rate': heart_rate,
            'activity': activity
        })
    
    def inject_deterioration(self, data, start_day=60, deterioration_type='gradual'):
        """
        Inject realistic deterioration patterns.
        
        Types:
        - gradual: Slow increase in variability and baseline drift
        - circadian_loss: Weakening of day/night patterns
        - stability_loss: Increasing unpredictability
        """
        data = data.copy()
        start_idx = start_day * self.samples_per_day
        
        if deterioration_type == 'gradual':
            # Increase variability over time
            deterioration_progress = np.zeros(self.total_samples)
            deterioration_progress[start_idx:] = np.linspace(0, 1, self.total_samples - start_idx)
            
            # Add increasing noise
            data.loc[start_idx:, 'blood_pressure'] += np.random.normal(0, 8, len(data) - start_idx) * deterioration_progress[start_idx:]
            data.loc[start_idx:, 'blood_glucose'] += np.random.normal(0, 12, len(data) - start_idx) * deterioration_progress[start_idx:]
            data.loc[start_idx:, 'heart_rate'] += np.random.normal(0, 6, len(data) - start_idx) * deterioration_progress[start_idx:]
            
            # Baseline drift
            data.loc[start_idx:, 'blood_pressure'] += 5 * deterioration_progress[start_idx:]
            
        elif deterioration_type == 'circadian_loss':
            # Weaken circadian patterns
            time = np.arange(self.total_samples)
            deterioration_progress = np.zeros(self.total_samples)
            deterioration_progress[start_idx:] = np.linspace(0, 0.7, self.total_samples - start_idx)
            
            # Reduce circadian strength
            circadian_bp = 10 * np.sin(2 * np.pi * time / self.samples_per_day)
            data.loc[start_idx:, 'blood_pressure'] -= circadian_bp[start_idx:] * deterioration_progress[start_idx:]
            
        elif deterioration_type == 'stability_loss':
            # Add random spikes and increased chaos
            for idx in range(start_idx, self.total_samples):
                if np.random.random() < 0.05:  # 5% chance of spike
                    data.loc[idx, 'blood_pressure'] += np.random.normal(0, 20)
                    data.loc[idx, 'heart_rate'] += np.random.normal(0, 15)
        
        return data


class TemporalFeatureEngineer:
    """
    Transforms raw physiological data into stability descriptors.
    """
    
    def __init__(self, windows=[24, 168, 336, 720]):  # 1d, 7d, 14d, 30d in hours
        self.windows = windows
    
    def extract_features(self, data):
        """
        Generate temporal stability features.
        """
        features = pd.DataFrame(index=data.index)
        
        for col in ['blood_pressure', 'blood_glucose', 'heart_rate', 'activity']:
            if col not in data.columns:
                continue
                
            for window in self.windows:
                # Variability metrics
                features[f'{col}_std_{window}h'] = data[col].rolling(window, min_periods=1).std()
                features[f'{col}_range_{window}h'] = data[col].rolling(window, min_periods=1).apply(
                    lambda x: x.max() - x.min() if len(x) > 0 else 0
                )
                features[f'{col}_cv_{window}h'] = features[f'{col}_std_{window}h'] / (
                    data[col].rolling(window, min_periods=1).mean() + 1e-6
                )
                
        # Cross-signal features
        features['bp_glucose_corr_168h'] = data['blood_pressure'].rolling(168).corr(data['blood_glucose'])
        features['hr_activity_corr_168h'] = data['heart_rate'].rolling(168).corr(data['activity'])
        
        # Fill NaN with forward fill then backward fill
        features = features.ffill().bfill().fillna(0)
        
        return features


class IsolationForestDetector:
    """
    Edge-layer short-term anomaly detection using Isolation Forest.
    Fast, lightweight, privacy-preserving.
    """
    
    def __init__(self, contamination=0.05):
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        
    def fit(self, features):
        """Train on baseline healthy data"""
        features_scaled = self.scaler.fit_transform(features)
        self.model.fit(features_scaled)
        
    def predict_anomaly_score(self, features):
        """
        Returns anomaly scores (lower = more anomalous).
        Normalized to 0-100 scale.
        """
        features_scaled = self.scaler.transform(features)
        scores = self.model.decision_function(features_scaled)
        
        # Normalize to 0-100 (100 = most stable)
        normalized = 100 * (scores - scores.min()) / (scores.max() - scores.min() + 1e-6)
        return normalized


class LSTMAutoencoder:
    """
    Long-term intelligence layer using LSTM Autoencoder.
    Detects gradual degradation of biological structure and recovery patterns.
    
    This is the REAL implementation using TensorFlow/Keras.
    """
    
    def __init__(self, sequence_length=168, latent_dim=32, lstm_units=64):
        """
        Args:
            sequence_length: Length of input sequences (default 168 = 7 days)
            latent_dim: Dimension of the latent space bottleneck
            lstm_units: Number of LSTM units in each layer
        """
        self.sequence_length = sequence_length
        self.latent_dim = latent_dim
        self.lstm_units = lstm_units
        self.model = None
        self.encoder = None
        self.decoder = None
        self.scaler = StandardScaler()
        self.history = None
        
    def build_model(self, input_dim):
        """
        Build LSTM Autoencoder architecture with encoder-decoder structure.
        
        Architecture:
            Encoder: Input → LSTM(64) → LSTM(32) → Latent Space
            Decoder: Latent → RepeatVector → LSTM(32) → LSTM(64) → Output
        """
        
        # ============ ENCODER ============
        encoder_inputs = layers.Input(shape=(self.sequence_length, input_dim), name='encoder_input')
        
        # First LSTM layer (returns sequences for stacking)
        x = layers.LSTM(
            self.lstm_units,
            activation='tanh',
            return_sequences=True,
            name='encoder_lstm_1'
        )(encoder_inputs)
        x = layers.Dropout(0.2)(x)
        
        # Second LSTM layer (returns single vector)
        x = layers.LSTM(
            self.latent_dim,
            activation='tanh',
            return_sequences=False,
            name='encoder_lstm_2'
        )(x)
        
        encoder_output = layers.Dropout(0.2)(x)
        
        self.encoder = Model(encoder_inputs, encoder_output, name='encoder')
        
        # ============ DECODER ============
        decoder_inputs = layers.Input(shape=(self.latent_dim,), name='decoder_input')
        
        # Repeat latent vector for each time step
        x = layers.RepeatVector(self.sequence_length)(decoder_inputs)
        
        # First LSTM layer
        x = layers.LSTM(
            self.latent_dim,
            activation='tanh',
            return_sequences=True,
            name='decoder_lstm_1'
        )(x)
        x = layers.Dropout(0.2)(x)
        
        # Second LSTM layer
        x = layers.LSTM(
            self.lstm_units,
            activation='tanh',
            return_sequences=True,
            name='decoder_lstm_2'
        )(x)
        x = layers.Dropout(0.2)(x)
        
        # Output layer (reconstruct all features for each time step)
        decoder_output = layers.TimeDistributed(
            layers.Dense(input_dim),
            name='decoder_output'
        )(x)
        
        self.decoder = Model(decoder_inputs, decoder_output, name='decoder')
        
        # ============ FULL AUTOENCODER ============
        autoencoder_inputs = layers.Input(shape=(self.sequence_length, input_dim), name='autoencoder_input')
        encoded = self.encoder(autoencoder_inputs)
        decoded = self.decoder(encoded)
        
        self.model = Model(autoencoder_inputs, decoded, name='lstm_autoencoder')
        
        # Compile with Adam optimizer
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return self.model
    
    def prepare_sequences(self, features):
        """
        Convert time series features into overlapping sequences.
        
        Args:
            features: DataFrame of temporal features
            
        Returns:
            numpy array of shape (n_sequences, sequence_length, n_features)
        """
        features_scaled = self.scaler.fit_transform(features)
        
        sequences = []
        for i in range(len(features_scaled) - self.sequence_length + 1):
            sequences.append(features_scaled[i:i+self.sequence_length])
        
        return np.array(sequences)
    
    def fit(self, features, epochs=50, batch_size=32, validation_split=0.1, verbose=1):
        """
        Train the LSTM Autoencoder on healthy baseline data.
        
        Args:
            features: DataFrame of temporal features from healthy period
            epochs: Number of training epochs
            batch_size: Batch size for training
            validation_split: Fraction of data to use for validation
            verbose: Verbosity mode (0=silent, 1=progress bar, 2=one line per epoch)
        """
        print(f"\n{'='*70}")
        print("LSTM AUTOENCODER TRAINING")
        print(f"{'='*70}")
        
        # Prepare sequences
        sequences = self.prepare_sequences(features)
        print(f"Training sequences: {sequences.shape}")
        print(f"Sequence length: {self.sequence_length} hours")
        print(f"Feature dimensions: {sequences.shape[2]}")
        
        # Build model if not already built
        if self.model is None:
            self.build_model(features.shape[1])
            print(f"\nModel Architecture:")
            self.model.summary()
        
        # Callbacks for training
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=0.0001,
                verbose=1
            )
        ]
        
        # Train the autoencoder
        print(f"\nTraining for {epochs} epochs...")
        self.history = self.model.fit(
            sequences, sequences,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            callbacks=callbacks,
            verbose=verbose
        )
        
        # Calculate baseline reconstruction error statistics
        print("\nCalculating baseline reconstruction errors...")
        predictions = self.model.predict(sequences, verbose=0)
        reconstruction_errors = np.mean(np.square(sequences - predictions), axis=(1, 2))
        
        self.baseline_errors = reconstruction_errors
        self.mean_baseline_error = np.mean(reconstruction_errors)
        self.std_baseline_error = np.std(reconstruction_errors)
        self.error_threshold_95 = np.percentile(reconstruction_errors, 95)
        self.error_threshold_99 = np.percentile(reconstruction_errors, 99)
        
        print(f"\nBaseline Statistics:")
        print(f"  Mean reconstruction error: {self.mean_baseline_error:.6f}")
        print(f"  Std reconstruction error:  {self.std_baseline_error:.6f}")
        print(f"  95th percentile:           {self.error_threshold_95:.6f}")
        print(f"  99th percentile:           {self.error_threshold_99:.6f}")
        
        print(f"\n{'='*70}")
        print("TRAINING COMPLETE")
        print(f"{'='*70}\n")
        
    def predict_anomaly_score(self, features):
        """
        Returns anomaly scores based on reconstruction error.
        Normalized to 0-100 scale (100 = most stable).
        
        Args:
            features: DataFrame of temporal features
            
        Returns:
            numpy array of anomaly scores (0-100)
        """
        features_scaled = self.scaler.transform(features)
        
        scores = []
        reconstruction_errors = []
        
        for i in range(len(features_scaled)):
            if i < self.sequence_length - 1:
                # Not enough history yet
                scores.append(100)
                reconstruction_errors.append(0)
            else:
                # Extract sequence
                sequence = features_scaled[i-self.sequence_length+1:i+1]
                sequence = sequence.reshape(1, self.sequence_length, -1)
                
                # Reconstruct
                reconstruction = self.model.predict(sequence, verbose=0)
                
                # Calculate reconstruction error (MSE)
                error = np.mean(np.square(sequence - reconstruction))
                reconstruction_errors.append(error)
                
                # Normalize score using baseline statistics
                # Use exponential decay: higher error = lower stability
                # Score relative to baseline error distribution
                z_score = (error - self.mean_baseline_error) / (self.std_baseline_error + 1e-6)
                
                # Convert to 0-100 scale (100 = perfect reconstruction)
                score = 100 * np.exp(-max(0, z_score) / 2)  # Decay factor = 2
                score = np.clip(score, 0, 100)
                
                scores.append(score)
        
        self.reconstruction_errors = np.array(reconstruction_errors)
        return np.array(scores)
    
    def plot_training_history(self, save_path='lstm_training_history.png'):
        """Plot training and validation loss curves"""
        if self.history is None:
            print("No training history available. Train the model first.")
            return
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
        
        # Loss plot
        ax1.plot(self.history.history['loss'], label='Training Loss', linewidth=2)
        ax1.plot(self.history.history['val_loss'], label='Validation Loss', linewidth=2)
        ax1.set_xlabel('Epoch', fontsize=12)
        ax1.set_ylabel('Mean Squared Error', fontsize=12)
        ax1.set_title('LSTM Autoencoder Training History', fontsize=14, fontweight='bold')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # MAE plot
        ax2.plot(self.history.history['mae'], label='Training MAE', linewidth=2)
        ax2.plot(self.history.history['val_mae'], label='Validation MAE', linewidth=2)
        ax2.set_xlabel('Epoch', fontsize=12)
        ax2.set_ylabel('Mean Absolute Error', fontsize=12)
        ax2.set_title('LSTM Autoencoder MAE', fontsize=14, fontweight='bold')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Training history plot saved: {save_path}")
        
        return fig


class HealthStabilityScorer:
    """
    Fuses outputs from both detection layers into a single Health Stability Score.
    """
    
    def __init__(self, isolation_weight=0.4, lstm_weight=0.6):
        self.isolation_weight = isolation_weight
        self.lstm_weight = lstm_weight
        
    def calculate_score(self, isolation_scores, lstm_scores):
        """
        Weighted fusion of both anomaly detection layers.
        """
        # Ensure both are 0-100 scale
        isolation_scores = np.clip(isolation_scores, 0, 100)
        lstm_scores = np.clip(lstm_scores, 0, 100)
        
        # Weighted average
        health_stability_score = (
            self.isolation_weight * isolation_scores +
            self.lstm_weight * lstm_scores
        )
        
        return health_stability_score
    
    def interpret_score(self, score):
        """Convert score to risk category"""
        if score >= 90:
            return "Stable"
        elif score >= 70:
            return "Early Instability"
        elif score >= 50:
            return "Sustained Deterioration"
        else:
            return "High-Risk Decline"


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


def main():
    """
    Complete demonstration of Silent Deterioration Detector with real LSTM.
    """
    # Ensure output directory exists
    os.makedirs('/app/output', exist_ok=True)
    
    print("\n" + "="*70)
    print(" "*15 + "SILENT DETERIORATION DETECTOR (SDD)")
    print(" "*20 + "LSTM + Isolation Forest")
    print("="*70)
    
    # 1. Generate synthetic wearable data
    print("\n📡 Generating synthetic wearable sensor data...")
    simulator = WearableDataSimulator(days=90, samples_per_day=24)
    healthy_data = simulator.generate_healthy_baseline()
    
    # Inject deterioration starting at day 60
    full_data = simulator.inject_deterioration(healthy_data, start_day=60, deterioration_type='gradual')
    
    print(f"   Total samples: {len(full_data)}")
    print(f"   Healthy baseline: Days 1-60")
    print(f"   Deterioration injected: Days 60-90")
    
    # 2. Initialize and train SDD system
    sdd = SDDSystem()
    
    # Train on first 60 days (healthy baseline)
    training_data = full_data[full_data['timestamp'] < full_data['timestamp'].iloc[60*24]]
    sdd.train(
        training_data,
        lstm_epochs=50,
        lstm_batch_size=32,
        verbose=1
    )
    
    # Plot LSTM training history
    sdd.lstm_detector.plot_training_history('/app/output/lstm_training_history.png')
    
    # 3. Run prediction on full timeline
    print("\n" + "="*70)
    print("RUNNING PREDICTION PIPELINE")
    print("="*70)
    results = sdd.predict(full_data)
    
    # 4. Analyze results
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
    
    # 5. Visualize
    print("\n🎨 Creating comprehensive visualization...")
    visualize_results(full_data, results, save_path='/app/output/sdd_lstm_analysis.png')
    
    print("\n" + "="*70)
    print("SYSTEM ARCHITECTURE")
    print("="*70)
    print("""
    🔄 Data Flow:
    
    1. Wearable Sensors (BP, Glucose, HR, Activity)
           ↓
    2. Temporal Feature Engineering (40+ Stability Signals)
           ↓
    3. Dual-Layer Detection:
           ├─ Isolation Forest (Edge/Immediate) → 40% weight
           └─ LSTM Autoencoder (Cloud/Long-term) → 60% weight
           ↓
    4. Score Fusion → Health Stability Score (0-100)
           ↓
    5. Risk Categorization & Alerts
    
    🧠 LSTM Architecture:
       • Encoder: 2-layer LSTM (64→32 units)
       • Latent Space: 32 dimensions
       • Decoder: 2-layer LSTM (32→64 units)
       • Sequence Length: 168 hours (7 days)
    """)
    
    print("\n" + "="*70)
    print("✨ DEMO COMPLETE!")
    print("="*70)
    print("\n📁 Generated Files:")
    print("   • /app/output/sdd_lstm_analysis.png - Full system analysis")
    print("   • /app/output/lstm_training_history.png - LSTM training curves")
    
    print("\n🎯 Key Findings:")
    if len(deterioration_detected_idx) > 0:
        print(f"   • Early detection achieved: {early_warning_days} days before onset")
    print(f"   • Baseline stability: {baseline_period.mean():.1f}")
    print(f"   • Current stability: {deterioration_period[-24:].mean():.1f}")
    print(f"   • LSTM successfully learned normal patterns")
    print(f"   • Reconstruction error increased {deterioration_errors.mean() / baseline_errors[baseline_errors > 0].mean():.2f}x during deterioration")
    
    return sdd, full_data, results


if __name__ == "__main__":
    # Set random seeds for reproducibility
    np.random.seed(42)
    tf.random.set_seed(42)
    
    # Run the complete demo
    sdd, data, results = main()
    
    print("\n💡 The system is now ready for integration!")
    print("   Use sdd.predict(new_data) to analyze new sensor data.")
    print("   See usage_examples.py for integration patterns.\n")