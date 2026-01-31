"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Bell, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCareLogo } from "@/components/alertcare-logo";
import { authAPI } from "@/lib/api-client";
import { getDoctorAlerts } from "@/lib/alert-routing";

export function DoctorHeader({ currentDoctor }) {
  const router = useRouter();
  const user = authAPI.getCurrentUser();
  const doctorInfo = currentDoctor || user?.profile;
  const alerts = currentDoctor ? getDoctorAlerts(currentDoctor.doctorId || currentDoctor.id, 10) : [];
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'major');

  const handleSignOut = () => {
    authAPI.signout();
    router.push("/doctor/auth");
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCareLogo size="md" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">AlertCare</h1>
              <p className="text-xs text-muted-foreground">
                {currentDoctor ? `${currentDoctor.name} - ${doctorInfo?.specialty || 'Doctor'}` : 'Physician Command Center'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentDoctor && (
              <>
                <div className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {criticalAlerts.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-xs rounded-full flex items-center justify-center">
                        {criticalAlerts.length}
                      </span>
                    )}
                  </Button>
                </div>
                <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                  Signed In
                </Badge>
              </>
            )}
            {currentDoctor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            )}
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Critical Alert Banner */}
        {currentDoctor && criticalAlerts.length > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-rose-800">
              {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} Requiring Immediate Attention
            </span>
            <Badge variant="destructive" className="ml-auto">
              Urgent
            </Badge>
          </div>
        )}
      </div>
    </header>
  );
}
