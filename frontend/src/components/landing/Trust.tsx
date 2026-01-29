"use client";

import { motion } from "framer-motion";
import { Shield, Eye, Cpu, MessageSquare } from "lucide-react";

const ethics = [
  { title: "Privacy-First", description: "All data is encrypted and anonymized.", icon: Shield },
  { title: "Non-Diagnostic", description: "Stability indicators, not medical prescriptions.", icon: Eye },
  { title: "Federated Intelligence", description: "Learning patterns without compromising identity.", icon: Cpu },
  { title: "Explainable Scores", description: "Transparency behind every stability metric.", icon: MessageSquare },
];

export const Trust = () => {
  return (
    <section className="py-32 px-6 bg-black/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-6">Trust & Ethics</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Clinical-grade intelligence built with human-centric safeguards.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {ethics.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 border-l border-white/10"
            >
              <item.icon className="h-6 w-6 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
