"use client";

import { motion } from "framer-motion";
import { Activity, Clock, BarChart3 } from "lucide-react";

const steps = [
  {
    title: "Continuous Sensing",
    description: "Background monitoring of physiological rhythms without intrusive interaction.",
    icon: Activity,
    delay: 0.1,
  },
  {
    title: "Temporal Intelligence",
    description: "AI models that understand time-series data and health trajectories.",
    icon: Clock,
    delay: 0.2,
  },
  {
    title: "Stability Scoring",
    description: "Clear, non-alarming scores that indicate your body's resilience.",
    icon: BarChart3,
    delay: 0.3,
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-20">How SDD Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: step.delay, duration: 0.5 }}
              className="glass p-8 rounded-3xl hover:bg-white/5 transition-colors group"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
