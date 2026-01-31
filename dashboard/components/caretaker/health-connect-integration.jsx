"use client";

import { useState, useEffect } from "react";
import { Activity, CheckCircle2, X, RefreshCw, Smartphone, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  isHealthConnectAvailable,
  requestHealthConnectPermissions,
  getHealthConnectStatus,
  fetchHealthConnectVitals,
  subscribeToHealthConnectUpdates,
} from "@/lib/health-connect";

export function HealthConnectIntegration({ patientId, onVitalsReceived }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [latestVitals, setLatestVitals] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Check initial connection status
  useEffect(() => {
    if (!patientId) return;
    
    const status = getHealthConnectStatus();
    setConnected(status.connected);
    
    if (status.connected) {
      // Fetch initial vitals
      fetchHealthConnectVitals(patientId).then((vitals) => {
        setLatestVitals(vitals);
        setLastUpdate(new Date());
        if (onVitalsReceived) {
          onVitalsReceived(vitals);
        }
      });
    }
  }, [patientId, onVitalsReceived]);

  // Subscribe to updates when connected
  useEffect(() => {
    if (!connected || !patientId) return;

    const unsubscribe = subscribeToHealthConnectUpdates(patientId, (vitals) => {
      setLatestVitals(vitals);
      setLastUpdate(new Date());
      if (onVitalsReceived) {
        onVitalsReceived(vitals);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [connected, patientId, onVitalsReceived]);

  const handleConnect = async () => {
    if (!isHealthConnectAvailable()) {
      alert('Health Connect is not available on this device.');
      return;
    }

    setConnecting(true);
    try {
      const status = await requestHealthConnectPermissions();
      if (status.granted) {
        setConnected(true);
        const vitals = await fetchHealthConnectVitals(patientId);
        setLatestVitals(vitals);
        setLastUpdate(new Date());
        if (onVitalsReceived) {
          onVitalsReceived(vitals);
        }
      } else {
        alert('Health Connect permissions were denied.');
      }
    } catch (error) {
      console.error('Error connecting to Health Connect:', error);
      alert('Failed to connect to Health Connect. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleRefresh = async () => {
    if (!connected || !patientId) return;
    
    try {
      const vitals = await fetchHealthConnectVitals(patientId);
      setLatestVitals(vitals);
      setLastUpdate(new Date());
      if (onVitalsReceived) {
        onVitalsReceived(vitals);
      }
    } catch (error) {
      console.error('Error refreshing Health Connect data:', error);
    }
  };

  if (!isHealthConnectAvailable()) {
    return null; // Don't show if Health Connect is not available
  }

  return (
    <Card className={connected ? "border-emerald-200 bg-emerald-50/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className={`w-5 h-5 ${connected ? 'text-emerald-600' : 'text-slate-400'}`} />
            <CardTitle className="text-base">Health Connect</CardTitle>
          </div>
          {connected && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          {connected
            ? "Wearable device data is being synced automatically"
            : "Connect to sync vital readings from wearable devices"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!connected ? (
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full"
            variant="outline"
          >
            {connecting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Connect Health Connect
              </span>
            )}
          </Button>
        ) : (
          <>
            {latestVitals && (
              <div className="space-y-2 p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">Latest Reading</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefresh}
                    className="h-6 px-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Heart Rate:</span>
                    <span className="ml-1 font-semibold">{latestVitals.heartRate} bpm</span>
                  </div>
                  <div>
                    <span className="text-slate-500">BP:</span>
                    <span className="ml-1 font-semibold">{latestVitals.bloodPressure} mmHg</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Glucose:</span>
                    <span className="ml-1 font-semibold">{latestVitals.bloodGlucose} mg/dL</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Activity:</span>
                    <span className="ml-1 font-semibold">{latestVitals.activity} steps/hr</span>
                  </div>
                </div>
                {lastUpdate && (
                  <p className="text-xs text-slate-400 mt-2">
                    Updated: {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Auto-syncing every 30 seconds</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

