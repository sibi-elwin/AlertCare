"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const Waveform = () => {
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    // Generate initial points
    const initialPoints = Array.from({ length: 40 }, (_, i) => 
      50 + Math.sin(i * 0.5) * 20
    );
    setPoints(initialPoints);

    const interval = setInterval(() => {
      setPoints((prev) => {
        const next = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        // Subtle destabilization logic
        const noise = (Math.random() - 0.5) * 5;
        const trend = Math.sin(Date.now() * 0.001) * 2;
        next.push(Math.max(10, Math.min(90, last + noise + trend)));
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-64 flex items-end justify-between gap-1 overflow-hidden">
      {points.map((p, i) => (
        <motion.div
          key={i}
          className="w-full bg-gradient-to-t from-primary/40 to-primary rounded-full"
          animate={{ height: `${p}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
    </div>
  );
};
