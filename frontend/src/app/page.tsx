import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Insight } from "@/components/landing/Insight";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Trust } from "@/components/landing/Trust";
import { RoleEntry } from "@/components/landing/RoleEntry";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <Hero />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <Insight />
      <div id="trust">
        <Trust />
      </div>
      <RoleEntry />
      
      <footer className="py-12 px-6 border-t border-white/5 text-center text-muted-foreground text-sm">
        <p>© 2026 Silent Deterioration Detector. All rights reserved.</p>
        <p className="mt-2 font-mono uppercase tracking-widest text-[10px] opacity-50">Predictive Intelligence for Health Stability</p>
      </footer>
    </main>
  );
}
