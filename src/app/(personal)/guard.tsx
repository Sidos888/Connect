"use client";

import { useModal } from "@/lib/modalContext";
import { useAuth } from "@/lib/authContext";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

export default function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAnyModalOpen } = useModal();
  const { user, loading: authLoading } = useAuth();
  const [profileLoading, setProfileLoading] = React.useState(false);

  React.useEffect(() => {
    if (authLoading) return;
    // Don't redirect if any authentication modal is open
    if (isAnyModalOpen) return;
    
    try {
      // If user is not authenticated, redirect to explore page (but allow explore and onboarding)
      if (!user && pathname !== "/" && pathname !== "/onboarding" && !pathname.startsWith("/explore")) {
        console.log('🛡️ Guard: User not signed in, redirecting to /explore from', pathname);
        router.replace("/explore");
        return;
      }
      
      // Simple authentication guard - let ProtectedRoute handle profile loading
      console.log('Guard Debug:', {
        user: user ? 'SIGNED IN' : 'NOT SIGNED IN',
        userId: user?.id,
        pathname
      });
      
    } catch (error) {
      console.error("Guard redirect error:", error);
    }
  }, [pathname, router, isAnyModalOpen, user, authLoading]);

  if (authLoading) {
    return <div className="animate-pulse h-1 w-full bg-neutral-200" />;
  }
  return <>{children}</>;
}


