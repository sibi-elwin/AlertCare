"""
Wearable Data Simulator
Simulates multi-sensor wearable data with realistic deterioration patterns.
"""

import numpy as np
import pandas as pd


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

