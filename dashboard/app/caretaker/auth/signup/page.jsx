"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, Mail, Phone, FileText, HeartHandshake } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authAPI, caregiverDashboardAPI } from "@/lib/api-client";

export default function CaregiverSignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Sign up form
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    licenseNumber: "",
  });

  useEffect(() => {
    // Check if already authenticated
    if (authAPI.isAuthenticated()) {
      const user = authAPI.getCurrentUser();
      if (user && user.role === 'CAREGIVER') {
        // Only redirect if we have profile data (caregiverId)
        // Otherwise, let user stay on auth page to sign in again
        if (user.profile?.id) {
          router.push('/caretaker');
        }
      }
    }
  }, [router]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Only send fields that exist in the Caregiver schema
      const signupPayload = {
        email: signUpData.email,
        password: signUpData.password,
        role: 'CAREGIVER',
      };
      
      // Add optional Caregiver fields only if they have values
      if (signUpData.firstName?.trim()) signupPayload.firstName = signUpData.firstName.trim();
      if (signUpData.lastName?.trim()) signupPayload.lastName = signUpData.lastName.trim();
      if (signUpData.phone?.trim()) signupPayload.phone = signUpData.phone.trim();
      if (signUpData.licenseNumber?.trim()) signupPayload.licenseNumber = signUpData.licenseNumber.trim();
      
      const response = await authAPI.signup(signupPayload);
      
      if (response.success) {
        const user = response.data.user;
        if (user.role === 'CAREGIVER') {
          // Fetch profile after signup and update user in localStorage
          try {
            const profileResponse = await caregiverDashboardAPI.getProfileByUserId(user.id);
            if (profileResponse.success && profileResponse.data) {
              const updatedUser = { ...user, profile: profileResponse.data };
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          } catch (error) {
            console.error('Error fetching profile after signup:', error);
            // Continue anyway - profile can be fetched later
          }
          
          // Redirect to dashboard after successful signup
          router.push('/caretaker');
        } else {
          setError('Account created but role mismatch');
        }
      } else {
        setError(response.message || 'Failed to create account');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSignUpData({
      ...signUpData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-foreground mb-1">Caregiver Portal</h1>
          <p className="text-sm text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HeartHandshake className="w-5 h-5 text-indigo-600" />
              Caregiver Portal
            </CardTitle>
            <CardDescription className="text-sm">
              Create a new caregiver account to manage patient care
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={signUpData.firstName}
                      onChange={handleInputChange}
                      placeholder="Jane"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={signUpData.lastName}
                    onChange={handleInputChange}
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={signUpData.email}
                    onChange={handleInputChange}
                    placeholder="caregiver@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={signUpData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber" className="text-sm font-medium">License Number (Optional)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    value={signUpData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="LIC123456"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={signUpData.password}
                    onChange={handleInputChange}
                    placeholder="At least 6 characters"
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={signUpData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Sign Up
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/caretaker/auth/signin"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

