"""
Temporal Feature Engineering
Transforms raw physiological data into stability descriptors.
"""

import pandas as pd


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

