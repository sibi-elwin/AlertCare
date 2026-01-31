"use client";

import Link from "next/link";
import { User, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertCareLogo } from "@/components/alertcare-logo";

export function CaretakerHeader({ patient }) {
  if (!patient) {
    return (
      <header className="bg-indigo-600 text-white px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <AlertCareLogo size="lg" variant="light" />
            <div>
              <h1 className="text-lg font-semibold">AlertCare</h1>
              <p className="text-xs text-indigo-200">Caretaker Portal</p>
            </div>
          </div>
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-indigo-600 text-white px-4 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertCareLogo size="lg" variant="light" />
          <div>
            <h1 className="text-lg font-semibold">AlertCare</h1>
            <p className="text-xs text-indigo-200">Caretaker Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Patient Info Card */}
      {patient && (
        <div className="mt-4 max-w-7xl mx-auto">
          <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xl font-semibold text-white">{patient.name}</p>
                <p className="text-sm text-indigo-200 mt-1">
                  {patient.age} years · {patient.condition}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
