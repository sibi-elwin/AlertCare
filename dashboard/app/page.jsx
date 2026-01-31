"use client";

import Link from "next/link";
import {
  Stethoscope,
  HeartHandshake,
  Shield,
  Zap,
  Brain,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCareLogo } from "@/components/alertcare-logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCareLogo size="md" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">AlertCare</h1>
              <p className="text-xs text-muted-foreground">
                Predictive Rural Healthcare
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Badge variant="outline" className="border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100 cursor-pointer">
                Admin Panel
              </Badge>
            </Link>
            <Badge variant="outline" className="border-indigo-200 text-indigo-600 bg-indigo-50">
              Demo Mode
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-200">
            AI-Powered Healthcare
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Predictive Care for
            <span className="text-indigo-600"> Rural Communities</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            AlertCare combines LSTM neural networks with clinical protocols to predict
            patient deterioration before it happens, enabling proactive intervention in
            resource-limited settings.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-foreground">LSTM Predictions</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-foreground">NEWS2 Protocol</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-foreground">Smart-Burst Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selector */}
      <section className="py-8 px-4 bg-card border-y border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold text-center text-foreground mb-2">
            Select Your Role
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Choose a portal to explore the AlertCare system
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Patient Portal */}
            <Link href="/patient/auth/signup" className="block group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-indigo-300 group-hover:bg-indigo-50/50">
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                    <HeartHandshake className="w-7 h-7 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Patient Portal
                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-600" />
                  </CardTitle>
                  <CardDescription>
                    Register and choose your doctor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      Choose your preferred doctor
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      Control who sees your health data
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      GPS-based emergency routing
                    </li>
                  </ul>
                  <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white">
                    Register as Patient
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Doctor Portal */}
            <Link href="/doctor/auth/signup" className="block group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-indigo-300 group-hover:bg-indigo-50/50">
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                    <Stethoscope className="w-7 h-7 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Physician Command Center
                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-600" />
                  </CardTitle>
                  <CardDescription>
                    Full triage dashboard optimized for desktop
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      Priority-sorted patient triage list
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      Real-time vitals with AI anomaly detection
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      Ambulance dispatch and shortage predictions
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      Silent Deterioration Risk visualization
                    </li>
                  </ul>
                  <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white">
                    Enter as Physician
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Caretaker Portal */}
            <Link href="/caretaker/auth/signup" className="block group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-emerald-300 group-hover:bg-emerald-50/50">
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                    <HeartHandshake className="w-7 h-7 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Caretaker Portal
                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
                  </CardTitle>
                  <CardDescription>
                    Mobile-first interface for rural health workers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      High-contrast, large-button vital entry
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Smart-Burst sync status feedback
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Historical entry log with sync status
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Works offline with automatic sync
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full mt-6 border-emerald-600 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                  >
                    Enter as Caretaker
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold text-center text-foreground mb-8">
            How AlertCare Works
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-amber-600">1</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Collect Vitals</h3>
              <p className="text-sm text-muted-foreground">
                Caretakers record patient vitals using the mobile-optimized interface
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                LSTM model calculates Stability Index combining anomaly detection with NEWS2
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-emerald-600">3</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Smart Triage</h3>
              <p className="text-sm text-muted-foreground">
                Physicians see priority-sorted dashboard with predictive alerts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>AlertCare Demo - Predictive Rural Healthcare System</p>
          <p className="mt-1">
            Built with AI-powered Stability Index, NEWS2 Protocol, and Smart-Burst Sync
          </p>
        </div>
      </footer>
    </div>
  );
}
