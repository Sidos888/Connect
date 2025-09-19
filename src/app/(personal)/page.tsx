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
  
  // Show loading while determining where to redirect
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}



