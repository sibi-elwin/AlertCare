"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authAPI, patientDashboardAPI } from "@/lib/api-client";

export default function PatientSignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  useEffect(() => {
    // Check if already authenticated on initial mount
    if (authAPI.isAuthenticated()) {
      const user = authAPI.getCurrentUser();
      if (user && user.role === 'PATIENT' && user.profile?.id) {
        router.push('/patient/dashboard');
      }
    }
  }, [router]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.signin(signInEmail, signInPassword);
      
      if (response.success) {
        const user = response.data.user;
        if (user.role === 'PATIENT') {
          // Sign in successful - redirect to dashboard
          // Fetch profile if missing
          if (!user.profile?.id && user.id) {
            try {
              const profileResponse = await patientDashboardAPI.getProfileByUserId(user.id);
              if (profileResponse.success && profileResponse.data) {
                const updatedUser = { ...user, profile: profileResponse.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
            } catch (error) {
              console.error('Error fetching profile after signin:', error);
            }
          }
          // Redirect to dashboard after successful sign in
          router.push('/patient/dashboard');
        } else {
          setError('This account is not a patient account');
          authAPI.signout();
        }
      } else {
        setError(response.message || 'Invalid email or password');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-foreground mb-1">Patient Portal</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5 text-indigo-600" />
              Patient Portal
            </CardTitle>
            <CardDescription className="text-sm">
              Enter your email and password to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signInEmail" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signInEmail"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signInPassword" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signInPassword"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10"
                    required
                  />
                </div>
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
                    <Heart className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Do not have an account?{" "}
                <Link
                  href="/patient/auth/signup"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

