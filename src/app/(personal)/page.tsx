"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";

export default function Page() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Smart routing based on authentication status
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    
    if (user) {
      // Signed in users go to My Life
      router.replace("/my-life");
    } else {
      // Non-signed-in users go to Explore
      router.replace("/explore");
    }
  }, [user, loading, router]);
  
  // Return null during loading to prevent flash of content
  return null;
}



