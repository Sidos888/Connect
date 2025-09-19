"use client";

import { useAppStore } from "@/lib/store";
import { useModal } from "@/lib/modalContext";
import { useAuth } from "@/lib/authContext";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

export default function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { personalProfile, isHydrated, setPersonalProfile } = useAppStore();
  const { isAnyModalOpen, showLogin } = useModal();
  const { user, loading: authLoading, loadUserProfile } = useAuth();
  const [profileLoading, setProfileLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isHydrated || authLoading) return;
    // Don't redirect if any authentication modal is open
    if (isAnyModalOpen) return;
    
    try {
      // If user is not authenticated, redirect to home page
      if (!user && pathname !== "/" && pathname !== "/onboarding") {
        router.replace("/");
        return;
      }
      
      // If user is authenticated but has no profile or has a temporary profile, try to load from Supabase
      const hasTemporaryProfile = personalProfile && (personalProfile.id === 'temp-id' || personalProfile.connectId === 'TEMP');
      console.log('Guard Debug:', {
        user: user ? 'SIGNED IN' : 'NOT SIGNED IN',
        userId: user?.id,
        personalProfile: personalProfile ? 'EXISTS' : 'NULL',
        personalProfileId: personalProfile?.id,
        personalProfileConnectId: personalProfile?.connectId,
        hasTemporaryProfile,
        profileLoading,
        pathname
      });
      
      // ProtectedRoute now handles all profile loading - Guard should not interfere
      if (user && (!personalProfile || hasTemporaryProfile) && !profileLoading) {
        console.log('Guard: ⚡ Profile loading now handled by ProtectedRoute - Guard will not interfere');
        return;
      }
      
      // Don't force redirects - let ProtectedRoute handle authentication flow
      // This allows clean sign-in/sign-up pages to show instead of onboarding
    } catch (error) {
      console.error("Guard redirect error:", error);
    }
  }, [personalProfile, isHydrated, pathname, router, isAnyModalOpen, user, authLoading, profileLoading, loadUserProfile, setPersonalProfile]);

  if (!isHydrated) {
    return <div className="animate-pulse h-1 w-full bg-neutral-200" />;
  }
  return <>{children}</>;
}


