"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from "react";
import ProfilePage from "@/components/profile/ProfilePage";
import { useAuth } from '@/lib/authContext';
import { getSupabaseClient } from '@/lib/supabaseClient';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ProfileRoute() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const from = searchParams.get('from');
  const router = useRouter();
  const { account } = useAuth();
  const [profileData, setProfileData] = useState<{
    id?: string;
    name?: string;
    avatarUrl?: string;
    bio?: string;
    dateOfBirth?: string;
    createdAt?: string;
    profile_visibility?: 'public' | 'private';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start as false - load in background

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        return;
      }

      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          console.error('ProfileRoute: No supabase client');
          return;
        }

        // Fetch account data in background (no loading state)
        const { data, error } = await supabase
          .from('accounts')
          .select('id, name, profile_pic, bio, dob, created_at, profile_visibility')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('ProfileRoute: Error fetching profile:', error);
          return;
        }

        if (data) {
          console.log('🔵 ProfileRoute: Loaded profile data:', {
            userId: data.id,
            name: data.name,
            dob: data.dob,
            created_at: data.created_at,
            profile_visibility: data.profile_visibility
          });
          
          setProfileData({
            id: data.id,
            name: data.name || undefined,
            avatarUrl: data.profile_pic || undefined,
            bio: data.bio || undefined,
            dateOfBirth: data.dob || undefined,
            createdAt: data.created_at || undefined,
            profile_visibility: data.profile_visibility
          });
        }
      } catch (error) {
        console.error('ProfileRoute: Error loading profile:', error);
      }
    };

    loadProfile();
  }, [userId]);

  const handleBack = () => {
    if (from) {
      // Handle different from values
      if (from === 'connections') {
        router.push('/menu?view=connections');
      } else if (from === 'add-person') {
        router.push('/menu?view=add-person');
      } else if (from.startsWith('/')) {
        // If from is a full path, use it directly
      router.push(from);
      } else {
        // Default: go back in history
        router.back();
      }
    } else {
      router.back();
    }
  };

  const isOwnProfile = account?.id === userId;

  if (!userId) {
    return (
      <ProtectedRoute title="Profile" description="Log in / sign up to view profiles" buttonText="Log in">
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-gray-500">No user ID provided</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Render ProfilePage immediately - it will show loading state internally if needed
  // Use placeholder data if profileData is null (will update when loaded)
  const displayProfile = profileData || {
    id: userId,
    name: undefined,
    avatarUrl: undefined,
    bio: undefined,
    dateOfBirth: undefined,
    createdAt: undefined,
    profile_visibility: undefined
  };

  return (
    <ProtectedRoute title="Profile" description="Log in / sign up to view profiles" buttonText="Log in">
      <ProfilePage
        profile={displayProfile}
        isOwnProfile={isOwnProfile}
        showBackButton={true}
        onClose={handleBack}
        onEdit={isOwnProfile ? () => router.push('/settings/edit/details') : undefined}
        onSettings={isOwnProfile ? () => router.push('/settings') : undefined}
        onShare={isOwnProfile ? () => router.push('/menu?view=share-profile') : undefined}
        onOpenTimeline={() => router.push(`/timeline?userId=${userId}`)}
        onOpenHighlights={() => router.push(`/highlights?userId=${userId}`)}
        onOpenBadges={() => router.push(`/achievements?userId=${userId}`)}
        onOpenConnections={() => router.push(`/connections?userId=${userId}`)}
        onOpenFullLife={() => router.push(`/menu?view=life&userId=${userId}&from=profile`)}
      />
    </ProtectedRoute>
  );
}

