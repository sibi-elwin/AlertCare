"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DoctorAuth() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to signup page by default
    router.replace('/doctor/auth/signup');
  }, [router]);

  return null;
}
