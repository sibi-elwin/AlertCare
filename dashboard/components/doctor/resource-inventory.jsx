"use client";

import { useState, useEffect } from "react";
import { Building2, Bed, Droplets, Wifi, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchLiveResourceData } from "@/lib/logistics-bridge";

export function ResourceInventory({ hospitalId = 'hosp-001', autoRefresh = true }) {
  const [resources, setResources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await fetchLiveResourceData(hospitalId);
      setResources(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
    
    if (autoRefresh) {
      const interval = setInterval(loadResources, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [hospitalId, autoRefresh]);

  if (loading && !resources) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Resource Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4 text-sm text-muted-foreground">
            Loading automated feeds...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Resource Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getOxygenColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-emerald-600';
      case 'good': return 'text-emerald-500';
      case 'adequate': return 'text-amber-500';
      case 'low': return 'text-amber-600';
      case 'critical': return 'text-rose-600';
      default: return 'text-slate-600';
    }
  };

  const getOxygenBg = (status) => {
    switch (status) {
      case 'excellent': return 'bg-emerald-50 border-emerald-200';
      case 'good': return 'bg-emerald-50 border-emerald-200';
      case 'adequate': return 'bg-amber-50 border-amber-200';
      case 'low': return 'bg-amber-100 border-amber-300';
      case 'critical': return 'bg-rose-50 border-rose-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Resource Inventory
          </CardTitle>
          {resources?.manual_override?.active && (
            <Badge variant="destructive" className="text-xs">
              Override Active
            </Badge>
          )}
        </div>
        {resources && (
          <p className="text-xs text-muted-foreground mt-1">
            {resources.hospital_name}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* ICU Beds */}
        <div className="p-3 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-foreground">ICU Beds</span>
            </div>
            <Badge
              variant={resources.is_safe_for_dispatch ? "outline" : "destructive"}
              className={
                resources.is_safe_for_dispatch
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : ""
              }
            >
              {resources.is_safe_for_dispatch ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : (
                <AlertTriangle className="w-3 h-3 mr-1" />
              )}
              {resources.is_safe_for_dispatch ? "Available" : "Unavailable"}
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {resources.icu_beds_free}
            </span>
            <span className="text-xs text-muted-foreground">
              / {resources.icu_beds_total} free
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Source: ADT System (HL7 FHIR)
          </p>
        </div>

        {/* Oxygen Supply */}
        <div className={`p-3 rounded-lg border ${getOxygenBg(resources.oxygen_status)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-foreground">Oxygen Supply</span>
            </div>
            <Badge
              variant="outline"
              className={`${getOxygenBg(resources.oxygen_status)} border-current`}
            >
              {resources.oxygen_status}
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getOxygenColor(resources.oxygen_status)}`}>
              {resources.oxygen_psi}
            </span>
            <span className="text-xs text-muted-foreground">PSI</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Source: IoT Pressure Sensor
          </p>
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Wifi className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Last sync</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {resources.last_sync
              ? new Date(resources.last_sync).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Never'}
          </span>
        </div>

        {/* Manual Override Notice */}
        {resources.manual_override?.active && (
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-800">
                  Manual Override Active
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {resources.override_reason || 'Admin override in effect'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
