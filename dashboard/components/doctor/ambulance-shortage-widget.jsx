"use client";

import { AlertTriangle, Ambulance } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { predictAmbulanceShortages } from "@/lib/healthcare-data";

export function AmbulanceShortageWidget({ patients }) {
  const shortages = predictAmbulanceShortages(patients);

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Ambulance className="w-4 h-4 text-indigo-600" />
          Predicted Shortages
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {shortages.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-100 flex items-center justify-center">
              <Ambulance className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              No predicted shortages
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shortages.map((shortage) => (
              <div
                key={shortage.sector}
                className={`
                  p-3 rounded-lg border
                  ${shortage.severity === "high" ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">
                    {shortage.sector}
                  </span>
                  <Badge
                    variant={shortage.severity === "high" ? "destructive" : "secondary"}
                    className={
                      shortage.severity === "high"
                        ? "bg-rose-600 text-white"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {shortage.severity === "high" ? "High Risk" : "Moderate"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{shortage.patientsAtRisk} patients trending down</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
