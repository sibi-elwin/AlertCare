"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, Mail, Phone, Calendar, MapPin, Heart, Stethoscope, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authAPI, patientDashboardAPI } from "@/lib/api-client";

export default function PatientSignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDoctorSelection, setShowDoctorSelection] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorSpecialization, setDoctorSpecialization] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState(null);
  
  // Sign up form
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    address: "",
  });

  useEffect(() => {
    // Check if already authenticated on initial mount
    if (authAPI.isAuthenticated()) {
      const user = authAPI.getCurrentUser();
      if (user && user.role === 'PATIENT' && user.profile?.id) {
        router.push('/patient/dashboard');
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
      // Only send fields that exist in the Patient schema
      const signupPayload = {
        email: signUpData.email,
        password: signUpData.password,
        role: 'PATIENT',
      };
      
      // Add optional Patient fields only if they have values
      if (signUpData.firstName?.trim()) signupPayload.firstName = signUpData.firstName.trim();
      if (signUpData.lastName?.trim()) signupPayload.lastName = signUpData.lastName.trim();
      if (signUpData.phone?.trim()) signupPayload.phone = signUpData.phone.trim();
      if (signUpData.dateOfBirth) signupPayload.dateOfBirth = signUpData.dateOfBirth;
      if (signUpData.address?.trim()) signupPayload.address = signUpData.address.trim();
      
      const response = await authAPI.signup(signupPayload);
      
      if (response.success) {
        const user = response.data.user;
        if (user.role === 'PATIENT') {
          // Fetch profile after signup and update user in localStorage
          try {
            const profileResponse = await patientDashboardAPI.getProfileByUserId(user.id);
            if (profileResponse.success && profileResponse.data) {
              const updatedUser = { ...user, profile: profileResponse.data };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setCurrentPatientId(profileResponse.data.id);
              
              // Load available doctors and show selection step
              await loadAvailableDoctors();
              setShowDoctorSelection(true);
            }
          } catch (error) {
            console.error('Error fetching profile after signup:', error);
            // Continue anyway - profile can be fetched later
            // Still show doctor selection if we have user info
            if (user.id) {
              await loadAvailableDoctors();
              setShowDoctorSelection(true);
            } else {
              // If we can't get profile, just redirect
              router.push('/patient/dashboard');
            }
          }
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

  // Load available doctors
  const loadAvailableDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const response = await patientDashboardAPI.getAvailableDoctors({
        search: doctorSearch || undefined,
        specialization: doctorSpecialization || undefined,
      });
      
      if (response.success && response.data) {
        setAvailableDoctors(response.data.doctors || []);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      setAvailableDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Handle doctor selection
  const handleSelectDoctor = async () => {
    if (!selectedDoctorId || !currentPatientId) return;

    setLoading(true);
    try {
      const response = await patientDashboardAPI.assignDoctor(currentPatientId, selectedDoctorId);
      
      if (response.success) {
        // Doctor assigned successfully, redirect to dashboard
        router.push('/patient/dashboard');
      } else {
        setError(response.message || 'Failed to assign doctor');
      }
    } catch (error) {
      console.error('Error assigning doctor:', error);
      setError('Failed to assign doctor. You can select one later from your dashboard.');
      // Still redirect even if assignment fails
      setTimeout(() => {
        router.push('/patient/dashboard');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Handle skip doctor selection
  const handleSkipDoctorSelection = () => {
    // Redirect to dashboard without selecting a doctor
    router.push('/patient/dashboard');
  };

  // Load doctors when search or specialization changes (with debounce)
  useEffect(() => {
    if (showDoctorSelection) {
      const timeoutId = setTimeout(() => {
        loadAvailableDoctors();
      }, 300); // Debounce search by 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [doctorSearch, doctorSpecialization, showDoctorSelection]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-foreground mb-1">Patient Portal</h1>
          <p className="text-sm text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5 text-indigo-600" />
              Patient Portal
            </CardTitle>
            <CardDescription className="text-sm">
              {showDoctorSelection
                ? 'Choose a doctor to manage your health'
                : 'Create a new patient account to track your health'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {showDoctorSelection ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Choose Your Doctor
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select a doctor to manage your health. You can change this later from your dashboard.
                  </p>
                </div>

                {/* Search and Filter */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by name or specialization..."
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialization">Filter by Specialization</Label>
                    <select
                      id="specialization"
                      value={doctorSpecialization}
                      onChange={(e) => setDoctorSpecialization(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="">All Specializations</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Diabetes & Endocrinology">Diabetes & Endocrinology</option>
                      <option value="Arthritis & Rheumatology">Arthritis & Rheumatology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Dementia & Alzheimer's Care">Dementia & Alzheimer's Care</option>
                      <option value="Osteoporosis">Osteoporosis</option>
                      <option value="COPD & Respiratory">COPD & Respiratory</option>
                      <option value="Mental Health & Depression">Mental Health & Depression</option>
                      <option value="Geriatrics">Geriatrics</option>
                      <option value="Hypertension">Hypertension</option>
                      <option value="Heart Disease">Heart Disease</option>
                      <option value="Falls & Fractures">Falls & Fractures</option>
                      <option value="Vision & Hearing">Vision & Hearing</option>
                      <option value="Internal Medicine">Internal Medicine</option>
                    </select>
                  </div>
                </div>

                {/* Doctors List */}
                {loadingDoctors ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading doctors...</p>
                  </div>
                ) : availableDoctors.length === 0 ? (
                  <div className="text-center py-8">
                    <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No doctors found. You can select one later from your dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableDoctors.map((doctor) => (
                      <Card
                        key={doctor.id}
                        className={`cursor-pointer transition-all ${
                          selectedDoctorId === doctor.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'hover:border-indigo-200'
                        }`}
                        onClick={() => setSelectedDoctorId(doctor.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Stethoscope className="w-4 h-4 text-indigo-600" />
                                <h4 className="font-semibold text-foreground">{doctor.name}</h4>
                                {selectedDoctorId === doctor.id && (
                                  <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                )}
                              </div>
                              {doctor.specialization && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  {doctor.specialization}
                                </p>
                              )}
                              {doctor.licenseNumber && (
                                <p className="text-xs text-muted-foreground">
                                  License: {doctor.licenseNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-border">
                  <Button
                    onClick={handleSelectDoctor}
                    disabled={!selectedDoctorId || loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Assigning Doctor...
                      </>
                    ) : (
                      <>
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Continue with Selected Doctor
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSkipDoctorSelection}
                    disabled={loading}
                    className="w-full"
                  >
                    Skip for Now
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    You can select or change your doctor anytime from your dashboard
                  </p>
                </div>
              </div>
            ) : (
              <>
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
                          placeholder="John"
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
                        placeholder="Doe"
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
                        placeholder="patient@example.com"
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
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={signUpData.dateOfBirth}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">Address (Optional)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        value={signUpData.address}
                        onChange={handleInputChange}
                        placeholder="123 Main St, City"
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
                      href="/patient/auth/signin"
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

