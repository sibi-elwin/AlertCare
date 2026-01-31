"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { caregiverDashboardAPI } from "@/lib/api-client";

export function AlertsView({ caregiverId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [caregiverId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await caregiverDashboardAPI.getAlerts(caregiverId, {
        limit: 20,
        acknowledged: false, // Only show unacknowledged alerts
      });
      
      if (response.success && response.data) {
        setAlerts(response.data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityFromPriority = (priority) => {
    if (priority === 'high') return 'critical';
    if (priority === 'normal') return 'major';
    return 'small';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600" />
          Alerts & Notifications
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
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
              const severity = getSeverityFromPriority(alert.priority);
              const patientName = alert.patient 
                ? `${alert.patient.firstName || ''} ${alert.patient.lastName || ''}`.trim() || 'Patient'
                : 'Unknown Patient';
              
              return (
                <Card
                  key={alert.id}
                  className={`border-2 ${
                    severity === 'critical'
                      ? 'border-rose-300 bg-rose-50'
                      : severity === 'major'
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-slate-200'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={`w-4 h-4 ${
                            severity === 'critical' ? 'text-rose-600' :
                            severity === 'major' ? 'text-amber-600' :
                            'text-slate-600'
                          }`} />
                          <Badge
                            variant={
                              severity === 'critical'
                                ? 'destructive'
                                : severity === 'major'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {alert.priority?.toUpperCase() || 'NORMAL'}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {patientName}
                          </span>
                        </div>
                        
                        <p className="text-sm text-foreground mb-2">
                          {alert.message}
                        </p>
                        
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
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
  );
}
