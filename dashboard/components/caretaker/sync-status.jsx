"use client";

import { CheckCircle2, AlertTriangle, Wifi } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SyncStatus({ status }) {
  const isPowerSave = status.mode === "power-save";

  return (
    <Card
      className={`
      border-2 transition-all
      ${isPowerSave ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}
    `}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`
            w-10 h-10 rounded-full flex items-center justify-center shrink-0
            ${isPowerSave ? "bg-emerald-100" : "bg-rose-100"}
          `}
          >
            {isPowerSave ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 emergency-pulse" />
            )}
          </div>

          <div className="flex-1">
            <h3
              className={`font-semibold ${isPowerSave ? "text-emerald-800" : "text-rose-800"}`}
            >
              {isPowerSave ? "System Optimized" : "Emergency Mode Active"}
            </h3>
            <p
              className={`text-sm mt-1 ${isPowerSave ? "text-emerald-700" : "text-rose-700"}`}
            >
              {isPowerSave
                ? "Patient vitals are stable. Power-saving mode engaged."
                : "Patient requires close monitoring. Real-time streaming enabled."}
            </p>

            <div
              className={`
              mt-3 flex items-center gap-2 text-sm font-medium
              ${isPowerSave ? "text-emerald-600" : "text-rose-600"}
            `}
            >
              <Wifi className={`w-4 h-4 ${!isPowerSave && "emergency-pulse"}`} />
              <span>Next sync: {status.nextSync}</span>
            </div>
          </div>
        </div>

        {/* Stability Index Display */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Stability Index</span>
            <span
              className={`text-2xl font-bold ${isPowerSave ? "text-emerald-600" : "text-rose-600"}`}
            >
              {status.stabilityIndex}
            </span>
          </div>
          <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${isPowerSave ? "bg-emerald-500" : "bg-rose-500"}`}
              style={{ width: `${status.stabilityIndex}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
