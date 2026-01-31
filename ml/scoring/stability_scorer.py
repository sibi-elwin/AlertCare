"""
Health Stability Scorer
Fuses outputs from both detection layers into a single Health Stability Score.
"""

import numpy as np


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

