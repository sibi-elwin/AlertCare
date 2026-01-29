"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

const AuthContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRole = searchParams.get("role") as "patient" | "caregiver" | null;
  
  const [role, setRole] = useState<"patient" | "caregiver" | null>(initialRole);
  const [step, setStep] = useState(initialRole ? 2 : 1);

  const handleRoleSelect = (selectedRole: "patient" | "caregiver") => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleLogin = () => {
    if (role === "patient") {
      // For first-time patients, go to onboarding. 
      // For now, let's assume first-time.
      router.push("/patient/onboarding");
    } else {
      router.push("/caregiver");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-12 justify-center">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-teal-500" />
          <span className="text-2xl font-bold tracking-tight">SDD</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 md:p-10 rounded-[2.5rem]"
        >
          {step === 1 ? (
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome</h1>
              <p className="text-muted-foreground mb-8">Select your role to continue</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelect("patient")}
                  className="w-full flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Patient</p>
                      <p className="text-sm text-muted-foreground">Monitor your stability</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <button
                  onClick={() => handleRoleSelect("caregiver")}
                  className="w-full flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-teal-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Caregiver</p>
                      <p className="text-sm text-muted-foreground">Manage care stability</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
                onClick={() => setStep(1)}
              >
                ← Back
              </Button>
              <h1 className="text-3xl font-bold mb-2">
                {role === "patient" ? "Patient Access" : "Caregiver Portal"}
              </h1>
              <p className="text-muted-foreground mb-8">
                Secure clinical-grade intelligence
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground ml-1 mb-1.5 block">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-colors"
                    defaultValue={role === "patient" ? "patient@sdd.com" : "clinician@hospital.org"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground ml-1 mb-1.5 block">Access Key</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-colors"
                    defaultValue="password123"
                  />
                </div>
                <Button 
                  onClick={handleLogin}
                  className="w-full py-6 rounded-xl bg-primary text-primary-foreground font-semibold text-lg mt-4"
                >
                  Continue to SDD
                </Button>
              </div>
              
              <p className="mt-8 text-center text-sm text-muted-foreground">
                By continuing, you agree to our <span className="underline cursor-pointer">Privacy Protocol</span>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
