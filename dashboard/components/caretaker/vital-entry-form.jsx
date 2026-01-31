"use client";

import { useState, useEffect } from "react";
import { Heart, Activity, Beaker, Send, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchHealthConnectVitals } from "@/lib/health-connect";

function VitalInput({ icon: Icon, label, name, value, onChange, unit, min, max, step = 1 }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-2 text-sm font-medium">
        <Icon className="w-4 h-4 text-indigo-600" />
        {label}
      </Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type="number"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          className="h-14 text-xl font-semibold pr-16 text-center"
          required
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {unit}
        </span>
      </div>
    </div>
  );
}

export function VitalEntryForm({ onSubmit, wearableVitals = null, patientId = null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vitals, setVitals] = useState({
    heartRate: "",
    systolicBP: "",
    glucose: "",
    activity: "",
  });
  const [dataSource, setDataSource] = useState(null); // 'wearable', 'manual', or 'merged'

  // Auto-fill from wearable data when available (only once when wearable data first arrives)
  useEffect(() => {
    if (wearableVitals && !vitals.heartRate && !vitals.systolicBP && !vitals.glucose && !vitals.activity) {
      setVitals({
        heartRate: wearableVitals.heartRate?.toString() || "",
        systolicBP: wearableVitals.bloodPressure?.toString() || "",
        glucose: wearableVitals.bloodGlucose?.toString() || "",
        activity: wearableVitals.activity?.toString() || "",
      });
      setDataSource('wearable');
    }
  }, [wearableVitals]);

  const handleLoadWearableData = async () => {
    if (!patientId) return;
    
    try {
      const wearableData = await fetchHealthConnectVitals(patientId);
      setVitals({
        heartRate: wearableData.heartRate?.toString() || "",
        systolicBP: wearableData.bloodPressure?.toString() || "",
        glucose: wearableData.bloodGlucose?.toString() || "",
        activity: wearableData.activity?.toString() || "",
      });
      setDataSource('wearable');
    } catch (error) {
      console.error('Error loading wearable data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVitals((prev) => ({ ...prev, [name]: value }));
    // Mark as manual if user edits
    if (value && dataSource === 'wearable') {
      setDataSource('merged');
    } else if (value && !dataSource) {
      setDataSource('manual');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    const manualVitals = {
      heartRate: parseInt(vitals.heartRate),
      systolicBP: parseInt(vitals.systolicBP),
      glucose: parseInt(vitals.glucose),
      activity: parseFloat(vitals.activity) || null,
    };

    onSubmit(manualVitals);

    setIsSubmitting(false);
    // Reset form
    setVitals({
      heartRate: "",
      systolicBP: "",
      glucose: "",
      activity: "",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Record Vitals</CardTitle>
          {wearableVitals && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadWearableData}
              className="h-8"
            >
              <Download className="w-3 h-3 mr-1" />
              Load Wearable Data
            </Button>
          )}
        </div>
        {dataSource && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {dataSource === 'wearable' && '📱 Wearable Data'}
              {dataSource === 'manual' && '✍️ Manual Entry'}
              {dataSource === 'merged' && '🔄 Merged (Wearable + Manual)'}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <VitalInput
              icon={Heart}
              label="Heart Rate"
              name="heartRate"
              value={vitals.heartRate}
              onChange={handleChange}
              unit="bpm"
              min={30}
              max={200}
            />
            <VitalInput
              icon={Activity}
              label="Systolic BP"
              name="systolicBP"
              value={vitals.systolicBP}
              onChange={handleChange}
              unit="mmHg"
              min={60}
              max={250}
            />
            <VitalInput
              icon={Beaker}
              label="Blood Glucose"
              name="glucose"
              value={vitals.glucose}
              onChange={handleChange}
              unit="mg/dL"
              min={40}
              max={500}
            />
            <VitalInput
              icon={Activity}
              label="Activity Level"
              name="activity"
              value={vitals.activity}
              onChange={handleChange}
              unit="steps/hr"
              min={0}
              max={500}
              step={1}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Syncing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Submit Vitals
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
