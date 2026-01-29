"use client";

import { motion } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, TrendingUp, MessageSquare, User, HelpCircle, 
  RefreshCcw, ChevronRight, AlertCircle, Info 
} from "lucide-react";
import Link from "next/link";

const data = [
  { day: "01", score: 92 },
  { day: "05", score: 94 },
  { day: "10", score: 88 },
  { day: "15", score: 85 },
  { day: "20", score: 78 },
  { day: "25", score: 82 },
  { day: "30", score: 84 },
];

export default function PatientDashboard() {
  const stabilityScore = 84.2;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Side Navigation */}
      <nav className="w-24 md:w-64 border-r border-white/5 flex flex-col items-center md:items-start p-6 gap-8">
        <Link href="/" className="flex items-center gap-3 px-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-teal-500" />
          <span className="hidden md:block text-2xl font-bold tracking-tight">SDD</span>
        </Link>
        
        <div className="flex flex-col gap-2 w-full">
          {[
            { icon: LayoutDashboard, label: "Overview", active: true },
            { icon: TrendingUp, label: "Trends" },
            { icon: MessageSquare, label: "Guidance" },
            { icon: User, label: "Profile" },
            { icon: HelpCircle, label: "Help" },
          ].map((item, i) => (
            <button
              key={i}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="hidden md:block font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, John</h1>
            <p className="text-muted-foreground">Your body&apos;s stability is recovering well.</p>
          </div>
          <Button variant="outline" className="rounded-full gap-2 border-white/10">
            <RefreshCcw className="h-4 w-4" />
            Sync Wearable
          </Button>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Primary Score Element */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 glass rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-12"
          >
            <div className="relative h-64 w-64 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-white/5"
                />
                <motion.circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="url(#score-gradient)"
                  strokeWidth="12"
                  strokeDasharray="690"
                  initial={{ strokeDashoffset: 690 }}
                  animate={{ strokeDashoffset: 690 - (690 * (stabilityScore / 100)) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  fill="transparent"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-7xl font-mono font-bold">{stabilityScore.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Stability</span>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-4">Your body&apos;s stability over time</h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                A higher score indicates consistent physiological rhythms. Your score has improved by 6% over the last 5 days.
              </p>
              <div className="flex gap-4">
                <div className="glass px-4 py-2 rounded-lg text-xs font-medium border-primary/20 text-primary uppercase tracking-tighter">Stability Rising</div>
                <div className="glass px-4 py-2 rounded-lg text-xs font-medium border-white/10 text-muted-foreground uppercase tracking-tighter">Normal Variability</div>
              </div>
            </div>
          </motion.div>

          {/* Recommendations Panel */}
          <div className="space-y-8">
            <div className="glass rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">Care Team Guidance</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-sm font-medium mb-1">Increase evening rest consistency</p>
                  <p className="text-xs text-muted-foreground">Suggested by Dr. Aris</p>
                  <Button size="sm" variant="ghost" className="mt-2 h-8 px-3 rounded-lg text-xs">Acknowledge</Button>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-sm font-medium mb-1">Monitor hydration today</p>
                  <p className="text-xs text-muted-foreground">Stability indicator signal</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Info className="h-6 w-6 text-teal-400" />
                <h3 className="text-xl font-bold">What changed recently?</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your sleep onset variability decreased by 14 minutes, contributing to a more stable circadian rhythm.
              </p>
            </div>
          </div>

          {/* Trend Graph */}
          <div className="lg:col-span-3 glass rounded-[2.5rem] p-8 md:p-12">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-bold">30-Day Stability Trajectory</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="rounded-full px-4 bg-white/5">Daily</Button>
                <Button variant="ghost" size="sm" className="rounded-full px-4 text-muted-foreground">Weekly</Button>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  />
                  <YAxis 
                    hide
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="var(--primary)" 
                    strokeWidth={4} 
                    dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
