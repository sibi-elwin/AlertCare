"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CaregiverAuth() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to signup page by default
    router.replace('/caretaker/auth/signup');
  }, [router]);

  return null;
}
