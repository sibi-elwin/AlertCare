"""
LSTM Autoencoder
Long-term intelligence layer using LSTM Autoencoder.
Detects gradual degradation of biological structure and recovery patterns.
"""

import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau


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

