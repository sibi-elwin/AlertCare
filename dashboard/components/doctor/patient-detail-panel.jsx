"use client";

import { useState } from "react";
import { X, Phone, Ambulance, Heart, Droplets, Thermometer, Wind, Activity, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DispatchDialog } from "./dispatch-dialog";
import { SMSNotificationButton } from "./sms-notification-button";
import { SendMessageDialog } from "./send-message-dialog";
import { getStatusCategory, getSmartBurstStatus } from "@/lib/healthcare-data";
import { getCurrentDoctor } from "@/lib/auth";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function VitalCard({ icon: Icon, label, value, unit, status = "normal" }) {
  const statusColors = {
    critical: "border-rose-200 bg-rose-50",
    warning: "border-amber-200 bg-amber-50",
    normal: "border-border bg-card",
  };

  const iconColors = {
    critical: "text-rose-600",
    warning: "text-amber-600",
    normal: "text-indigo-600",
  };

  return (
    <div className={`p-3 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${iconColors[status]}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export function PatientDetailPanel({ patient, onClose, onDispatch }) {
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const currentDoctor = getCurrentDoctor();

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
      // Add small variation for realism using sine/cosine waves
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

  const stabilityTrendData = generateDecreasingTrend();
  
  // Get patient data with vitals if available
  const patientData = patient.vitals ? patient : {
    ...patient,
    vitals: {
      heartRate: 75,
      spo2: 98,
      systolicBP: 120,
      temperature: 36.5,
      respiratoryRate: 16,
      glucose: 100,
    },
    stabilityIndex: patient.stabilityIndex || 85,
    news2Score: patient.news2Score || 0,
  };
  
  const status = getStatusCategory(patientData.stabilityIndex, patientData.news2Score);
  const burstStatus = getSmartBurstStatus(patientData.stabilityIndex);

  const handleDispatchSuccess = (dispatch) => {
    console.log('Dispatch successful:', dispatch);
    if (onDispatch) {
      onDispatch();
    }
  };

  const handleDispatchClick = () => {
    if (onDispatch) {
      onDispatch();
    } else {
      setDispatchDialogOpen(true);
    }
  };

  const getVitalStatus = (vital, value) => {
    if (vital === "spo2" && value < 92) return "critical";
    if (vital === "spo2" && value < 95) return "warning";
    if (vital === "heartRate" && (value > 120 || value < 50)) return "critical";
    if (vital === "heartRate" && (value > 100 || value < 60)) return "warning";
    if (vital === "systolicBP" && (value > 180 || value < 90)) return "critical";
    if (vital === "systolicBP" && (value > 140 || value < 100)) return "warning";
    if (vital === "temperature" && (value > 39 || value < 35)) return "critical";
    if (vital === "temperature" && (value > 38 || value < 36)) return "warning";
    return "normal";
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{patient.name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {patient.age} years · {patient.condition}
              </p>
            </div>
            <Badge
              className={
                status.label === "Critical"
                  ? "bg-rose-600 text-white"
                  : status.label === "Warning"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-600 text-white"
              }
            >
              {status.label}
            </Badge>
          </div>

          {/* Smart-Burst Status */}
          <div
            className={`
            mt-3 p-3 rounded-lg flex items-center justify-between
            ${burstStatus.mode === "emergency" ? "bg-rose-50 border border-rose-200" : "bg-emerald-50 border border-emerald-200"}
          `}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${burstStatus.mode === "emergency" ? "bg-rose-600 emergency-pulse" : "bg-emerald-600"}`}
              />
              <span
                className={`text-sm font-medium ${burstStatus.mode === "emergency" ? "text-rose-800" : "text-emerald-800"}`}
              >
                {burstStatus.label}
              </span>
            </div>
            <span
              className={`text-xs ${burstStatus.mode === "emergency" ? "text-rose-600" : "text-emerald-600"}`}
            >
              {burstStatus.interval}
            </span>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Key Metrics */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Current Vitals
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <VitalCard
                icon={Heart}
                label="Heart Rate"
                value={patientData.vitals.heartRate}
                unit="bpm"
                status={getVitalStatus("heartRate", patientData.vitals.heartRate)}
              />
              <VitalCard
                icon={Droplets}
                label="SpO2"
                value={patientData.vitals.spo2}
                unit="%"
                status={getVitalStatus("spo2", patientData.vitals.spo2)}
              />
              <VitalCard
                icon={Activity}
                label="Blood Pressure"
                value={patientData.vitals.systolicBP}
                unit="mmHg"
                status={getVitalStatus("systolicBP", patientData.vitals.systolicBP)}
              />
              <VitalCard
                icon={Thermometer}
                label="Temperature"
                value={patientData.vitals.temperature}
                unit="°C"
                status={getVitalStatus("temperature", patientData.vitals.temperature)}
              />
              <VitalCard
                icon={Wind}
                label="Resp. Rate"
                value={patientData.vitals.respiratoryRate}
                unit="/min"
              />
              <VitalCard
                icon={Droplets}
                label="Glucose"
                value={patientData.vitals.glucose}
                unit="mg/dL"
              />
            </div>
          </div>

          {/* Stability Trend Graph */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Health Stability Trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={stabilityTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      label={{ value: 'Stability Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 11 } }}
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
                      dot={{ fill: '#6366f1', r: 3 }}
                      activeDot={{ r: 5, fill: '#6366f1' }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Showing 30-day health stability trend
              </p>
            </CardContent>
          </Card>


          {/* Caretaker Info */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Assigned Caretaker</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {patient.caregiver ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{patient.caregiver.name || 'Unknown Caregiver'}</p>
                    <p className="text-sm text-muted-foreground">{patient.caregiver.phone || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No caregiver assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDispatchClick}
            >
              <Ambulance className="w-5 h-5 mr-2" />
              Dispatch to Hospital
            </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50 bg-transparent"
                disabled={!patient.caregiver}
                onClick={() => {
                  if (patient.caregiver?.phone) {
                    window.open(`tel:${patient.caregiver.phone}`, '_self');
                  }
                }}
              >
                <Phone className="w-5 h-5 mr-2" />
                Contact Caretaker
              </Button>
            </div>
            <SMSNotificationButton patient={patient} />
            <Button
              size="lg"
              variant="outline"
              className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              onClick={() => setMessageDialogOpen(true)}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Send Message to Patient
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Closed-Loop Dispatch Dialog */}
      {dispatchDialogOpen && (
        <DispatchDialog
          patient={patientData}
          open={dispatchDialogOpen}
          onClose={() => setDispatchDialogOpen(false)}
          onDispatchSuccess={handleDispatchSuccess}
        />
      )}

      {/* Send Message Dialog */}
      {currentDoctor && (
        <SendMessageDialog
          patient={patient}
          doctorId={currentDoctor.doctorId}
          open={messageDialogOpen}
          onClose={() => setMessageDialogOpen(false)}
          onSuccess={() => {
            // Message sent successfully
            if (onClose) onClose();
          }}
        />
      )}
    </Sheet>
  );
}
