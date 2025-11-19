"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  // Smart routing based on authentication status
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    
    // Only redirect if we're actually on the root path "/"
    // This prevents redirect loops when navigating to other pages like /explore
    if (pathname !== "/") {
      return;
    }
    
    if (user) {
      // Signed in users go to My Life
      router.replace("/my-life");
    } else {
      // Non-signed-in users go to Explore
      router.replace("/explore");
    }
  }, [user, loading, router, pathname]);
  
  // Return null during loading to prevent flash of content
  return null;
}



