"use client";

import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-xs text-slate-500 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-medium text-slate-900">
              {entry.value.toFixed(1)}
              {entry.name === "SpO2" ? "%" : entry.name === "Heart Rate" ? " bpm" : ""}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function VitalsChart({ data }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="lstmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            domain={[40, 160]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            domain={[80, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* LSTM Reconstruction Error - "Shadow Area" for Silent Deterioration Risk */}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="lstmError"
            name="LSTM Deviation"
            fill="url(#lstmGradient)"
            stroke="#6366f1"
            strokeWidth={1}
            strokeOpacity={0.5}
            fillOpacity={1}
          />
          
          {/* Heart Rate Line */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="heartRate"
            name="Heart Rate"
            stroke="#f43f5e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#f43f5e" }}
          />
          
          {/* SpO2 Line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="spo2"
            name="SpO2"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#10b981" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
