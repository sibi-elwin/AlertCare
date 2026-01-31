"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CaretakerHeader } from "@/components/caretaker/caretaker-header";
import { authAPI, caregiverDashboardAPI } from "@/lib/api-client";
import { VitalEntryForm } from "@/components/caretaker/vital-entry-form";
import { EntryLog } from "@/components/caretaker/entry-log";
import { PhoneRegistration } from "@/components/caretaker/phone-registration";
import { SMSSettings } from "@/components/caretaker/sms-settings";
import { AlertsView } from "@/components/caretaker/alerts-view";
import { HealthConnectIntegration } from "@/components/caretaker/health-connect-integration";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { getCaregiverPatients, seedDemoData } from "@/lib/patient-data";
import { calculateStabilityIndex, calculateNEWS2 } from "@/lib/healthcare-data";
import { routeAlert, determineAlertSeverity } from "@/lib/alert-routing";
import { getPhoneNumber, schedulePeriodicSMS } from "@/lib/sms-service";
import { sensorReadingsAPI } from "@/lib/api-client";

export default function CaretakerPortal() {
  const router = useRouter();
  const [caregiverId, setCaregiverId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [entryLog, setEntryLog] = useState([]);
  const [phoneRegistered, setPhoneRegistered] = useState(false);
  const [previousStabilityIndex, setPreviousStabilityIndex] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [wearableVitals, setWearableVitals] = useState(null);

  // Check authentication and get caregiverId
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.push('/caretaker/auth');
      return;
    }

    const user = authAPI.getCurrentUser();
    if (!user || user.role !== 'CAREGIVER') {
      router.push('/caretaker/auth');
      return;
    }

    // Get caregiverId from user profile
    const idFromProfile = user.profile?.id;
    if (!idFromProfile) {
      // If no caregiverId, user needs to sign in again to get profile data
      // Clear auth and redirect to prevent loop
      authAPI.signout();
      router.push('/caretaker/auth');
      return;
    }

    setCaregiverId(idFromProfile);
  }, [router]);

  // Load patients assigned to this caregiver
  useEffect(() => {
    if (!caregiverId) return;

    loadPatients();
    
    // Refresh patient list every 30 seconds to catch new assignments
    const interval = setInterval(() => {
      loadPatients();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [caregiverId]);

  const loadPatients = async () => {
    if (!caregiverId) return;

    try {
      // Load patients from backend API
      const response = await caregiverDashboardAPI.getPatients(caregiverId);
      
      if (response.success && response.data) {
        const assignedPatients = response.data.patients || [];
        
        // Transform backend data to match frontend expectations
        const transformedPatients = assignedPatients.map(patient => ({
          id: patient.id,
          name: patient.name,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email || null,
          phone: patient.phone || null,
          age: patient.age || null,
          condition: 'General Care', // Default condition - can be enhanced later
          entryLog: [], // Entry log is managed locally
          latestPrediction: patient.currentScore || null,
          lastSynced: patient.lastSynced || null,
          trend: patient.currentScore?.trend || 'stable',
          stabilityIndex: patient.currentScore?.healthStabilityScore || 85,
          news2Score: 0, // Will be calculated from vitals
        }));
        
        setPatients(transformedPatients);
        
        // Don't auto-select first patient - let user click to view details
      }
    } catch (error) {
      console.error('Error loading caregiver patients:', error);
      // Fallback to mock data on error
      seedDemoData();
      const assignedPatients = getCaregiverPatients(caregiverId);
      setPatients(assignedPatients);
      if (assignedPatients.length > 0 && !currentPatient) {
        setCurrentPatient(assignedPatients[0]);
        setEntryLog(assignedPatients[0].entryLog || []);
      }
    }
  };

  // Load patient details when a patient is selected
  const loadPatientDetails = async (patient) => {
    if (!caregiverId || !patient) return;

    setLoadingDetails(true);
    
    try {
      const response = await caregiverDashboardAPI.getPatientDetails(caregiverId, patient.id);
      
      if (response.success && response.data) {
        const details = response.data;
        setPatientDetails(details);
        setCurrentPatient(patient);
        
        // Load recent sensor readings as entry log
        if (details.recentReadings) {
          const logEntries = details.recentReadings.slice(0, 5).map(reading => ({
            id: reading.id,
            timestamp: reading.timestamp,
            synced: true,
            vitals: {
              heartRate: reading.heartRate,
              systolicBP: reading.bloodPressure,
              glucose: reading.bloodGlucose,
              activity: reading.activity,
            },
          }));
          setEntryLog(logEntries);
        } else {
          setEntryLog([]);
        }
      }
    } catch (error) {
      console.error('Error loading patient details:', error);
      // Still set current patient even if details fail
      setCurrentPatient(patient);
      setEntryLog([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Check if phone is registered
  useEffect(() => {
    if (currentPatient) {
      const phoneData = getPhoneNumber(currentPatient.id);
      setPhoneRegistered(!!phoneData);
    }
  }, [currentPatient]);

  const handleVitalSubmit = async (vitals) => {
    if (!currentPatient) return;

    const newEntry = {
      id: `${currentPatient.id}-log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      synced: false,
      vitals,
    };

    setEntryLog([newEntry, ...entryLog.slice(0, 4)]);

    // Calculate simplified scores for local display only
    // Note: The actual ML prediction will be done by the backend using the ML model
    // NEWS2 calculation requires fields not in ML model (spo2, temperature, respiratoryRate)
    // So we use simplified scoring for local display - actual scores come from backend ML prediction
    const news2Score = 0; // Not calculated (requires fields not in ML model)
    // Simplified scores for local display (actual ML scores come from backend)
    const isolationForestScore = vitals.heartRate < 100 ? 75 : 35;
    const lstmScore = vitals.heartRate < 100 ? 80 : 40;
    const stabilityIndex = calculateStabilityIndex(isolationForestScore, lstmScore, news2Score);

    // Attempt to submit to backend API
    // Map caretaker form fields to backend sensor reading format
    // Backend expects: bloodPressure, bloodGlucose, heartRate, activity
    try {
      // Get patient's userId from localStorage or use patientId directly
      // Note: The backend expects patientId to be the Patient.id (UUID), not the mock patient id
      // For now, we'll attempt the API call but it may fail if the patientId format doesn't match
      // Only send ML-required fields to backend
      const readingData = {
        patientId: currentPatient.id,
        bloodPressure: vitals.systolicBP || null, // Map systolicBP to bloodPressure
        bloodGlucose: vitals.glucose || null,
        heartRate: vitals.heartRate || null,
        activity: vitals.activity || null, // Activity level (steps/hour equivalent)
        autoPredict: true, // Auto-trigger ML prediction
      };

      await sensorReadingsAPI.create(readingData);
      console.log('Vitals submitted to backend API successfully');
      
      // Reload patients to get updated data after a short delay
      setTimeout(() => {
        loadPatients();
      }, 1000);
    } catch (error) {
      // API endpoint may not exist yet, or patientId format may not match
      // Continue with local processing - this is expected if routes aren't implemented
      console.warn('Backend API submission failed (this is expected if routes are not implemented):', error.message);
    }

    // Simulate sync after short delay
    setTimeout(async () => {
      setEntryLog((prev) =>
        prev.map((entry) =>
          entry.id === newEntry.id ? { ...entry, synced: true } : entry
        )
      );
      
      // Sync status removed - no longer displaying System Optimized card

      // Determine alert severity and route accordingly
      const severity = determineAlertSeverity(stabilityIndex, news2Score, previousStabilityIndex);
      
      // Route alert based on severity (small → caregiver, major → doctor, critical → hospital)
      if (severity !== 'normal') {
        await routeAlert(currentPatient.id, severity, vitals, stabilityIndex, news2Score);
      }

      // Update previous stability index
      setPreviousStabilityIndex(stabilityIndex);

      // Trigger SMS notification if phone is registered
      if (phoneRegistered) {
        const updatedPatient = {
          ...currentPatient,
          vitals,
          news2Score,
          stabilityIndex,
        };
        schedulePeriodicSMS(updatedPatient, vitals).catch(err => {
          console.error('SMS notification error:', err);
        });
      }
    }, 1500);
  };

  const handlePhoneRegistered = () => {
    setPhoneRegistered(true);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <CaretakerHeader patient={currentPatient} />

      <main className="px-8 pt-8 max-w-7xl mx-auto space-y-6">
        {patients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No patients assigned to you yet. Please wait for a doctor to assign you a patient.
              </p>
            </CardContent>
          </Card>
        ) : !currentPatient ? (
          <>
            {/* Patient List - Show all patients */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">My Patients</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patients.map((patient) => {
                    const isCritical = patient.currentScore?.riskCategory === 'High-Risk Decline' || 
                                      (patient.currentScore?.healthStabilityScore && patient.currentScore.healthStabilityScore < 50);
                    
                    return (
                      <Card
                        key={patient.id}
                        className={`hover:border-indigo-300 cursor-pointer transition-colors ${
                          isCritical ? 'border-rose-300 bg-rose-50/50' : ''
                        }`}
                        onClick={() => loadPatientDetails(patient)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-base font-semibold text-foreground">
                                  {patient.name}
                                </h3>
                                {isCritical && (
                                  <Badge variant="destructive" className="text-xs">
                                    Critical
                                  </Badge>
                                )}
                                {patient.currentScore?.riskCategory && patient.currentScore.riskCategory !== 'Stable' && (
                                  <Badge variant="outline" className="text-xs">
                                    {patient.currentScore.riskCategory}
                                  </Badge>
                                )}
                              </div>
                              {patient.currentScore && (
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                  <span>Health Score: {patient.currentScore.healthStabilityScore?.toFixed(1) || 'N/A'}</span>
                                  {patient.lastSynced && (
                                    <span className="text-xs">
                                      Last sync: {new Date(patient.lastSynced).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Alerts View */}
            <AlertsView caregiverId={caregiverId} />
          </>
        ) : (
          <>
            {/* Patient Details View - Show when patient is selected */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-semibold truncate">{currentPatient.name}</h2>
                      {patientDetails?.currentScore && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Health Score: {patientDetails.currentScore.healthStabilityScore?.toFixed(1) || 'N/A'} · 
                          Risk: {patientDetails.currentScore.riskCategory || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => {
                      setCurrentPatient(null);
                      setPatientDetails(null);
                      setEntryLog([]);
                    }}
                  >
                    Back to List
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loadingDetails ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Loading patient details...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Actions */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Alerts View */}
                  <AlertsView caregiverId={caregiverId} />

                  {/* Health Connect Integration */}
                  {currentPatient && (
                    <HealthConnectIntegration
                      patientId={currentPatient.id}
                      onVitalsReceived={(vitals) => {
                        setWearableVitals(vitals);
                      }}
                    />
                  )}

                  {/* Vital Entry Form */}
                  <VitalEntryForm 
                    onSubmit={handleVitalSubmit} 
                    wearableVitals={wearableVitals}
                    patientId={currentPatient?.id}
                  />

                  {/* Historical Log */}
                  <EntryLog entries={entryLog} />
                </div>

                {/* Right Column - Settings */}
                <div className="space-y-6">
                  {/* Phone Registration (if not registered) */}
                  {!phoneRegistered && currentPatient && (
                    <PhoneRegistration
                      patient={currentPatient}
                      onRegistered={handlePhoneRegistered}
                    />
                  )}

                  {/* SMS Settings (if registered) */}
                  {phoneRegistered && currentPatient && <SMSSettings patient={currentPatient} />}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
