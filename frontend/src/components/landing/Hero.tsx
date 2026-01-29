"use client";

import { motion } from "framer-motion";
import { Waveform } from "./Waveform";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { useState, useEffect } from "react";

export const Hero = () => {
  const [score, setScore] = useState(92);

  useEffect(() => {
    const interval = setInterval(() => {
      setScore((prev) => {
        const drift = Math.random() > 0.7 ? -1 : 0.2;
        return Math.max(60, Math.min(98, prev + drift));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-screen flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.05),transparent)] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-4xl mx-auto"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Detect loss of stability <br />
          <span className="text-gradient">before health fails.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Silent Deterioration Detector uses temporal intelligence to monitor 
          stability trajectories, providing a calm authority in health management.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium" asChild>
            <Link href="/auth?role=patient">For Patients</Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 border-white/10 hover:bg-white/5 text-foreground font-medium" asChild>
            <Link href="/auth?role=caregiver">For Caregivers</Link>
          </Button>
          <Button variant="ghost" className="rounded-full px-8 text-muted-foreground hover:text-foreground">
            View How It Works
          </Button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="w-full max-w-5xl mx-auto glass rounded-3xl p-8 md:p-12 relative"
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-mono text-primary uppercase tracking-widest">Live Stability Trajectory</span>
            </div>
            <div className="text-6xl md:text-8xl font-mono font-bold mb-2">
              <NumberFlow value={score} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
            </div>
            <p className="text-muted-foreground">Health Stability Score (HSS)</p>
          </div>
          <div className="h-64 flex items-end">
            <Waveform />
          </div>
        </div>
      </motion.div>
    </section>
  );
};
