"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export const Insight = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const pathLength = useTransform(scrollYProgress, [0.2, 0.8], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);

  return (
    <section ref={containerRef} className="py-32 px-6 bg-black/20">
      <motion.div style={{ opacity }} className="max-w-4xl mx-auto text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Stability vs. Thresholds</h2>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Traditional vitals only alert you when a threshold is crossed. 
          SDD monitors the <span className="text-primary italic">pattern of variation</span>, 
          detecting instability weeks before a crisis.
        </p>
      </motion.div>

      <div className="max-w-5xl mx-auto relative h-[400px] glass rounded-3xl overflow-hidden p-8">
        <svg className="w-full h-full" viewBox="0 0 1000 400" fill="none">
          {/* Background Grid */}
          <line x1="0" y1="100" x2="1000" y2="100" stroke="white" strokeOpacity="0.05" strokeDasharray="4 4" />
          <line x1="0" y1="200" x2="1000" y2="200" stroke="white" strokeOpacity="0.05" strokeDasharray="4 4" />
          <line x1="0" y1="300" x2="1000" y2="300" stroke="white" strokeOpacity="0.05" strokeDasharray="4 4" />
          
          {/* Stability Line */}
          <motion.path
            d="M 0 200 Q 125 180 250 200 T 500 200 T 750 250 T 1000 350"
            stroke="url(#gradient)"
            strokeWidth="4"
            fill="none"
            style={{ pathLength }}
          />
          
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="50%" stopColor="var(--primary)" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute bottom-8 left-8 flex gap-12">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm font-medium">Stable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-sm font-medium">Unstable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium">Intervention Point</span>
          </div>
        </div>
      </div>
    </section>
  );
};
