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
      
      // If user is authenticated but has no profile, try to load from Supabase
      if (user && !personalProfile && !profileLoading) {
        setProfileLoading(true);
        loadUserProfile().then(({ profile, error }) => {
          setProfileLoading(false);
          if (profile) {
            // Convert Supabase profile to PersonalProfile format
            const personalProfile = {
              id: profile.id,
              name: profile.full_name || profile.name || '',
              bio: profile.bio || '',
              avatarUrl: profile.avatar_url || null,
              email: profile.email || '',
              phone: profile.phone || '',
              dateOfBirth: profile.date_of_birth || '',
              connectId: profile.connect_id || '',
              createdAt: profile.created_at || new Date().toISOString(),
              updatedAt: profile.updated_at || new Date().toISOString(),
            };
            setPersonalProfile(personalProfile);
          } else {
            // No profile found - check if we're on a protected route
            if (pathname !== "/" && pathname !== "/onboarding") {
              // If on a protected route, redirect to onboarding
              router.replace("/onboarding");
            }
            // If on explore page (/), allow it to stay
          }
        });
        return;
      }
      
      // If user is authenticated but still has no profile after loading, redirect to onboarding
      if (user && !personalProfile && profileLoading === false && pathname !== "/" && pathname !== "/onboarding") {
        router.replace("/onboarding");
        return;
      }
      
      // Allow root path (/) to be accessible without personalProfile for explore page
      if (!personalProfile && pathname !== "/onboarding" && pathname !== "/") {
        router.replace("/");
      }
    } catch (error) {
      console.error("Guard redirect error:", error);
    }
  }, [personalProfile, isHydrated, pathname, router, isAnyModalOpen, user, authLoading, profileLoading, loadUserProfile, setPersonalProfile]);

  if (!isHydrated) {
    return <div className="animate-pulse h-1 w-full bg-neutral-200" />;
  }
  return <>{children}</>;
}


