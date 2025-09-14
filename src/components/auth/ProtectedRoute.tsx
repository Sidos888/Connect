"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { usePathname } from 'next/navigation';
import AuthButton from './AuthButton';
import { useModal } from '@/lib/modalContext';
import { useAppStore } from '@/lib/store';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
  buttonText?: string;
}

export default function ProtectedRoute({ children, fallback, title, description, buttonText }: ProtectedRouteProps) {
  const { user, loading, loadUserProfile, createProfileIfNeeded, clearProfileCache } = useAuth();
  const { personalProfile, isHydrated, setPersonalProfile } = useAppStore();
  const { showLogin } = useModal();
  const pathname = usePathname();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileLoadTimeout, setProfileLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [forceStopLoading, setForceStopLoading] = useState(false);

  // Get custom messages based on the current path if props are not provided
  const getCustomMessages = () => {
    if (title && description && buttonText) {
      return { title, description, buttonText };
    }

    // Normalize pathname by removing trailing slash
    const normalizedPath = pathname.replace(/\/$/, '') || '/';

    // Fallback to path-based messages
    switch (normalizedPath) {
      case '/chat':
        return {
          title: "Chats",
          description: "Log in / sign up to view chats",
          buttonText: "Log in"
        };
      case '/my-life':
        return {
          title: "My Life",
          description: "Log in / sign up to view your personal events and activities",
          buttonText: "Log in"
        };
      case '/menu':
        return {
          title: "Menu",
          description: "Log in / sign up to access your account settings and preferences",
          buttonText: "Log in"
        };
      default:
        return {
          title: "Log in to see this page",
          description: "You need to be logged in to access this content. Sign in to your account or create a new one to get started.",
          buttonText: "Log in"
        };
    }
  };

  const { title: displayTitle, description: displayDescription, buttonText: displayButtonText } = getCustomMessages();

  // Load profile when user signs in - always fetch fresh data from Supabase
  useEffect(() => {
    const loadProfileIfNeeded = async () => {
      if (user && !isLoadingProfile && isHydrated) {
        console.log('ProtectedRoute: User authenticated, fetching fresh profile from Supabase...');
        
        setIsLoadingProfile(true);
        
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          console.warn('ProtectedRoute: Profile loading timeout, forcing stop');
          setForceStopLoading(true);
          setIsLoadingProfile(false);
        }, 5000); // 5 second timeout
        
        setProfileLoadTimeout(timeout);
        
        try {
          // Clear any cached profile data to ensure we get fresh data
          clearProfileCache();
          
          const { profile, error } = await loadUserProfile();
          if (error) {
            console.error('ProtectedRoute: Error loading profile:', error);
            // Don't block the UI if profile loading fails - user can still use the app
          } else if (profile) {
            console.log('ProtectedRoute: Fresh profile loaded from Supabase:', profile);
            setPersonalProfile(profile);
          } else {
            console.log('ProtectedRoute: No profile found for user - attempting to create one...');
            // Try to create a basic profile if none exists
            const { error: createError } = await createProfileIfNeeded();
            if (createError) {
              console.error('ProtectedRoute: Error creating profile:', createError);
            } else {
              console.log('ProtectedRoute: Profile created, reloading...');
              // Try to load the profile again after creating it
              const { profile: newProfile, error: reloadError } = await loadUserProfile();
              if (!reloadError && newProfile) {
                console.log('ProtectedRoute: New profile loaded successfully:', newProfile);
                setPersonalProfile(newProfile);
              }
            }
          }
        } catch (error) {
          console.error('ProtectedRoute: Unexpected error loading profile:', error);
        } finally {
          // Clear timeout and stop loading
          if (profileLoadTimeout) {
            clearTimeout(profileLoadTimeout);
            setProfileLoadTimeout(null);
          }
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfileIfNeeded();
  }, [user, isHydrated]); // Removed isLoadingProfile from dependencies to prevent loops

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (profileLoadTimeout) {
        clearTimeout(profileLoadTimeout);
      }
    };
  }, [profileLoadTimeout]);

  // Debug logging to see what's happening (reduced to prevent spam)
  if (user && !personalProfile) {
    console.log('ProtectedRoute Debug:', {
      user: 'SIGNED IN',
      userId: user?.id,
      userEmail: user?.email,
      personalProfile: 'NULL',
      isLoadingProfile,
      pathname
    });
  }

  // Wait for store to hydrate
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Show loading for profile only for a limited time, then show content anyway
  if (isLoadingProfile && !forceStopLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="text-center w-full max-w-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {displayTitle}
            </h1>
            <div className="text-gray-600 mb-8 h-12 flex items-center justify-center">
              <p className="text-center">
                {displayDescription}
              </p>
            </div>
            <div className="mt-6 w-full flex justify-center">
              <AuthButton onClick={() => showLogin()}>
                Continue
              </AuthButton>
            </div>
          </div>
        </div>

      </>
    );
  }

  // User is authenticated - show content (profile is optional)
  if (user) {
    console.log('ProtectedRoute: User authenticated, showing content');
    return <>{children}</>;
  }

  // This should never be reached due to the !user check above
  return null;
}