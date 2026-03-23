"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
export default function SignOut() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.signOut().then(() => { window.location.href = "/"; });
  }, []);
  return null;
}
