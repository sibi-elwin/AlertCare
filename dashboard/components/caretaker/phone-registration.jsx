"use client";

import { useState } from "react";
import { Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerPhoneNumber } from "@/lib/sms-service";

export function PhoneRegistration({ patient, onRegistered }) {
  const [phone, setPhone] = useState("");
  const [caretakerName, setCaretakerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");

  const validatePhone = (phoneNumber) => {
    // Basic validation - accepts international format
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!phone.trim()) {
      setError("Please enter a phone number");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Please enter a valid phone number (e.g., +91 98765 43210)");
      return;
    }

    if (!caretakerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);

    try {
      // Register phone number
      const phoneData = registerPhoneNumber(patient.id, phone.trim(), caretakerName.trim());
      
      // Simulate OTP verification (in production, would send real OTP)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setRegistered(true);
      
      // Call callback after a short delay
      setTimeout(() => {
        onRegistered?.(phoneData);
      }, 2000);
    } catch (err) {
      setError("Failed to register phone number. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">
            Phone Number Registered!
          </h3>
          <p className="text-sm text-emerald-700">
            You will now receive periodic SMS updates about {patient.name}'s health status.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-indigo-600" />
          Register for SMS Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert className="border-indigo-200 bg-indigo-50">
            <AlertCircle className="w-4 h-4 text-indigo-600" />
            <AlertDescription className="text-indigo-800 text-sm">
              Receive periodic health updates via SMS for {patient.name}. 
              No login required - just register your phone number.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="caretakerName">Your Name</Label>
            <Input
              id="caretakerName"
              type="text"
              placeholder="Enter your full name"
              value={caretakerName}
              onChange={(e) => setCaretakerName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +91 for India)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
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
                Registering...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Register Phone Number
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By registering, you agree to receive SMS updates. 
            You can manage preferences in Settings.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
