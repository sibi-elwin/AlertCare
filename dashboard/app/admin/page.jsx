"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, AlertTriangle, CheckCircle2, X, Radio, Wifi, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchLiveResourceData, getManualOverride, setManualOverride, clearManualOverride } from "@/lib/logistics-bridge";

const hospitals = [
  { id: 'hosp-001', name: 'Main Regional Hospital' },
  { id: 'hosp-002', name: 'Rural Clinic A' },
  { id: 'hosp-003', name: 'Rural Clinic B' },
  { id: 'hosp-004', name: 'Emergency Care Center' },
];

export default function AdminPanel() {
  const [hospitalResources, setHospitalResources] = useState({});
  const [loading, setLoading] = useState(true);
  const [overrideDialog, setOverrideDialog] = useState({ open: false, hospital: null });
  const [overrideForm, setOverrideForm] = useState({
    allow_dispatch: true,
    reason: '',
  });

  useEffect(() => {
    loadAllResources();
    const interval = setInterval(loadAllResources, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAllResources = async () => {
    setLoading(true);
    const resources = {};
    for (const hospital of hospitals) {
      try {
        const data = await fetchLiveResourceData(hospital.id);
        resources[hospital.id] = data;
      } catch (error) {
        console.error(`Error loading ${hospital.id}:`, error);
      }
    }
    setHospitalResources(resources);
    setLoading(false);
  };

  const handleOpenOverride = (hospitalId) => {
    const currentOverride = getManualOverride(hospitalId);
    setOverrideForm({
      allow_dispatch: currentOverride?.allow_dispatch ?? true,
      reason: currentOverride?.reason || '',
    });
    setOverrideDialog({ open: true, hospital: hospitalId });
  };

  const handleSaveOverride = () => {
    if (!overrideDialog.hospital) return;

    setManualOverride(overrideDialog.hospital, {
      active: true,
      allow_dispatch: overrideForm.allow_dispatch,
      reason: overrideForm.reason,
      set_by: 'admin',
    });

    // Reload resources to show updated override
    loadAllResources();
    setOverrideDialog({ open: false, hospital: null });
    setOverrideForm({ allow_dispatch: true, reason: '' });
  };

  const handleClearOverride = (hospitalId) => {
    clearManualOverride(hospitalId);
    loadAllResources();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Hospital Admin Panel
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manual Override Control - "Red Phone" Emergency System
                </p>
              </div>
            </div>
            <Button onClick={loadAllResources} variant="outline">
              <Wifi className="w-4 h-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </div>
      </header>

      {/* Alert Banner */}
      <div className="container mx-auto px-4 py-4">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Emergency Override System:</strong> Use this panel only when automated systems
            are unavailable or when local conditions require manual intervention. Overrides bypass
            ADT and IoT sensor data.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading && Object.keys(hospitalResources).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading hospital resources...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {hospitals.map((hospital) => {
              const resources = hospitalResources[hospital.id];
              const override = resources?.manual_override;

              return (
                <Card key={hospital.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        {hospital.name}
                      </CardTitle>
                      {override?.active && (
                        <Badge variant="destructive" className="text-xs">
                          Override Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Current Resources */}
                    {resources && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg border bg-card">
                            <p className="text-xs text-muted-foreground mb-1">ICU Beds</p>
                            <p className="text-xl font-bold text-foreground">
                              {resources.icu_beds_free}/{resources.icu_beds_total}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              ADT System
                            </p>
                          </div>
                          <div className="p-3 rounded-lg border bg-card">
                            <p className="text-xs text-muted-foreground mb-1">Oxygen</p>
                            <p className="text-xl font-bold text-foreground">
                              {resources.oxygen_psi} PSI
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              IoT Sensor
                            </p>
                          </div>
                        </div>

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

                        {/* Override Status */}
                        {override?.active && (
                          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span className="text-sm font-semibold text-amber-800">
                                  Manual Override Active
                                </span>
                              </div>
                              <Badge
                                variant={override.allow_dispatch ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {override.allow_dispatch ? "Allow Dispatch" : "Block Dispatch"}
                              </Badge>
                            </div>
                            {override.reason && (
                              <p className="text-xs text-amber-700 mt-1">{override.reason}</p>
                            )}
                            <p className="text-[10px] text-amber-600 mt-2">
                              Set by {override.set_by} at{' '}
                              {new Date(override.set_at).toLocaleString()}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                              onClick={() => handleClearOverride(hospital.id)}
                            >
                              <X className="w-3 h-3 mr-2" />
                              Clear Override
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Override Button */}
                    <Button
                      variant={override?.active ? "outline" : "default"}
                      className="w-full"
                      onClick={() => handleOpenOverride(hospital.id)}
                    >
                      {override?.active ? (
                        <>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Modify Override
                        </>
                      ) : (
                        <>
                          <Radio className="w-4 h-4 mr-2" />
                          Set Manual Override
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Override Dialog */}
      <Dialog
        open={overrideDialog.open}
        onOpenChange={(open) => setOverrideDialog({ open, hospital: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Manual Override - "Red Phone" System
            </DialogTitle>
            <DialogDescription>
              Override automated systems for {overrideDialog.hospital && hospitals.find(h => h.id === overrideDialog.hospital)?.name}.
              This will bypass ADT and IoT sensor data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Override Action</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="allow_dispatch"
                    checked={overrideForm.allow_dispatch === true}
                    onChange={() => setOverrideForm({ ...overrideForm, allow_dispatch: true })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Allow Dispatch</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="allow_dispatch"
                    checked={overrideForm.allow_dispatch === false}
                    onChange={() => setOverrideForm({ ...overrideForm, allow_dispatch: false })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Block Dispatch</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Override *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Local disaster, system maintenance, temporary closure..."
                value={overrideForm.reason}
                onChange={(e) =>
                  setOverrideForm({ ...overrideForm, reason: e.target.value })
                }
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                Required: Explain why automated systems are being bypassed
              </p>
            </div>

            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-xs">
                This override will immediately affect all dispatch decisions for this hospital.
                Remember to clear the override when normal operations resume.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOverrideDialog({ open: false, hospital: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveOverride}
              disabled={!overrideForm.reason.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Activate Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
