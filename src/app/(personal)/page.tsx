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
  
  // Show minimal loading state while determining where to redirect
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-200 border-t-brand"></div>
    </div>
  );
}



