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
  const { user, loading, loadUserProfile, createProfileIfNeeded, clearProfileCache, supabase } = useAuth();
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

  // Load profile IMMEDIATELY when user is authenticated - no delays
  useEffect(() => {
    console.log('ProtectedRoute: INSTANT profile loading triggered:', {
      hasUser: !!user,
      userId: user?.id,
      isLoadingProfile,
      isHydrated,
      hasPersonalProfile: !!personalProfile,
      personalProfileId: personalProfile?.id
    });
    
    const loadProfileInstantly = async () => {
      if (!user || !isHydrated) {
        return;
      }

      // Check if we have a valid profile (not just matching ID, but actual data)
      if (personalProfile && personalProfile.id === user.id && personalProfile.name && personalProfile.name !== 'User') {
        console.log('ProtectedRoute: ✅ Valid profile already loaded for user, skipping reload');
        return;
      }
      
      if (personalProfile && personalProfile.id === user.id && (!personalProfile.name || personalProfile.name === 'User')) {
        console.log('ProtectedRoute: ⚠️ Profile ID matches but data is incomplete - will reload');
      }

      // Don't start loading if already in progress
      if (isLoadingProfile) {
        console.log('ProtectedRoute: Already loading, skipping...');
        return;
      }
      
      console.log('ProtectedRoute: 🚀 INSTANT profile loading - no delays!');
      setIsLoadingProfile(true);
      
      try {
        // Check for stored profile data FIRST (check multiple storage locations)
        let existingProfile = typeof window !== 'undefined' ? (window as any).__CONNECT_EXISTING_PROFILE__ : null;
        
        // If not found in window, check localStorage backup
        if (!existingProfile && typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('__CONNECT_TEMP_PROFILE__');
            if (stored) {
              existingProfile = JSON.parse(stored);
              console.log('ProtectedRoute: 📦 Found profile in localStorage backup');
              // Clean up localStorage after using it
              localStorage.removeItem('__CONNECT_TEMP_PROFILE__');
            }
          } catch (e) {
            console.warn('ProtectedRoute: Error reading localStorage backup:', e);
          }
        }
        
        console.log('ProtectedRoute: 🔍 Checking for stored profile data:', {
          hasWindow: typeof window !== 'undefined',
          hasStoredProfile: !!existingProfile,
          storedProfileId: existingProfile?.id,
          storedProfileName: existingProfile?.full_name,
          currentUserId: user?.id,
          foundInWindow: !!(typeof window !== 'undefined' && (window as any).__CONNECT_EXISTING_PROFILE__),
          foundInLocalStorage: !!existingProfile && !(typeof window !== 'undefined' && (window as any).__CONNECT_EXISTING_PROFILE__)
        });
        
        if (existingProfile) {
          console.log('ProtectedRoute: ⚡ INSTANT profile from stored data (will load fresh avatar):', existingProfile);
          
          // Set profile IMMEDIATELY with stored data, but load fresh avatar
          const profile = {
            id: existingProfile.id,
            name: existingProfile.full_name || '',
            bio: existingProfile.bio || '',
            avatarUrl: existingProfile.avatar_url, // Will be null, so avatar loads fresh
            email: existingProfile.email || '',
            phone: existingProfile.phone || '',
            dateOfBirth: existingProfile.date_of_birth || '',
            connectId: existingProfile.connect_id || '',
            createdAt: existingProfile.created_at,
            updatedAt: existingProfile.updated_at
          };
          
          setPersonalProfile(profile);
          delete (window as any).__CONNECT_EXISTING_PROFILE__;
          console.log('ProtectedRoute: ⚡ Profile set INSTANTLY from stored data');
          
          // Load fresh profile from database to ensure data consistency
          console.log('ProtectedRoute: 🖼️ Loading fresh profile from database to ensure consistency...');
          try {
            const { profile: freshProfile, error: avatarError } = await loadUserProfile();
            console.log('ProtectedRoute: 🔍 Fresh profile result:', { 
              hasProfile: !!freshProfile, 
              hasAvatar: !!freshProfile?.avatarUrl,
              avatarUrl: freshProfile?.avatarUrl,
              error: avatarError?.message 
            });
            
            if (!avatarError && freshProfile) {
              console.log('ProtectedRoute: ✅ Fresh profile loaded, updating with database data');
              setPersonalProfile(freshProfile);
            } else {
              console.log('ProtectedRoute: ⚠️ Fresh profile loading failed, using stored data as fallback');
              // Keep the stored profile as fallback
            }
          } catch (error) {
            console.error('ProtectedRoute: ❌ Exception loading fresh profile:', error);
            console.log('ProtectedRoute: 🔄 Using stored data as fallback');
          }
        } else {
          // Load from database (but make it fast)
          console.log('ProtectedRoute: 🔍 Loading profile from database for user:', user?.id);
          const { profile, error } = await loadUserProfile();
          
          if (profile) {
            console.log('ProtectedRoute: ✅ Profile loaded from database:', profile);
            setPersonalProfile(profile);
          } else if (error) {
            console.error('ProtectedRoute: ❌ Error loading profile:', error);
          } else {
            console.log('ProtectedRoute: ❌ No profile found for user:', user?.id);
            console.log('ProtectedRoute: 🔍 Searching for profile by email/phone instead...');
            
            // Try to find profile by email or phone
            if (user?.email) {
              console.log('ProtectedRoute: 🔍 Searching by email:', user.email);
              const { data: profileByEmail } = await supabase
                .from('accounts')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
                
              if (profileByEmail) {
                console.log('ProtectedRoute: ✅ Found profile by email, updating auth user ID');
                
                // Map and set the profile directly
                console.log('ProtectedRoute: ✅ Profile found, setting in app state');
                const mappedProfile = {
                  id: profileByEmail.id,
                  name: profileByEmail.name,
                  bio: profileByEmail.bio,
                  avatarUrl: profileByEmail.profile_pic,
                  email: user.email, // From auth user
                  phone: user.phone, // From auth user  
                  dateOfBirth: profileByEmail.dob,
                  connectId: profileByEmail.connect_id,
                  createdAt: profileByEmail.created_at,
                  updatedAt: profileByEmail.updated_at
                };
                setPersonalProfile(mappedProfile);
                console.log('ProtectedRoute: ✅ Profile set successfully:', mappedProfile);
              }
            }
          }
        }
      } catch (error) {
        console.error('ProtectedRoute: Error in instant profile loading:', error);
      } finally {
        setIsLoadingProfile(false);
        console.log('ProtectedRoute: ⚡ INSTANT profile loading completed');
      }
    };

    // Load immediately - no setTimeout or delays
    loadProfileInstantly();
  }, [user, isHydrated]);

  // Profile loading is now handled naturally without timeouts

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

  // Don't show loading animation for profile loading - let content render immediately
  // Profile will load in the background

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <div className="login-screen flex flex-col items-center justify-center h-screen bg-gray-50 p-4 overflow-hidden">
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
              <AuthButton onClick={() => {
                console.log('ProtectedRoute: Continue button clicked, calling showLogin');
                console.log('ProtectedRoute: Modal context available:', !!showLogin);
                console.log('ProtectedRoute: Current user state:', !!user);
                console.log('ProtectedRoute: Loading state:', loading);
                
                try {
                  // First check if we're in a broken state
                  if (!showLogin || typeof showLogin !== 'function') {
                    console.error('ProtectedRoute: showLogin is not available or not a function:', typeof showLogin);
                    console.log('ProtectedRoute: Forcing immediate page reload to reset state');
                    window.location.replace('/');
                    return;
                  }
                  
                  // Try to call showLogin
                  showLogin();
                  console.log('ProtectedRoute: showLogin called successfully');
                  
                  // Give modal more time to open and check for different modal selectors
                  setTimeout(() => {
                    const modalExists = document.querySelector('[role="dialog"]') || 
                                     document.querySelector('.modal') ||
                                     document.querySelector('[data-modal]') ||
                                     document.querySelector('.fixed.inset-0') ||
                                     document.querySelector('.z-50');
                    
                    if (!modalExists) {
                      console.warn('ProtectedRoute: Modal did not open after 3 seconds, checking if we should reload');
                      
                      // Only reload if we're still in a bad state (no user and no modal)
                      if (!user && !loading) {
                        console.log('ProtectedRoute: Still in bad state, forcing reload');
                        window.location.replace('/');
                      } else {
                        console.log('ProtectedRoute: State seems OK, not reloading');
                      }
                    } else {
                      console.log('ProtectedRoute: Modal opened successfully');
                    }
                  }, 3000); // Increased from 1 second to 3 seconds
                  
                } catch (error) {
                  console.error('ProtectedRoute: Error calling showLogin:', error);
                  console.error('ProtectedRoute: Error stack:', error?.stack);
                  
                  // Force immediate page reload as fallback
                  console.log('ProtectedRoute: Forcing immediate page reload due to error');
                  window.location.replace('/');
                }
              }}>
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