"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User, Activity } from "lucide-react";
import Link from "next/link";

export const RoleEntry = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ y: -10 }}
            className="glass p-12 rounded-[2rem] text-center group"
          >
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Patient Dashboard</h3>
            <p className="text-muted-foreground mb-10 leading-relaxed">
              Access your stability scores, view trends, and receive guidance from your care team.
            </p>
            <Button size="lg" className="rounded-full px-10 w-full bg-primary text-primary-foreground" asChild>
              <Link href="/auth?role=patient">Enter as Patient</Link>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ y: -10 }}
            className="glass p-12 rounded-[2rem] text-center group"
          >
            <div className="h-20 w-20 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
              <Activity className="h-10 w-10 text-teal-500" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Caregiver Dashboard</h3>
            <p className="text-muted-foreground mb-10 leading-relaxed">
              Monitor multiple patients, analyze stability trajectories, and provide clinical guidance.
            </p>
            <Button size="lg" variant="outline" className="rounded-full px-10 w-full border-white/10 hover:bg-white/5" asChild>
              <Link href="/auth?role=caregiver">Enter as Caregiver</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
