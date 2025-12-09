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
      // Allow signing-out page (it handles its own redirect)
      if (pathname === '/signing-out') {
        return;
      }
      
      // If user is not authenticated, redirect to explore page (but allow explore and onboarding)
      // CRITICAL: Also allow public listing routes
      const isPublicRoute = pathname === "/" || 
                           pathname === "/onboarding" || 
                           pathname.startsWith("/explore") ||
                           pathname.startsWith("/for-you-listings") ||
                           pathname.startsWith("/casual-listings") ||
                           pathname.startsWith("/side-quest-listings") ||
                           (pathname === "/listing" && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('id') !== null);
      
      if (!user && !isPublicRoute) {
        console.log('🛡️ Guard: User not signed in, redirecting to /explore from', pathname);
        // Use window.location for absolute reliability
        if (typeof window !== 'undefined') {
          window.location.replace('/explore');
        }
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
      // Even on error, try to redirect
      if (!user && typeof window !== 'undefined' && window.location.pathname !== '/explore') {
        window.location.replace('/explore');
      }
    }
  }, [pathname, router, isAnyModalOpen, user, authLoading]);

  if (authLoading) {
    return <div className="animate-pulse h-1 w-full bg-neutral-200" />;
  }
  return <>{children}</>;
}


