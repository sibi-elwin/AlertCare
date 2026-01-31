"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientAuth() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to signup page by default
    router.replace('/patient/auth/signup');
  }, [router]);

  return null;
}
