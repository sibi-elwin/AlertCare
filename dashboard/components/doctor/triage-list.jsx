"use client";

import { TrendingDown, TrendingUp, Minus, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStatusCategory, getSmartBurstStatus } from "@/lib/healthcare-data";

function TrendIcon({ trend }) {
  if (trend === "down") {
    return <TrendingDown className="w-4 h-4 text-rose-600" />;
  }
  if (trend === "up") {
    return <TrendingUp className="w-4 h-4 text-emerald-600" />;
  }
  return <Minus className="w-4 h-4 text-slate-400" />;
}

function StabilityBar({ value, news2Score }) {
  const getColor = () => {
    if (news2Score === 3 || value === 0) return "bg-rose-600";
    if (news2Score === 2 || value < 70) return "bg-amber-500";
    if (news2Score === 1) return "bg-yellow-500";
    return "bg-emerald-600";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function TriageList({ patients, onSelectPatient, selectedPatientId }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="font-semibold">Patient</TableHead>
            <TableHead className="font-semibold">NEWS2</TableHead>
            <TableHead className="font-semibold">Stability Index</TableHead>
            <TableHead className="font-semibold">Trend</TableHead>
            <TableHead className="font-semibold">Sector</TableHead>
            <TableHead className="font-semibold">Sync Mode</TableHead>
            <TableHead className="font-semibold text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => {
            const status = getStatusCategory(patient.stabilityIndex, patient.news2Score);
            const burstStatus = getSmartBurstStatus(patient.stabilityIndex);
            const isCritical = patient.news2Score === 3;

            return (
              <TableRow
                key={patient.id}
                className={`
                  cursor-pointer transition-colors
                  ${isCritical ? "critical-row" : "hover:bg-slate-50"}
                  ${selectedPatientId === patient.id ? "bg-indigo-50 hover:bg-indigo-50" : ""}
                `}
                onClick={() => onSelectPatient(patient)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {patient.name}
                        </span>
                        {isCritical && (
                          <Badge className="bg-rose-600 text-white text-[10px] px-1.5 py-0">
                            CRITICAL OVERRIDE
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {patient.condition} · {patient.age}y
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={patient.news2Score === 0 ? "outline" : "secondary"}
                    className={
                      patient.news2Score === 3
                        ? "bg-rose-600 text-white border-rose-600"
                        : patient.news2Score === 2
                          ? "bg-amber-500 text-white border-amber-500"
                          : patient.news2Score === 1
                            ? "bg-yellow-400 text-yellow-900 border-yellow-400"
                            : ""
                    }
                  >
                    {patient.news2Score}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StabilityBar
                    value={patient.stabilityIndex}
                    news2Score={patient.news2Score}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={patient.trend} />
                    <span className="text-xs text-muted-foreground capitalize">
                      {patient.trend}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{patient.sector}</span>
                </TableCell>
                <TableCell>
                  <div
                    className={`
                    inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
                    ${
                      burstStatus.mode === "emergency"
                        ? "bg-rose-100 text-rose-700 emergency-pulse"
                        : "bg-emerald-100 text-emerald-700"
                    }
                  `}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        burstStatus.mode === "emergency"
                          ? "bg-rose-600"
                          : "bg-emerald-600"
                      }`}
                    />
                    {burstStatus.interval}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={isCritical ? "destructive" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPatient(patient);
                    }}
                  >
                    {isCritical ? (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Urgent
                      </>
                    ) : (
                      "View"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
