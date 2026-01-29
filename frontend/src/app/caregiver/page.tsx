"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Filter, ArrowUpRight, ArrowDownRight, 
  Minus, Activity, Moon, Heart, Bell, MessageSquare, 
  Flag, ChevronRight, MoreVertical 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import Link from "next/link";

const patients = [
  { id: 1, name: "John Doe", score: 84.2, trend: "up", status: "Stable", age: 72 },
  { id: 2, name: "Sarah Miller", score: 62.5, trend: "down", status: "Declining", age: 78 },
  { id: 3, name: "Robert Wilson", score: 71.8, trend: "down", status: "Watch", age: 81 },
  { id: 4, name: "Eleanor Rigby", score: 91.2, trend: "stable", status: "Stable", age: 69 },
];

const stabilityData = [
  { time: "Mon", sleep: 80, cardio: 85, activity: 70 },
  { time: "Tue", sleep: 75, cardio: 82, activity: 75 },
  { time: "Wed", sleep: 60, cardio: 78, activity: 65 },
  { time: "Thu", sleep: 55, cardio: 70, activity: 50 },
  { time: "Fri", sleep: 40, cardio: 65, activity: 45 },
  { time: "Sat", sleep: 45, cardio: 68, activity: 48 },
  { time: "Sun", sleep: 42, cardio: 62, activity: 40 },
];

export default function CaregiverDashboard() {
  const [selectedPatientId, setSelectedPatientId] = useState(2);
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[1];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Patient List Sidebar */}
      <aside className="w-full md:w-80 lg:w-96 border-r border-white/5 flex flex-col h-screen bg-black/10">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-teal-500" />
            <span className="text-xl font-bold tracking-tight">SDD Care</span>
          </Link>
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              placeholder="Search patients..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Patient List</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Filter className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => setSelectedPatientId(patient.id)}
              className={`w-full text-left p-4 rounded-2xl transition-all group ${
                selectedPatientId === patient.id ? "bg-primary/10 border-primary/20 border" : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">Age: {patient.age}</p>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                  patient.status === 'Stable' ? 'bg-emerald-500/10 text-emerald-400' : 
                  patient.status === 'Declining' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {patient.status}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-bold">{patient.score.toFixed(1)}</span>
                  {patient.trend === "up" && <ArrowUpRight className="h-4 w-4 text-emerald-400" />}
                  {patient.trend === "down" && <ArrowDownRight className="h-4 w-4 text-amber-400" />}
                  {patient.trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      patient.score > 80 ? 'bg-emerald-500' : patient.score > 70 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${patient.score}%` }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Patient Detail View */}
      <main className="flex-1 overflow-y-auto bg-background/50 backdrop-blur-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPatientId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 md:p-10"
          >
            <header className="flex flex-wrap items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center border border-white/10">
                  <span className="text-3xl font-bold text-primary">{selectedPatient.name[0]}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">{selectedPatient.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    Case ID: SDD-2026-0{selectedPatient.id} • Last synced 14m ago
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl gap-2 border-white/10">
                  <Bell className="h-4 w-4" />
                  Alerts
                </Button>
                <Button className="rounded-xl gap-2 bg-primary text-primary-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Send Guidance
                </Button>
                <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Stability Summary Card */}
              <div className="lg:col-span-2 glass rounded-[2.5rem] p-8">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Stability Trajectory</h3>
                    <p className="text-sm text-muted-foreground">Gradual variability increase detected over 14 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-mono font-bold text-gradient">{selectedPatient.score.toFixed(1)}</p>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Confidence: 94%</p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stabilityData}>
                      <defs>
                        <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      />
                      <Area type="monotone" dataKey="sleep" stroke="var(--primary)" fillOpacity={1} fill="url(#colorSleep)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="space-y-6">
                <div className="glass rounded-[2rem] p-6 border-l-4 border-l-amber-500/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Flag className="h-5 w-5 text-amber-400" />
                    <h4 className="font-bold">Risk Identification</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Early signs of circadian disruption. Recommended intervention: Review evening medication timing.
                  </p>
                  <Button size="sm" variant="outline" className="w-full rounded-xl border-white/10 py-5">
                    Flag for Clinical Review
                  </Button>
                </div>

                <div className="glass rounded-[2rem] p-6">
                  <h4 className="font-bold mb-4">Caregiver Notes</h4>
                  <textarea 
                    placeholder="Add clinical observation..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm min-h-[100px] focus:outline-none focus:border-primary/50 mb-3"
                  />
                  <Button size="sm" className="w-full rounded-xl bg-white/10 hover:bg-white/20">Save Note</Button>
                </div>
              </div>

              {/* Decomposition Cards */}
              {[
                { label: "Sleep Rhythm", score: 42, icon: Moon, color: "text-blue-400", bg: "bg-blue-400/10" },
                { label: "Cardio Variability", score: 62, icon: Heart, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                { label: "Activity Consistency", score: 40, icon: Activity, color: "text-amber-400", bg: "bg-amber-400/10" },
              ].map((metric, i) => (
                <div key={i} className="glass rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`h-10 w-10 rounded-xl ${metric.bg} flex items-center justify-center`}>
                      <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    </div>
                    <span className="font-semibold text-sm">{metric.label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-mono font-bold">{metric.score}%</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Stability</span>
                  </div>
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.score}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full ${metric.color.replace('text', 'bg')}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
