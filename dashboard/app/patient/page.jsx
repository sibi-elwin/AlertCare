"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Stethoscope, MapPin, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCareLogo } from "@/components/alertcare-logo";
import { mockDoctors } from "@/lib/patient-data";
import { registerPatient, selectDoctor, updatePatientLocation } from "@/lib/patient-data";

export default function PatientRegistration() {
  const [step, setStep] = useState(1); // 1: Registration, 2: Doctor Selection, 3: Location, 4: Complete
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    condition: '',
  });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [manualLocation, setManualLocation] = useState({ latitude: '', longitude: '' });
  const [useManualLocation, setUseManualLocation] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const patient = registerPatient({
        name: formData.name,
        age: parseInt(formData.age),
        phone: formData.phone,
        condition: formData.condition,
      });
      
      setPatientId(patient.id);
      setStep(2);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = async (doctorId) => {
    setLoading(true);
    try {
      await selectDoctor(patientId, doctorId);
      setSelectedDoctor(doctorId);
      setStep(3);
    } catch (error) {
      console.error('Doctor selection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    setLocationError(null);
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please use manual entry.');
      setLocationLoading(false);
      setUseManualLocation(true);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        
        setLocation(loc);
        updatePatientLocation(patientId, loc);
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = 'Unable to retrieve your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied. Please enable location permissions in your browser settings, or use manual entry below.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please try again or use manual entry.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or use manual entry.';
            break;
          default:
            errorMessage += 'An unknown error occurred. Please use manual entry.';
            break;
        }
        
        setLocationError(errorMessage);
        setUseManualLocation(true);
        console.error('Geolocation error:', error);
      },
      options
    );
  };

  const handleManualLocationSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(manualLocation.latitude);
    const lon = parseFloat(manualLocation.longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      setLocationError('Please enter valid latitude and longitude values.');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      setLocationError('Latitude must be between -90 and 90.');
      return;
    }
    
    if (lon < -180 || lon > 180) {
      setLocationError('Longitude must be between -180 and 180.');
      return;
    }
    
    const loc = {
      latitude: lat,
      longitude: lon,
      accuracy: null,
      manual: true,
    };
    
    setLocation(loc);
    updatePatientLocation(patientId, loc);
    setLocationError(null);
  };

  const handleSkipLocation = () => {
    // Allow skipping but warn user
    if (confirm('Location is important for emergency hospital routing. Are you sure you want to skip?')) {
      setStep(4);
    }
  };

  const handleComplete = () => {
    // Redirect to patient dashboard
    if (patientId) {
      window.location.href = `/patient/dashboard?id=${patientId}`;
    } else {
      setStep(4);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <AlertCareLogo size="md" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">AlertCare</h1>
                <p className="text-xs text-muted-foreground">Patient Registration</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Step 1: Registration */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Patient Registration
              </CardTitle>
              <CardDescription>
                Register to start your patient-centric healthcare journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your age"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Medical Condition</Label>
                  <Input
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Diabetes, Hypertension, etc."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Doctor Selection */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                Choose Your Doctor
              </CardTitle>
              <CardDescription>
                Select a doctor you want to consult with. You control who has access to your health data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDoctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className={`cursor-pointer transition-all ${
                      selectedDoctor === doctor.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'hover:border-indigo-200'
                    }`}
                    onClick={() => handleSelectDoctor(doctor.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{doctor.name}</h3>
                            {selectedDoctor === doctor.id && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {doctor.specialty} · {doctor.experience}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{doctor.patientsCount} patients</span>
                            <span>{doctor.experience}</span>
                            {doctor.available && (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                Available
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert className="mt-4 border-indigo-200 bg-indigo-50">
                <AlertDescription className="text-indigo-800 text-sm">
                  <strong>Your Privacy:</strong> You control who sees your ML model insights. 
                  Only your selected doctor and assigned caregiver (if any) will have access.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Share Your Location
              </CardTitle>
              <CardDescription>
                Your location helps us find the nearest hospital in emergencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!location ? (
                <>
                  <Alert className="border-indigo-200 bg-indigo-50">
                    <AlertDescription className="text-indigo-800 text-sm">
                      <strong>Why we need your location:</strong> In emergency situations, 
                      your doctor may need to escalate your case to the nearest hospital. 
                      Your GPS location ensures we can find the closest facility with available beds.
                      <br /><br />
                      <strong>Privacy:</strong> Your location is only used for emergency routing 
                      and is never shared with third parties.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Button
                      onClick={handleGetLocation}
                      disabled={locationLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {locationLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Getting location...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          Share Location Automatically
                        </>
                      )}
                    </Button>

                    {locationError && (
                      <Alert variant="destructive">
                        <AlertDescription className="text-sm">{locationError}</AlertDescription>
                      </Alert>
                    )}

                    {(useManualLocation || locationError) && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-medium text-foreground mb-3">
                          Or enter location manually:
                        </p>
                        <form onSubmit={handleManualLocationSubmit} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="latitude">Latitude</Label>
                              <Input
                                id="latitude"
                                type="number"
                                step="any"
                                placeholder="28.6139"
                                value={manualLocation.latitude}
                                onChange={(e) =>
                                  setManualLocation({
                                    ...manualLocation,
                                    latitude: e.target.value,
                                  })
                                }
                                required={useManualLocation}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="longitude">Longitude</Label>
                              <Input
                                id="longitude"
                                type="number"
                                step="any"
                                placeholder="77.2090"
                                value={manualLocation.longitude}
                                onChange={(e) =>
                                  setManualLocation({
                                    ...manualLocation,
                                    longitude: e.target.value,
                                  })
                                }
                                required={useManualLocation}
                              />
                            </div>
                          </div>
                          <Button
                            type="submit"
                            variant="outline"
                            className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                          >
                            Use Manual Location
                          </Button>
                        </form>
                        <p className="text-xs text-muted-foreground mt-2">
                          You can find your coordinates using Google Maps or other mapping services.
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        onClick={handleSkipLocation}
                        className="w-full text-muted-foreground hover:text-foreground"
                      >
                        Skip for now (not recommended)
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-lg border bg-emerald-50 border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="font-semibold text-emerald-800">Location Shared</span>
                      {location.manual && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Manual Entry
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-emerald-700 mb-1">
                      Latitude: {location.latitude.toFixed(6)}
                    </p>
                    <p className="text-sm text-emerald-700">
                      Longitude: {location.longitude.toFixed(6)}
                    </p>
                    {location.accuracy && (
                      <p className="text-xs text-emerald-600 mt-1">
                        Accuracy: ±{Math.round(location.accuracy)} meters
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleComplete}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Complete Registration
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setLocation(null);
                      setUseManualLocation(false);
                      setLocationError(null);
                    }}
                    className="w-full"
                  >
                    Change Location
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-emerald-800 mb-2">
                Registration Complete!
              </h2>
              <p className="text-emerald-700 mb-6">
                Your consultation request has been sent to your selected doctor. 
                You'll be notified when they approve your request.
              </p>
              <div className="space-y-2">
                {patientId && (
                  <Button
                    onClick={() => window.location.href = `/patient/dashboard?id=${patientId}`}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Go to Dashboard
                  </Button>
                )}
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
