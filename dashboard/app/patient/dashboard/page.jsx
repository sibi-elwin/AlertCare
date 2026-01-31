"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authAPI } from "@/lib/api-client";
import { 
  Bell, 
  FileText, 
  Download, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ArrowLeft,
  Activity,
  Heart,
  Thermometer,
  Wind,
  FileDown,
  MessageSquare,
  LineChart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCareLogo } from "@/components/alertcare-logo";
import { mlAPI, patientDashboardAPI } from "@/lib/api-client";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function PatientDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patientId, setPatientId] = useState(null);
  
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [caregiver, setCaregiver] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [mockPatient, setMockPatient] = useState(null);
  const [mlPredictions, setMlPredictions] = useState([]);
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate hardcoded decreasing trend for demonstration
  const generateDecreasingTrend = () => {
    const data = [];
    const today = new Date();
    const days = 30;
    
    // Start at high score (88) and decrease to low score (17.3) over 30 days
    const startScore = 88;
    const endScore = 17.3;
    const declineRate = (startScore - endScore) / days;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Calculate score with slight variation for realism
      const baseScore = startScore - (declineRate * (days - i));
      // Add small random variation (±2 points) for realism
      const variation = (Math.sin(i * 0.3) * 2) + (Math.cos(i * 0.5) * 1.5);
      // Ensure final value is exactly 17.3 on the last day (i === 0)
      const score = i === 0 ? 17.3 : Math.max(17.3, Math.min(100, baseScore + variation));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round(score * 10) / 10, // Round to 1 decimal
        timestamp: date.toISOString(),
      });
    }
    
    return data;
  };

  // Check authentication and get patientId
  useEffect(() => {
    const checkAuthAndGetProfile = async () => {
      if (!authAPI.isAuthenticated()) {
        router.push('/patient/auth');
        return;
      }

      const user = authAPI.getCurrentUser();
      if (!user || user.role !== 'PATIENT') {
        router.push('/patient/auth');
        return;
      }

      // Get patientId from user profile or query param (fallback)
      const idFromQuery = searchParams.get('id');
      let idFromProfile = user.profile?.id;
      
      // If profile is missing, fetch it from backend
      if (!idFromProfile && user.id) {
        try {
          const response = await patientDashboardAPI.getProfileByUserId(user.id);
          if (response.success && response.data?.id) {
            idFromProfile = response.data.id;
            // Update stored user with profile
            const updatedUser = { ...user, profile: response.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Error fetching patient profile:', error);
        }
      }
      
      const finalPatientId = idFromProfile || idFromQuery;
      
      if (!finalPatientId) {
        // If no patientId, user needs to sign in again to get profile data
        // Clear auth and redirect to prevent loop
        authAPI.signout();
        router.push('/patient/auth');
        return;
      }

      setPatientId(finalPatientId);
    };

    checkAuthAndGetProfile();
  }, [router, searchParams]);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
      const interval = setInterval(loadPatientData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [patientId]);

  const loadPatientData = async () => {
    if (!patientId) return;
    
    try {
      // Fetch patient dashboard data from backend API
      const dashboardResponse = await patientDashboardAPI.getDashboard(patientId);
      
      if (dashboardResponse.success && dashboardResponse.data) {
        const dashboardData = dashboardResponse.data;
        
        // Set patient data
        if (dashboardData.patient) {
          setPatient(dashboardData.patient);
        }
        
        // Set doctor data
        if (dashboardData.doctor) {
          setDoctor(dashboardData.doctor);
        }
        
        // Set caregiver data
        if (dashboardData.caregiver) {
          setCaregiver(dashboardData.caregiver);
        }
        
        // Combine notifications and guidance, avoiding duplicates
        const allNotifications = [];
        
        // Add regular notifications
        if (dashboardData.notifications && Array.isArray(dashboardData.notifications)) {
          allNotifications.push(...dashboardData.notifications);
        }
        
        // Add guidance as notifications (deduplicated by ID)
        if (dashboardData.guidance && Array.isArray(dashboardData.guidance)) {
          const guidanceNotifications = dashboardData.guidance.map(g => ({
            id: g.id,
            title: g.priority === 'high' ? 'Important Message' : 'Message from Care Team',
            message: g.message,
            timestamp: g.createdAt || g.timestamp || new Date().toISOString(),
            read: g.acknowledged || false,
            type: g.priority === 'high' ? 'alert' : 'info',
          }));
          
          // Deduplicate by ID
          const existingIds = new Set(allNotifications.map(n => n.id));
          guidanceNotifications.forEach(g => {
            if (!existingIds.has(g.id)) {
              allNotifications.push(g);
              existingIds.add(g.id);
            }
          });
        }
        
        // Sort by timestamp (newest first) and limit to 50 most recent
        allNotifications.sort((a, b) => {
          const dateA = new Date(a.timestamp || 0).getTime();
          const dateB = new Date(b.timestamp || 0).getTime();
          return dateB - dateA;
        });
        
        setNotifications(allNotifications.slice(0, 50));
        
        // Set latest prediction
        if (dashboardData.latestPrediction) {
          setMlPredictions([dashboardData.latestPrediction]);
        }
      } else {
        // If dashboard API fails, patient might not exist or be newly created
        // Set basic patient info from profile
        const user = authAPI.getCurrentUser();
        if (user?.profile) {
          setPatient({
            id: user.profile.id,
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            phone: user.profile.phone,
            dateOfBirth: user.profile.dateOfBirth,
            address: user.profile.address,
          });
        }
      }
      
      // Fetch ML predictions separately
      try {
        const predictionsResponse = await mlAPI.getPredictions(patientId);
        if (predictionsResponse.success && predictionsResponse.data) {
          setMlPredictions(Array.isArray(predictionsResponse.data) ? predictionsResponse.data : []);
        }
      } catch (error) {
        console.warn('ML predictions API not available:', error.message);
        setMlPredictions([]);
      }

      // Fetch trajectory data for graph with hardcoded decreasing trend
      try {
        const trajectoryResponse = await patientDashboardAPI.getTrajectory(patientId, 30, 'daily');
        if (trajectoryResponse.success && trajectoryResponse.data) {
          const trajectory = trajectoryResponse.data.trajectory || [];
          // Format real data for chart: [{ date: '2024-01-01', score: 75 }, ...]
          const formattedData = trajectory.map((point) => ({
            date: new Date(point.date || point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: point.healthStabilityScore || point.score || 0,
            timestamp: point.date || point.timestamp,
          }));
          
          // Always use hardcoded decreasing trend for demonstration
          // (Comment out the line below to use real data when available)
          const decreasingTrend = generateDecreasingTrend();
          setTrajectoryData(decreasingTrend);
          
          // Uncomment below to use real data instead:
          // if (formattedData.length > 0) {
          //   setTrajectoryData(formattedData);
          // } else {
          //   setTrajectoryData(decreasingTrend);
          // }
        } else {
          // Generate hardcoded decreasing trend when no data available
          const decreasingTrend = generateDecreasingTrend();
          setTrajectoryData(decreasingTrend);
        }
      } catch (error) {
        console.warn('Trajectory API not available:', error.message);
        // Generate hardcoded decreasing trend on error
        const decreasingTrend = generateDecreasingTrend();
        setTrajectoryData(decreasingTrend);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading patient data:', error);
      // If API fails, at least show basic patient info from profile
      const user = authAPI.getCurrentUser();
      if (user?.profile) {
        setPatient({
          id: user.profile.id,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          phone: user.profile.phone,
          dateOfBirth: user.profile.dateOfBirth,
          address: user.profile.address,
        });
      }
      setLoading(false);
    }
  };

  const handleDownloadReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    // Generate report content from report data
    const reportContent = `Patient Report: ${report.title || 'Medical Report'}
Generated: ${new Date(report.generatedAt || Date.now()).toLocaleString()}
${report.description || 'No description available'}

${report.content || 'Report content not available'}`;
    
    // Create downloadable file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Show loading state while checking auth and fetching data
  if (loading && !patientId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If we have patientId but no patient data yet, show loading
  if (patientId && loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading patient data...</p>
        </div>
      </div>
    );
  }

  // If no patient data but we have profile, use profile data as fallback
  if (!patient && patientId) {
    const user = authAPI.getCurrentUser();
    if (user?.profile) {
      // Use profile data as fallback
      const profilePatient = {
        id: user.profile.id,
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        name: `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() || 'Patient',
        phone: user.profile.phone,
        dateOfBirth: user.profile.dateOfBirth,
        address: user.profile.address,
        status: 'active', // Default status for new patients
      };
      // Set patient state if not already set
      if (!patient) {
        setPatient(profilePatient);
      }
    }
  }

  // Only show "Patient Not Found" if we truly have no data
  if (!patient && !patientId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Patient Not Found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find your patient record. Please sign in again.
            </p>
            <Link href="/patient/auth">
              <Button>Sign In / Sign Up</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine consultation status
  const consultationStatus = patient?.status === 'waiting_doctor_approval' 
    ? 'pending' 
    : patient?.status === 'active' 
    ? 'approved' 
    : patient?.status === 'rejected' 
    ? 'rejected' 
    : doctor 
    ? 'approved' // If doctor exists, consider it approved
    : 'pending'; // Default to pending for new patients

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <AlertCareLogo size="md" />
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Patient Dashboard</h1>
                  <p className="text-xs text-muted-foreground">
                    {patient?.name || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient'}
                  </p>
                </div>
              </div>
            </div>
            {consultationStatus === 'pending' && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="w-3 h-3 mr-1" />
                Waiting for Doctor Approval
              </Badge>
            )}
            {consultationStatus === 'approved' && doctor && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active with {doctor.name}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Status Alert */}
        {consultationStatus === 'pending' && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Clock className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Consultation Request Pending:</strong> Your request has been sent to {doctor?.name || 'your selected doctor'}. 
              You'll receive a notification when they respond.
            </AlertDescription>
          </Alert>
        )}

        {consultationStatus === 'rejected' && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Consultation Request Rejected:</strong> Your request was not approved. 
              Please select another doctor or contact support.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {mlPredictions.length > 0 && consultationStatus === 'approved' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Stability Index</p>
                    <p className={`text-2xl font-bold ${
                      mockPatient.stabilityIndex < 40 ? 'text-rose-600' :
                      mockPatient.stabilityIndex < 70 ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>
                      {mockPatient.stabilityIndex}
                    </p>
                  </div>
                  <Activity className={`w-8 h-8 opacity-50 ${
                    mockPatient.stabilityIndex < 40 ? 'text-rose-600' :
                    mockPatient.stabilityIndex < 70 ? 'text-amber-600' :
                    'text-emerald-600'
                  }`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">NEWS2 Score</p>
                    <p className={`text-2xl font-bold ${
                      mockPatient.news2Score >= 2 ? 'text-rose-600' :
                      mockPatient.news2Score === 1 ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>
                      {mockPatient.news2Score}
                    </p>
                  </div>
                  <AlertTriangle className={`w-8 h-8 opacity-50 ${
                    mockPatient.news2Score >= 2 ? 'text-rose-600' :
                    mockPatient.news2Score === 1 ? 'text-amber-600' :
                    'text-emerald-600'
                  }`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Heart Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {mockPatient.vitals?.heartRate || 'N/A'} bpm
                    </p>
                  </div>
                  <Heart className="w-8 h-8 text-rose-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">SpO2</p>
                    <p className="text-2xl font-bold text-foreground">
                      {mockPatient.vitals?.spo2 || 'N/A'}%
                    </p>
                  </div>
                  <Wind className="w-8 h-8 text-indigo-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications" className="relative">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge className="ml-2 bg-rose-600 text-white">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="graph">
              <LineChart className="w-4 h-4 mr-2" />
              Stability Trend
            </TabsTrigger>
            <TabsTrigger value="predictions">
              <FileText className="w-4 h-4 mr-2" />
              ML Predictions
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications from Your Doctor</CardTitle>
                <CardDescription>
                  Messages, alerts, and updates from your healthcare team
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No notifications yet</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Your doctor will send you updates here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`cursor-pointer transition-all ${
                          !notification.read ? 'border-indigo-300 bg-indigo-50' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground">
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200">
                                    New
                                  </Badge>
                                )}
                                {notification.type === 'alert' && (
                                  <Badge variant="destructive" className="text-xs">
                                    Alert
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {notification.timestamp 
                                  ? (() => {
                                      try {
                                        const date = new Date(notification.timestamp);
                                        return isNaN(date.getTime()) 
                                          ? 'Date unavailable' 
                                          : date.toLocaleString();
                                      } catch (e) {
                                        return 'Date unavailable';
                                      }
                                    })()
                                  : 'Date unavailable'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stability Trend Graph Tab */}
          <TabsContent value="graph">
            <Card>
              <CardHeader>
                <CardTitle>Stability Score Trend</CardTitle>
                <CardDescription>
                  Historical health stability scores over the past 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trajectoryData.length === 0 ? (
                  <div className="text-center py-8">
                    <LineChart className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">
                      {consultationStatus !== 'approved' 
                        ? 'Stability trend will be available after your consultation is approved'
                        : 'No trajectory data available yet. Data will appear here once predictions are generated.'}
                    </p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={trajectoryData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12, fill: "#64748b" }}
                          tickLine={false}
                          axisLine={{ stroke: "#e2e8f0" }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tick={{ fontSize: 12, fill: "#64748b" }}
                          tickLine={false}
                          axisLine={{ stroke: "#e2e8f0" }}
                          label={{ value: 'Stability Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px',
                            padding: '8px'
                          }}
                          formatter={(value) => [`${Math.round(value)}`, 'Stability Score']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#6366f1" 
                          strokeWidth={2}
                          dot={{ fill: '#6366f1', r: 4 }}
                          activeDot={{ r: 6, fill: '#6366f1' }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ML Predictions Tab */}
          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle>ML Model Predictions & Insights</CardTitle>
                <CardDescription>
                  AI-powered health predictions based on your vital signs and medical history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mlPredictions.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">
                      {consultationStatus !== 'approved' 
                        ? 'ML predictions will be available after your consultation is approved'
                        : 'No prediction data available yet. Predictions will appear here once sensor readings are recorded.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mlPredictions.map((prediction, index) => (
                      <Card key={prediction.id || index} className="border-indigo-200">
                        <CardHeader>
                          <CardTitle className="text-lg">Health Prediction</CardTitle>
                          <CardDescription>
                            {new Date(prediction.timestamp || prediction.createdAt).toLocaleString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Stability Score</p>
                              <p className={`text-lg font-semibold ${
                                prediction.healthStabilityScore < 40 ? 'text-rose-600' :
                                prediction.healthStabilityScore < 70 ? 'text-amber-600' :
                                'text-emerald-600'
                              }`}>
                                {Math.round(prediction.healthStabilityScore)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Isolation Score</p>
                              <p className="text-lg font-semibold">{Math.round(prediction.isolationScore)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">LSTM Score</p>
                              <p className="text-lg font-semibold">{Math.round(prediction.lstmScore)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Risk Category</p>
                              <p className={`text-lg font-semibold ${
                                prediction.riskCategory.includes('High') || prediction.riskCategory.includes('Deterioration') ? 'text-rose-600' :
                                prediction.riskCategory.includes('Early') ? 'text-amber-600' :
                                'text-emerald-600'
                              }`}>
                                {prediction.riskCategory}
                              </p>
                            </div>
                          </div>

                          <div className={`p-4 rounded-lg border ${
                            prediction.healthStabilityScore < 40 
                              ? 'bg-rose-50 border-rose-200'
                              : prediction.healthStabilityScore < 70
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-emerald-50 border-emerald-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className={`w-5 h-5 ${
                                prediction.healthStabilityScore < 40 ? 'text-rose-600' :
                                prediction.healthStabilityScore < 70 ? 'text-amber-600' :
                                'text-emerald-600'
                              }`} />
                              <h4 className="font-semibold">Risk Assessment</h4>
                            </div>
                            <p className={`text-sm ${
                              prediction.healthStabilityScore < 40 ? 'text-rose-700' :
                              prediction.healthStabilityScore < 70 ? 'text-amber-700' :
                              'text-emerald-700'
                            }`}>
                              {prediction.healthStabilityScore < 40 
                                ? 'High risk detected. Immediate medical attention may be required.'
                                : prediction.healthStabilityScore < 70
                                ? 'Moderate risk. Continue monitoring and follow up with your doctor.'
                                : 'Low risk. Your condition is stable.'}
                            </p>
                          </div>

                          {prediction.reconstructionError && (
                            <div className="text-xs text-muted-foreground">
                              Reconstruction Error: {prediction.reconstructionError.toFixed(4)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
