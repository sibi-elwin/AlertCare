"use client";

import { useState, useEffect } from "react";
import {
  Ambulance,
  Building2,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Radio,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { orchestrateDispatch, executeDispatch } from "@/lib/logistics-bridge";

export function DispatchDialog({ patient, open, onClose, onDispatchSuccess }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  useEffect(() => {
    if (open && patient) {
      loadHospitals();
    } else {
      // Reset state when dialog closes
      setHospitals([]);
      setSelectedHospital(null);
      setDispatchResult(null);
    }
  }, [open, patient]);

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const results = await orchestrateDispatch(patient.sector, patient.condition);
      setHospitals(results);
      // Auto-select recommended hospital
      const recommended = results.find(h => h.recommended);
      if (recommended) {
        setSelectedHospital(recommended.hospital_id);
      }
    } catch (error) {
      console.error('Error loading hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (!selectedHospital) return;

    setDispatching(true);
    try {
      const result = await executeDispatch(patient, selectedHospital);
      setDispatchResult(result);
      
      if (result.success) {
        // Call success callback after a short delay
        setTimeout(() => {
          onDispatchSuccess?.(result.dispatch);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Dispatch error:', error);
      setDispatchResult({
        success: false,
        error: error.message || 'Failed to dispatch',
      });
    } finally {
      setDispatching(false);
    }
  };

  const getStatusColor = (isSafe) => {
    return isSafe
      ? "border-emerald-200 bg-emerald-50"
      : "border-rose-200 bg-rose-50";
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "text-emerald-600";
    if (score >= 40) return "text-amber-600";
    return "text-rose-600";
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ambulance className="w-5 h-5 text-rose-600" />
            Closed-Loop Dispatch Orchestration
          </DialogTitle>
          <DialogDescription>
            Automated resource checking from ADT systems, IoT sensors, and RFID tracking.
            No manual entry required.
          </DialogDescription>
        </DialogHeader>

        {/* Patient Info */}
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{patient.name}</p>
                <p className="text-sm text-muted-foreground">
                  {patient.condition} · {patient.sector}
                </p>
              </div>
              <Badge
                className={
                  patient.news2Score === 3
                    ? "bg-rose-600 text-white"
                    : "bg-amber-500 text-white"
                }
              >
                NEWS2: {patient.news2Score}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">
              Querying automated systems...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ADT Systems · IoT Sensors · RFID Tracking
            </p>
          </div>
        )}

        {/* Hospital Options */}
        {!loading && hospitals.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Available Hospitals
            </h3>
            {hospitals.map((hospital) => {
              const isSelected = selectedHospital === hospital.hospital_id;
              const isRecommended = hospital.recommended;

              return (
                <Card
                  key={hospital.hospital_id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50"
                      : "hover:border-indigo-200"
                  } ${getStatusColor(hospital.is_safe_for_dispatch)}`}
                  onClick={() => {
                    if (hospital.is_safe_for_dispatch) {
                      setSelectedHospital(hospital.hospital_id);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Radio Button */}
                      <div className="mt-1">
                        {hospital.is_safe_for_dispatch ? (
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-slate-100" />
                        )}
                      </div>

                      {/* Hospital Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                            <span className="font-semibold text-foreground">
                              {hospital.hospital_name}
                            </span>
                            {isRecommended && (
                              <Badge className="bg-indigo-600 text-white text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-lg font-bold ${getScoreColor(
                                hospital.dispatch_score
                              )}`}
                            >
                              {hospital.dispatch_score}
                            </span>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        </div>

                        {/* Resource Details */}
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">ICU Beds</p>
                            <p className="text-sm font-semibold text-foreground">
                              {hospital.icu_beds_free}/{hospital.icu_beds_total}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              ADT System
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Oxygen</p>
                            <p className="text-sm font-semibold text-foreground">
                              {hospital.oxygen_psi} PSI
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              IoT Sensor
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ambulance</p>
                            <p className="text-sm font-semibold text-foreground">
                              {hospital.ambulance_available > 0 ? (
                                <>
                                  {hospital.ambulance_available} available
                                </>
                              ) : (
                                <span className="text-rose-600">None</span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              ETA: {hospital.ambulance_eta} min
                            </p>
                          </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                          {hospital.is_safe_for_dispatch ? (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="text-xs font-medium">Safe for Dispatch</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-rose-600">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="text-xs font-medium">
                                {hospital.error || "Resources Unavailable"}
                              </span>
                            </div>
                          )}
                          {hospital.manual_override?.active && (
                            <Badge variant="outline" className="text-xs">
                              Override: {hospital.override_reason}
                            </Badge>
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

        {/* No Hospitals Available */}
        {!loading && hospitals.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              No Hospitals Available
            </p>
            <p className="text-xs text-muted-foreground">
              All hospitals are currently at capacity or have resource constraints.
            </p>
          </div>
        )}

        {/* Dispatch Result */}
        {dispatchResult && (
          <Card
            className={
              dispatchResult.success
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }
          >
            <CardContent className="p-4">
              {dispatchResult.success ? (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-800">
                      Dispatch Successful
                    </p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Ambulance en route to {dispatchResult.dispatch.hospital_name}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      ETA: {dispatchResult.dispatch.eta} minutes
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-800">Dispatch Failed</p>
                    <p className="text-sm text-rose-700 mt-1">
                      {dispatchResult.error}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={dispatching}>
            Cancel
          </Button>
          <Button
            onClick={handleDispatch}
            disabled={!selectedHospital || dispatching || !dispatchResult?.success && dispatchResult}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {dispatching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Dispatching...
              </>
            ) : (
              <>
                <Ambulance className="w-4 h-4 mr-2" />
                Confirm Dispatch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
