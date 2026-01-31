"use client";

import { useState } from "react";
import { MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getPhoneNumber, schedulePeriodicSMS } from "@/lib/sms-service";

export function SMSNotificationButton({ patient }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const phoneData = getPhoneNumber(patient.id);

  const handleSendSMS = async () => {
    setSending(true);
    setResult(null);

    try {
      const result = await schedulePeriodicSMS(patient, patient.vitals);
      setResult(result);
      
      if (result.success) {
        setTimeout(() => {
          setOpen(false);
          setResult(null);
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error.message || 'Failed to send SMS',
      });
    } finally {
      setSending(false);
    }
  };

  if (!phoneData) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full border-slate-300 text-slate-500"
        disabled
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        No Phone Registered
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Send SMS Update
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Send SMS Notification
            </AlertDialogTitle>
            <AlertDialogDescription>
              Send a health update SMS to {phoneData.caretaker} at {phoneData.phone}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-3">
            <div className="p-3 rounded-lg border bg-card">
              <p className="text-sm font-medium text-foreground mb-2">Patient: {patient.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Stability Index: {patient.stabilityIndex}</span>
                <span>•</span>
                <span>NEWS2: {patient.news2Score}</span>
              </div>
            </div>

            {result && (
              <div
                className={`p-3 rounded-lg border ${
                  result.success
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-rose-50 border-rose-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span
                    className={`text-sm ${
                      result.success ? "text-emerald-800" : "text-rose-800"
                    }`}
                  >
                    {result.success
                      ? "SMS sent successfully!"
                      : result.error || "Failed to send SMS"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendSMS}
              disabled={sending || result?.success}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : result?.success ? (
                "Sent"
              ) : (
                "Send SMS"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
