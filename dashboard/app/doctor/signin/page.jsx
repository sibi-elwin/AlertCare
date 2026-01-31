"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stethoscope, Lock, User, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCareLogo } from "@/components/alertcare-logo";
import { signInDoctor, getCurrentDoctor } from "@/lib/auth";
import { mockDoctors } from "@/lib/patient-data";

export default function DoctorSignIn() {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already signed in
    const currentDoctor = getCurrentDoctor();
    if (currentDoctor) {
      router.push("/doctor");
    }
  }, [router]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = signInDoctor(doctorId, password);
      
      if (result.success) {
        router.push("/doctor");
      } else {
        setError(result.error || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <div className="text-center mb-8">
          <AlertCareLogo size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Doctor Portal</h1>
          <p className="text-muted-foreground">Sign in to access your dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Sign In
            </CardTitle>
            <CardDescription>
              Enter your doctor ID and password to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctorId">Doctor ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="doctorId"
                    type="text"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    placeholder="doc-001"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Example: doc-001, doc-002, etc.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Demo password: password123
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-3">Demo Doctors (Sample):</p>
              <div className="space-y-2 text-sm text-muted-foreground max-h-40 overflow-y-auto">
                {mockDoctors.slice(0, 10).map((doctor) => (
                  <div key={doctor.id} className="flex items-center justify-between">
                    <span className="text-xs">{doctor.name}</span>
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {doctor.id}
                    </code>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>{mockDoctors.length} total doctors</strong> available. All use password: <code className="bg-slate-100 px-1 rounded">password123</code>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Specialties: Hypertension, Diabetes, Arthritis, Heart Disease, Dementia, Osteoporosis, COPD, Depression, Falls/Fractures, Vision/Hearing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
