"use client";

import { CheckCircle2, Clock, Heart, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EntryLog({ entries }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Recent Entries
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No entries recorded yet
          </p>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 5).map((entry, index) => (
              <div
                key={entry.id}
                className={`
                  p-3 rounded-lg border transition-all
                  ${index === 0 && !entry.synced ? "bg-amber-50 border-amber-200" : "bg-card border-border"}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {formatTime(entry.timestamp)}
                  </span>
                  {entry.synced ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />
                      Synced
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      Syncing...
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500" />
                    <span className="font-medium">{entry.vitals.heartRate}</span>
                    <span className="text-muted-foreground text-xs">bpm</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-emerald-500" />
                    <span className="font-medium">{entry.vitals.spo2}</span>
                    <span className="text-muted-foreground text-xs">%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{entry.vitals.systolicBP}</span>
                    <span className="text-muted-foreground text-xs">mmHg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
