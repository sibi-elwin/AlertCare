"use client";

import { Ambulance, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DispatchTracker() {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-600" />
          Live Dispatch Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* SVG Map Grid */}
        <div className="relative bg-slate-100 rounded-lg p-4 overflow-hidden">
          <svg
            viewBox="0 0 200 150"
            className="w-full h-32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid Lines */}
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path
                  d="M 25 0 L 0 0 0 25"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="200" height="150" fill="url(#grid)" />

            {/* Sector Labels */}
            <text x="25" y="30" fontSize="8" fill="#64748b" fontWeight="500">
              Sector A
            </text>
            <text x="125" y="30" fontSize="8" fill="#64748b" fontWeight="500">
              Sector B
            </text>
            <text x="25" y="105" fontSize="8" fill="#64748b" fontWeight="500">
              Sector C
            </text>
            <text x="125" y="105" fontSize="8" fill="#64748b" fontWeight="500">
              Sector D
            </text>

            {/* Sector Dividers */}
            <line x1="100" y1="0" x2="100" y2="150" stroke="#94a3b8" strokeWidth="1" />
            <line x1="0" y1="75" x2="200" y2="75" stroke="#94a3b8" strokeWidth="1" />

            {/* Hospital Marker */}
            <circle cx="50" cy="75" r="6" fill="#6366f1" />
            <text x="50" y="90" fontSize="6" fill="#6366f1" textAnchor="middle">
              Hospital
            </text>

            {/* Alert Location (Sector B) */}
            <circle cx="150" cy="50" r="8" fill="#fef2f2" stroke="#f43f5e" strokeWidth="2">
              <animate
                attributeName="r"
                values="8;12;8"
                dur="1.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;0.5;1"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="150" cy="50" r="3" fill="#f43f5e" />

            {/* Ambulance Path */}
            <path
              d="M 50 75 Q 80 65 100 60 T 150 50"
              stroke="#6366f1"
              strokeWidth="2"
              strokeDasharray="4 2"
              fill="none"
            />

            {/* Animated Ambulance */}
            <g className="ambulance-icon">
              <animateMotion
                dur="8s"
                repeatCount="indefinite"
                path="M 50 75 Q 80 65 100 60 T 150 50"
              />
              <rect x="-8" y="-5" width="16" height="10" rx="2" fill="#f43f5e" />
              <rect x="-5" y="-3" width="3" height="3" fill="white" />
              <circle cx="-5" cy="5" r="2" fill="#1e293b" />
              <circle cx="5" cy="5" r="2" fill="#1e293b" />
            </g>
          </svg>

          {/* Dispatch Info */}
          <div className="mt-3 p-2 bg-white rounded border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ambulance className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-medium text-foreground">AMB-07</span>
              </div>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                En Route
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>Sector B - Robert Chen</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>ETA: 8 min</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
