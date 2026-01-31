"""
Isolation Forest Detector
Edge-layer short-term anomaly detection using Isolation Forest.
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


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

