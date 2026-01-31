"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Bell, BellOff, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getPhoneNumber,
  getSMSPreferences,
  setSMSPreferences,
  getSMSHistory,
} from "@/lib/sms-service";

export function SMSSettings({ patient }) {
  const [phoneData, setPhoneData] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [smsHistory, setSmsHistory] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [patient.id]);

  const loadData = () => {
    const phone = getPhoneNumber(patient.id);
    const prefs = getSMSPreferences(patient.id);
    const history = getSMSHistory(patient.id, 5);
    
    setPhoneData(phone);
    setPreferences(prefs);
    setSmsHistory(history);
  };

  const handleToggleEnabled = async (enabled) => {
    const newPrefs = { ...preferences, enabled };
    setPreferences(newPrefs);
    setSMSPreferences(patient.id, newPrefs);
  };

  const handleFrequencyChange = async (frequency) => {
    const newPrefs = { ...preferences, frequency };
    setPreferences(newPrefs);
    setSMSPreferences(patient.id, newPrefs);
  };

  const handleAlertToggle = async (type, value) => {
    const newPrefs = { ...preferences, [type]: value };
    setPreferences(newPrefs);
    setSMSPreferences(patient.id, newPrefs);
  };

  if (!phoneData) {
    return null; // Phone not registered yet
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          SMS Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Registered Phone */}
        <div className="p-3 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Registered Phone</p>
              <p className="text-sm text-muted-foreground">{phoneData.phone}</p>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Active
            </Badge>
          </div>
        </div>

        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            {preferences?.enabled ? (
              <Bell className="w-5 h-5 text-emerald-600" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <Label htmlFor="sms-enabled" className="font-medium">
                Enable SMS Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive periodic health updates via SMS
              </p>
            </div>
          </div>
          <Switch
            id="sms-enabled"
            checked={preferences?.enabled || false}
            onCheckedChange={handleToggleEnabled}
          />
        </div>

        {preferences?.enabled && (
          <>
            {/* Frequency */}
            <div className="space-y-2">
              <Label>Update Frequency</Label>
              <Select
                value={preferences?.frequency || 'daily'}
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">
                    Real-time (all updates)
                  </SelectItem>
                  <SelectItem value="daily">Daily Summary</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {preferences?.frequency === 'realtime' && 'Get notified for every vital entry'}
                {preferences?.frequency === 'daily' && 'Receive one summary per day'}
                {preferences?.frequency === 'weekly' && 'Receive one summary per week'}
              </p>
            </div>

            {/* Alert Preferences */}
            <div className="space-y-3 p-3 rounded-lg border bg-card">
              <Label className="text-sm font-semibold">Alert Preferences</Label>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="alert-critical" className="text-sm">
                    Critical Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Always notify for critical conditions
                  </p>
                </div>
                <Switch
                  id="alert-critical"
                  checked={preferences?.alertOnCritical ?? true}
                  onCheckedChange={(checked) => handleAlertToggle('alertOnCritical', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="alert-warning" className="text-sm">
                    Warning Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notify for warning conditions
                  </p>
                </div>
                <Switch
                  id="alert-warning"
                  checked={preferences?.alertOnWarning ?? false}
                  onCheckedChange={(checked) => handleAlertToggle('alertOnWarning', checked)}
                />
              </div>
            </div>

            {/* SMS History */}
            {smsHistory.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Recent Messages</Label>
                <div className="space-y-2">
                  {smsHistory.map((sms, index) => (
                    <div
                      key={index}
                      className="p-2 rounded border bg-slate-50 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-muted-foreground">
                          {new Date(sms.sentAt).toLocaleString()}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          Sent
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Message ID: {sms.messageId}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <Alert className="border-slate-200 bg-slate-50">
          <AlertDescription className="text-xs text-muted-foreground">
            SMS notifications are sent automatically based on your preferences. 
            Reply STOP to any message to unsubscribe.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
