"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-background/50 border-b border-white/5"
    >
      <Link href="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-teal-500" />
        <span className="text-xl font-bold tracking-tight">SDD</span>
      </Link>
      
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
        <Link href="#trust" className="hover:text-foreground transition-colors">Trust</Link>
        <Link href="#about" className="hover:text-foreground transition-colors">About</Link>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" className="rounded-full px-5 text-sm font-medium" asChild>
          <Link href="/auth?role=caregiver">Caregiver Login</Link>
        </Button>
        <Button className="rounded-full px-6 bg-primary text-primary-foreground font-medium" asChild>
          <Link href="/auth?role=patient">Patient Access</Link>
        </Button>
      </div>
    </motion.nav>
  );
};
