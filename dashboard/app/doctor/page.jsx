"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Users, UserPlus, CheckCircle2, X, Ambulance, Activity, TrendingDown, AlertTriangle, RefreshCw, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPendingConsultations,
  respondToConsultation,
  getDoctorPatients,
  mockDoctors,
  seedDemoData,
  reloadFromStorage,
} from "@/lib/patient-data";
import { getDoctorAlerts, escalateToHospital } from "@/lib/alert-routing";
import { authAPI, doctorAPI, doctorDashboardAPI } from "@/lib/api-client";
import { DoctorHeader } from "@/components/doctor/doctor-header";
import { PatientDetailPanel } from "@/components/doctor/patient-detail-panel";
import { DispatchDialog } from "@/components/doctor/dispatch-dialog";
import { SendMessageDialog } from "@/components/doctor/send-message-dialog";
import { mockPatients } from "@/lib/healthcare-data";

export default function DoctorDashboard() {
  const router = useRouter();
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [pendingConsultations, setPendingConsultations] = useState([]);
  const [myPatients, setMyPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [assigningCaregiver, setAssigningCaregiver] = useState(null);
  const [availableCaregivers, setAvailableCaregivers] = useState([]);
  const [loadingCaregivers, setLoadingCaregivers] = useState(false);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageDialogPatient, setMessageDialogPatient] = useState(null);
  const [removedPatientIds, setRemovedPatientIds] = useState(new Set()); // Track removed patients
  const [stats, setStats] = useState({
    totalPatients: 0,
    criticalPatients: 0,
    pendingConsultations: 0,
    activeAlerts: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      if (!authAPI.isAuthenticated()) {
        router.push("/doctor/auth");
        return;
      }

      const user = authAPI.getCurrentUser();
      if (!user || user.role !== 'DOCTOR') {
        router.push("/doctor/auth");
        return;
      }

      // Get doctorId from user profile
      let doctorId = user.profile?.id;
      
      // If profile is missing, fetch it from backend
      if (!doctorId && user.id) {
        try {
          const response = await doctorAPI.getProfileByUserId(user.id);
          if (response.success && response.data?.id) {
            doctorId = response.data.id;
            // Update stored user with profile
            const updatedUser = { ...user, profile: response.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Error fetching doctor profile:', error);
        }
      }
      
      if (!doctorId) {
        // If no doctorId, user needs to sign in again to get profile data
        authAPI.signout();
        router.push("/doctor/auth");
        return;
      }

      // Set current doctor from profile
      setCurrentDoctor({
        doctorId: doctorId,
        name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Doctor',
        ...user.profile,
      });
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!currentDoctor) return;
    
    // Seed demo data for presentation
    seedDemoData();
    
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentDoctor]);

  const loadData = async () => {
    if (!currentDoctor) return;
    
    const doctorId = currentDoctor.doctorId;
    
    try {
      // Load patients from backend API
      const patientsResponse = await doctorDashboardAPI.getPatients(doctorId);
      
      if (patientsResponse.success && patientsResponse.data) {
        const patients = patientsResponse.data.patients || [];
        // Filter out removed patients
        const filteredPatients = patients.filter(p => {
          const isRemoved = removedPatientIds.has(p.id);
          if (isRemoved) {
            console.log('Filtering out removed patient:', p.id, p.name);
          }
          return !isRemoved;
        });
        setMyPatients(filteredPatients);
        
        // Calculate stats (use filtered patients)
        const critical = filteredPatients.filter(p => {
          // Check if patient has low health stability score
          return p.latestPrediction && (
            p.latestPrediction.healthStabilityScore < 40 ||
            p.latestPrediction.riskCategory === 'Critical' ||
            p.latestPrediction.riskCategory === 'High Risk'
          );
        });
        
        // Load alerts from backend
        let activeAlertsCount = 0;
        let backendAlerts = [];
        try {
          const alertsResponse = await doctorDashboardAPI.getAlerts(doctorId, {
            limit: 100,
            acknowledged: false,
          });
          if (alertsResponse.success && alertsResponse.data) {
            backendAlerts = alertsResponse.data.alerts || [];
            activeAlertsCount = backendAlerts.length;
            
            // Transform backend alerts to match frontend format
            const transformedAlerts = backendAlerts.map(alert => {
              // Determine severity from priority
              let severity = 'small';
              if (alert.priority === 'high') {
                severity = alert.message.includes('CRITICAL') ? 'critical' : 'major';
              } else if (alert.priority === 'normal') {
                severity = 'major';
              }
              
              return {
                id: alert.id,
                patientId: alert.patientId,
                severity: severity,
                timestamp: alert.createdAt,
                message: alert.message,
                priority: alert.priority,
                acknowledged: alert.acknowledged,
                // Get patient info from the alert response
                patientName: alert.patient 
                  ? `${alert.patient.firstName || ''} ${alert.patient.lastName || ''}`.trim() || 'Patient'
                  : 'Unknown Patient',
              };
            });
            
            setAlerts(transformedAlerts);
          }
        } catch (error) {
          console.error('Failed to load alerts:', error);
          // Fallback to empty alerts if API fails
          setAlerts([]);
        }

        setStats({
          totalPatients: filteredPatients.length,
          criticalPatients: critical.length,
          pendingConsultations: 0, // TODO: Implement pending consultations from backend
          activeAlerts: activeAlertsCount,
        });
      }
      
      // Load pending consultations (still using mock for now)
      reloadFromStorage();
      const pending = getPendingConsultations(doctorId);
      setPendingConsultations(pending);
      
      // Alerts are already loaded from backend above, don't overwrite with mock data
      
    } catch (error) {
      console.error('Error loading doctor data:', error);
      // Fallback to mock data on error
      reloadFromStorage();
      const patients = getDoctorPatients(doctorId);
      const pending = getPendingConsultations(doctorId);
      const doctorAlerts = getDoctorAlerts(doctorId, 10);
      setMyPatients(patients);
      setPendingConsultations(pending);
      setAlerts(doctorAlerts);
    }
  };

  const handleAssignCaregiver = async (patientId, caregiverId) => {
    if (!currentDoctor) return;
    
    try {
      const response = await doctorDashboardAPI.assignCaregiver(
        currentDoctor.doctorId,
        patientId,
        caregiverId
      );
      
      if (response.success) {
        setAssigningCaregiver(null);
        loadData(); // Reload data to show updated caregiver assignment
      } else {
        console.error('Failed to assign caregiver:', response.message);
        alert('Failed to assign caregiver: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error assigning caregiver:', error);
      alert('Error assigning caregiver. Please try again.');
    }
  };

  // Load available caregivers when dialog opens
  const loadAvailableCaregivers = async () => {
    if (!assigningCaregiver) return;
    
    // Check if patient already has a caregiver
    const patient = myPatients.find(p => p.id === assigningCaregiver);
    if (patient?.caregiver) {
      alert('This patient already has a caregiver assigned. Please remove the existing assignment first.');
      setAssigningCaregiver(null);
      return;
    }
    
    setLoadingCaregivers(true);
    try {
      const response = await doctorDashboardAPI.getAvailableCaregivers();
      
      if (response.success && response.data) {
        setAvailableCaregivers(response.data.caregivers || []);
      }
    } catch (error) {
      console.error('Error loading caregivers:', error);
      setAvailableCaregivers([]);
    } finally {
      setLoadingCaregivers(false);
    }
  };

  // Load caregivers when assignment dialog opens
  useEffect(() => {
    if (assigningCaregiver) {
      loadAvailableCaregivers();
    }
  }, [assigningCaregiver]);

  const handleApproveConsultation = (patientId) => {
    if (!currentDoctor) return;
    respondToConsultation(patientId, currentDoctor.doctorId, true);
    loadData();
  };

  const handleRejectConsultation = (patientId) => {
    if (!currentDoctor) return;
    respondToConsultation(patientId, currentDoctor.doctorId, false);
    loadData();
  };

  const handleDispatch = (patient) => {
    setSelectedPatient(patient);
    setDispatchDialogOpen(true);
  };

  const handleEscalateToHospital = async (patientId, reason) => {
    if (!currentDoctor) return;
    try {
      await escalateToHospital(patientId, currentDoctor.doctorId, reason);
      alert('Patient escalated to nearest hospital successfully');
      loadData();
    } catch (error) {
      alert('Failed to escalate: ' + error.message);
    }
  };

  if (!currentDoctor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const doctorInfo = mockDoctors.find(d => d.id === currentDoctor.doctorId);

  return (
    <div className="min-h-screen bg-background">
            <DoctorHeader currentDoctor={currentDoctor} />
      
      {/* Stats Dashboard */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Welcome, {currentDoctor.name}
          </h1>
          {doctorInfo && (
            <p className="text-muted-foreground">
              {doctorInfo.specialty} · {doctorInfo.experience}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalPatients}</p>
                </div>
                <Users className="w-8 h-8 text-indigo-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Patients</p>
                  <p className="text-2xl font-bold text-rose-600">{stats.criticalPatients}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-rose-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pendingConsultations}</p>
                </div>
                <Bell className="w-8 h-8 text-amber-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.activeAlerts}</p>
                </div>
                <Activity className="w-8 h-8 text-indigo-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Patient Management</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reloadFromStorage();
              loadData();
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="consultations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="consultations" className="relative">
              <Bell className="w-4 h-4 mr-2" />
              Consultation Requests
              {pendingConsultations.length > 0 && (
                <Badge className="ml-2 bg-rose-600 text-white">
                  {pendingConsultations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="patients">
              <Users className="w-4 h-4 mr-2" />
              My Patients
            </TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              Alerts
              {alerts.length > 0 && (
                <Badge className="ml-2 bg-amber-600 text-white">
                  {alerts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Consultation Requests */}
          <TabsContent value="consultations">
            <Card>
              <CardHeader>
                <CardTitle>Pending Consultation Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingConsultations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No pending consultation requests</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      New patient requests will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingConsultations.map((consultation) => {
                      const mockPatient = mockPatients.find(p => p.id === consultation.patient.id);
                      return (
                        <Card key={consultation.patientId} className="border-indigo-200 hover:border-indigo-300">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">
                                    {consultation.patient.name}
                                  </h3>
                                  {mockPatient && mockPatient.stabilityIndex < 40 && (
                                    <Badge variant="destructive" className="text-xs">
                                      Critical
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Age: {consultation.patient.age} · {consultation.patient.condition}
                                </p>
                                {mockPatient && (
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                    <span>Stability: {mockPatient.stabilityIndex}</span>
                                    <span>NEWS2: {mockPatient.news2Score}</span>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Requested: {new Date(consultation.selectedAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveConsultation(consultation.patientId)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectConsultation(consultation.patientId)}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Patients */}
          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <CardTitle>My Patients</CardTitle>
              </CardHeader>
              <CardContent>
                {myPatients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No patients assigned yet</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Approve consultation requests to see patients here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myPatients.map((patient) => {
                      const mockPatient = mockPatients.find(p => p.id === patient.id);
                      const isCritical = mockPatient && (mockPatient.stabilityIndex < 40 || mockPatient.news2Score >= 2);
                      
                      return (
                        <Card 
                          key={patient.id} 
                          className={`hover:border-indigo-300 cursor-pointer ${
                            isCritical ? 'border-rose-300 bg-rose-50/50' : ''
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">
                                    {patient.name}
                                  </h3>
                                  {isCritical && (
                                    <Badge variant="destructive" className="text-xs">
                                      Critical
                                    </Badge>
                                  )}
                                  {!patient.caregiver && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                      Needs Caregiver
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Age: {patient.age} · {patient.condition}
                                </p>
                                {mockPatient && (
                                  <div className="flex items-center gap-4 text-xs mb-2">
                                    <span className={`font-medium ${
                                      mockPatient.stabilityIndex < 40 ? 'text-rose-600' :
                                      mockPatient.stabilityIndex < 70 ? 'text-amber-600' :
                                      'text-emerald-600'
                                    }`}>
                                      Stability: {mockPatient.stabilityIndex}
                                    </span>
                                    <span className="text-muted-foreground">
                                      NEWS2: {mockPatient.news2Score}
                                    </span>
                                    {mockPatient.trend === 'down' && (
                                      <TrendingDown className="w-3 h-3 text-rose-600" />
                                    )}
                                  </div>
                                )}
                                {patient.caregiver ? (
                                  <div className="mt-2">
                                    <p className="text-xs text-muted-foreground">
                                      Caregiver: <span className="font-medium text-foreground">{patient.caregiver.name}</span>
                                    </p>
                                    {patient.caregiver.phone && (
                                      <p className="text-xs text-muted-foreground">
                                        {patient.caregiver.phone}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAssigningCaregiver(patient.id)}
                                    className="mt-2"
                                  >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Assign Caregiver
                                  </Button>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedPatient(patient)}
                                >
                                  View Details
                                </Button>
                                {mockPatient && isCritical && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDispatch(patient)}
                                  >
                                    <Ambulance className="w-3 h-3 mr-1" />
                                    Dispatch
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No alerts</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Alerts will appear here when patient vitals show deviations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => {
                      const patient = myPatients.find(p => p.id === alert.patientId);
                      return (
                        <Card
                          key={alert.id}
                          className={`border-2 cursor-pointer hover:shadow-md transition-shadow ${
                            alert.severity === 'critical'
                              ? 'border-rose-300 bg-rose-50'
                              : alert.severity === 'major'
                              ? 'border-amber-300 bg-amber-50'
                              : 'border-slate-200'
                          }`}
                          onClick={() => {
                            if (patient) setSelectedPatient(patient);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant={
                                      alert.severity === 'critical'
                                        ? 'destructive'
                                        : alert.severity === 'major'
                                        ? 'default'
                                        : 'outline'
                                    }
                                  >
                                    {alert.severity.toUpperCase()}
                                  </Badge>
                                  <span className="text-sm font-medium text-foreground">
                                    {alert.patientName || (patient ? patient.name : 'Patient Alert')}
                                  </span>
                                </div>
                                {alert.message && (
                                  <p className="text-sm text-foreground mb-2">
                                    {alert.message}
                                  </p>
                                )}
                                {alert.vitals && (
                                  <div className="text-xs text-muted-foreground mb-2 space-y-1">
                                    <p>HR: {alert.vitals.heartRate} bpm · SpO2: {alert.vitals.spo2}%</p>
                                    <p>BP: {alert.vitals.systolicBP} mmHg · Temp: {alert.vitals.temperature}°C</p>
                                  </div>
                                )}
                                {alert.stabilityIndex !== undefined && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Stability Index: {alert.stabilityIndex} · NEWS2: {alert.news2Score || 'N/A'}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {new Date(alert.timestamp).toLocaleString()}
                                </p>
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (patient) {
                                        setMessageDialogPatient(patient);
                                        setMessageDialogOpen(true);
                                      }
                                    }}
                                  >
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    Send Guidance
                                  </Button>
                                  {alert.severity === 'critical' && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (patient) handleDispatch(patient);
                                      }}
                                    >
                                      <Ambulance className="w-3 h-3 mr-1" />
                                      Dispatch to Hospital
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Caregiver Assignment Dialog */}
      {assigningCaregiver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-md w-full max-h-[90vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Assign Caregiver</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 min-h-0 space-y-3">
              {loadingCaregivers ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading caregivers...</p>
                </div>
              ) : availableCaregivers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No caregivers available. Please seed caregivers first.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
                  {availableCaregivers.map((caregiver) => (
                    <Card
                      key={caregiver.id}
                      className="cursor-pointer hover:border-indigo-300 transition-colors"
                      onClick={() => handleAssignCaregiver(assigningCaregiver, caregiver.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{caregiver.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {caregiver.licenseNumber && `License: ${caregiver.licenseNumber}`}
                              {caregiver.patientsCount > 0 && ` · ${caregiver.patientsCount} patient${caregiver.patientsCount !== 1 ? 's' : ''}`}
                            </p>
                            {caregiver.phone && (
                              <p className="text-xs text-muted-foreground truncate">
                                {caregiver.phone}
                              </p>
                            )}
                          </div>
                          {caregiver.available && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 flex-shrink-0">
                              Available
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <div className="flex-shrink-0 pt-2 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setAssigningCaregiver(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patient Detail Panel */}
      {selectedPatient && !dispatchDialogOpen && (
        <PatientDetailPanel
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onDispatch={() => {
            setSelectedPatient(null);
            setDispatchDialogOpen(true);
          }}
        />
      )}

      {/* Dispatch Dialog */}
      {dispatchDialogOpen && selectedPatient && (
        <DispatchDialog
          patient={selectedPatient}
          open={dispatchDialogOpen}
          onClose={() => {
            setDispatchDialogOpen(false);
            setSelectedPatient(null);
          }}
          onDispatchSuccess={(dispatch) => {
            console.log('Dispatch successful:', dispatch);
            // Remove patient from list after dispatch
            if (selectedPatient) {
              // Add to removed patients set
              console.log('Removing patient from dispatch:', selectedPatient.id, selectedPatient.name);
              setRemovedPatientIds(prev => new Set([...prev, selectedPatient.id]));
              setMyPatients(prev => prev.filter(p => p.id !== selectedPatient.id));
              setStats(prev => ({
                ...prev,
                totalPatients: Math.max(0, prev.totalPatients - 1),
                criticalPatients: prev.criticalPatients > 0 ? Math.max(0, prev.criticalPatients - 1) : 0,
              }));
            }
            setDispatchDialogOpen(false);
            setSelectedPatient(null);
            // Don't call loadData() - we've already removed the patient
          }}
        />
      )}

      {/* Send Message Dialog */}
      {messageDialogPatient && currentDoctor && (
        <SendMessageDialog
          patient={messageDialogPatient}
          doctorId={currentDoctor.doctorId}
          open={messageDialogOpen}
          onClose={() => {
            setMessageDialogOpen(false);
            setMessageDialogPatient(null);
          }}
          onSuccess={() => {
            // Remove patient from list after sending guidance
            if (messageDialogPatient) {
              // Add to removed patients set
              console.log('Removing patient after guidance:', messageDialogPatient.id, messageDialogPatient.name);
              setRemovedPatientIds(prev => new Set([...prev, messageDialogPatient.id]));
              setMyPatients(prev => prev.filter(p => p.id !== messageDialogPatient.id));
              setStats(prev => ({
                ...prev,
                totalPatients: Math.max(0, prev.totalPatients - 1),
                criticalPatients: prev.criticalPatients > 0 ? Math.max(0, prev.criticalPatients - 1) : 0,
              }));
            }
            // Close dialog and clear selection
            setMessageDialogOpen(false);
            setMessageDialogPatient(null);
            // Also clear selectedPatient if it's the same patient
            if (selectedPatient && messageDialogPatient && selectedPatient.id === messageDialogPatient.id) {
              setSelectedPatient(null);
            }
            // Don't call loadData() - we've already removed the patient
          }}
        />
      )}
    </div>
  );
}
