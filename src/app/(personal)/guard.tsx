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
      
      if (user && (!personalProfile || hasTemporaryProfile) && !profileLoading) {
        console.log('Guard: Loading profile from Supabase');
        setProfileLoading(true);
        
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log('Guard: Profile loading timeout - stopping loading state');
          setProfileLoading(false);
        }, 10000); // 10 second timeout
        
        loadUserProfile().then(({ profile, error }) => {
          clearTimeout(timeoutId);
          setProfileLoading(false);
          console.log('Guard: Profile loaded from Supabase:', { profile: profile ? 'EXISTS' : 'NULL', error: error?.message });
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
            console.log('Guard: Profile set in local store');
          } else {
            console.log('Guard: No profile found in Supabase - user may need to complete onboarding');
          }
          // Don't redirect to onboarding - let ProtectedRoute handle authentication flow
        }).catch((error) => {
          clearTimeout(timeoutId);
          setProfileLoading(false);
          console.error('Guard: Error loading profile from Supabase:', error);
        });
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


