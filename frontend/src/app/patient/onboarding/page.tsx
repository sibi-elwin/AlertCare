"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Volume2 } from "lucide-react";

const steps = [
  {
    id: "age",
    question: "How old are you?",
    type: "number",
    placeholder: "Age",
    suffix: "years old",
  },
  {
    id: "sex",
    question: "What is your biological sex?",
    type: "options",
    options: ["Male", "Female", "Prefer not to say"],
  },
  {
    id: "metrics",
    question: "What is your height and weight?",
    type: "metrics",
  },
  {
    id: "conditions",
    question: "Do you have any known medical conditions?",
    type: "textarea",
    placeholder: "Optional: e.g. Hypertension, Diabetes...",
  },
  {
    id: "sleep",
    question: "What is your typical sleep window?",
    type: "range",
    description: "e.g. 10:00 PM to 6:00 AM",
  },
  {
    id: "activity",
    question: "What is your typical activity level?",
    type: "options",
    options: ["Low", "Moderate", "High"],
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/patient/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Step {currentStep + 1} of {steps.length}</span>
            <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground">
              <Volume2 className="h-4 w-4" />
              Voice Assist
            </Button>
          </div>
          <Progress value={progress} className="h-1.5 bg-white/5" />
        </div>

        <div className="min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-10 leading-tight">{step.question}</h2>

              {step.type === "number" && (
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    autoFocus
                    placeholder={step.placeholder}
                    className="bg-transparent border-b-2 border-white/10 text-6xl font-mono focus:border-primary outline-none py-4 w-40 transition-colors"
                  />
                  <span className="text-2xl text-muted-foreground">{step.suffix}</span>
                </div>
              )}

              {step.type === "options" && (
                <div className="grid gap-4">
                  {step.options?.map((option) => (
                    <button
                      key={option}
                      onClick={handleNext}
                      className="w-full p-8 rounded-3xl border border-white/5 bg-white/5 hover:bg-primary hover:text-primary-foreground text-left text-2xl font-medium transition-all"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {step.type === "metrics" && (
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Height (cm)</label>
                    <input type="number" placeholder="170" className="w-full bg-white/5 border-b-2 border-white/10 text-4xl font-mono focus:border-primary outline-none py-4 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Weight (kg)</label>
                    <input type="number" placeholder="70" className="w-full bg-white/5 border-b-2 border-white/10 text-4xl font-mono focus:border-primary outline-none py-4 transition-colors" />
                  </div>
                </div>
              )}

              {step.type === "textarea" && (
                <textarea
                  placeholder={step.placeholder}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-3xl p-6 text-xl min-h-[150px] focus:border-primary outline-none transition-colors"
                />
              )}

              {step.type === "range" && (
                <div className="flex flex-col gap-6">
                  <p className="text-muted-foreground text-xl">{step.description}</p>
                  <div className="flex gap-4">
                     <input type="time" className="bg-white/5 border-b-2 border-white/10 text-3xl font-mono focus:border-primary outline-none py-2 px-4 rounded-lg" defaultValue="22:00" />
                     <span className="text-3xl self-center">to</span>
                     <input type="time" className="bg-white/5 border-b-2 border-white/10 text-3xl font-mono focus:border-primary outline-none py-2 px-4 rounded-lg" defaultValue="06:00" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-16 flex justify-between items-center">
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full px-8 text-muted-foreground"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back
          </Button>

          {step.type !== "options" && (
            <Button
              size="lg"
              className="rounded-full px-10 py-6 text-xl bg-primary text-primary-foreground font-semibold"
              onClick={handleNext}
            >
              Continue
              <ChevronRight className="ml-2 h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
