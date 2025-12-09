"use client";

import React, { useEffect, useState, useMemo } from 'react';
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
  const { user, loading, loadUserProfile, supabase, account } = useAuth();
  const { personalProfile, isHydrated, setPersonalProfile } = useAppStore();
  const { showLogin } = useModal();
  const pathname = usePathname();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileLoadTimeout, setProfileLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [forceStopLoading, setForceStopLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Note: Removed aggressive subscription cleanup that was causing chat freezing
  // The SimpleChatService now handles subscription management properly

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
          description: "Log in / sign up to view your chats and messages with friends",
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

  // Lock body scroll on desktop when showing sign-in fallback
  useEffect(() => {
    if (!user && !personalProfile) {
      if (window.innerWidth >= 1024) { // lg breakpoint
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      }
    }
    
    return () => {
      if (!user && !personalProfile) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };
  }, [user, personalProfile]);

  // Add timeout to prevent infinite loading - more reasonable timing
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isHydrated || loading) {
        console.log('ProtectedRoute: Loading timeout reached, forcing stop');
        setLoadingTimeout(true);
      }
    }, 8000); // 8 second timeout - give more time for account loading

    return () => clearTimeout(timeout);
  }, [isHydrated, loading]);

  // Force timeout if hydration takes too long - more reasonable timing
  useEffect(() => {
    if (!isHydrated) {
      const immediateTimeout = setTimeout(() => {
        console.log('ProtectedRoute: Hydration timeout - forcing hydration');
        setLoadingTimeout(true);
      }, 5000); // 5 second timeout - give more time for hydration

      return () => clearTimeout(immediateTimeout);
    }
  }, []);

  // Load profile only when user changes or when no profile exists
  useEffect(() => {
    console.log('ProtectedRoute: Profile loading check:', {
      hasUser: !!user,
      userId: user?.id,
      isLoadingProfile,
      isHydrated,
      hasPersonalProfile: !!personalProfile,
      personalProfileId: personalProfile?.id
    });
    
    // Add a small delay to prevent rapid-fire calls
    const timeoutId = setTimeout(() => {
      const loadProfileInstantly = async () => {
        if (!user || !isHydrated) {
          return;
        }

        // Skip if already loading or if profile already exists
        if (isLoadingProfile || personalProfile) {
          console.log('ProtectedRoute: Skipping - already loading or profile exists');
          return;
        }

      console.log('ProtectedRoute: Loading profile from database');
      console.log('ProtectedRoute: Current profile state:', {
        hasProfile: !!personalProfile,
        profileId: personalProfile?.id,
        profileBio: personalProfile?.bio,
        bioLength: personalProfile?.bio?.length || 0
      });
      
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
        
        console.log('ProtectedRoute: 🔍 PRIORITIZING LIVE DATA - Always loading fresh from Supabase first');
        
        // ALWAYS load fresh data from Supabase first for real-time sync
        try {
          console.log('ProtectedRoute: 🔍 Loading FRESH profile from database for user:', user.id);
          const { profile: freshProfile, error: profileError } = await loadUserProfile();
          
          console.log('ProtectedRoute: 🔍 Fresh profile result:', { 
            hasProfile: !!freshProfile, 
            profileName: freshProfile?.name,
            profileBio: freshProfile?.bio,
            hasAvatar: !!freshProfile?.avatarUrl,
            error: profileError?.message 
          });
          
          if (!profileError && freshProfile) {
            console.log('ProtectedRoute: ✅ Profile loaded from database:', {
              id: freshProfile.id,
              name: freshProfile.name,
              bio: freshProfile.bio,
              hasAvatar: !!freshProfile.avatarUrl,
              bioLength: freshProfile.bio?.length || 0,
              fullProfileData: freshProfile
            });
            
            console.log('ProtectedRoute: 🔄 Setting profile in app store...');
            setPersonalProfile(freshProfile);
            
            // Verify it was set correctly
            setTimeout(() => {
              const currentProfile = useAppStore.getState().personalProfile;
              console.log('ProtectedRoute: ✅ Profile verification after setting:', {
                wasSet: !!currentProfile,
                profileId: currentProfile?.id,
                profileName: currentProfile?.name,
                profileBio: currentProfile?.bio,
                bioLength: currentProfile?.bio?.length || 0
              });
            }, 100);
          } else if (profileError) {
            console.error('ProtectedRoute: ❌ Error loading profile:', profileError);
            // Try direct database lookup as fallback
            if (user?.id && supabase) {
              console.log('ProtectedRoute: 🔍 Trying direct database lookup as fallback...');
              const { data: directProfile, error: directError } = await supabase
                .from('accounts')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
                
              if (!directError && directProfile) {
                console.log('ProtectedRoute: ✅ Found profile via direct lookup');
                const mappedProfile = {
                  id: directProfile.id,
                  name: directProfile.name,
                  bio: directProfile.bio,
                  avatarUrl: directProfile.profile_pic,
                  email: user.email || '',
                  phone: user.phone || '',
                  dateOfBirth: directProfile.dob || '',
                  connectId: directProfile.connect_id || '',
                  createdAt: directProfile.created_at,
                  updatedAt: directProfile.updated_at
                };
                setPersonalProfile(mappedProfile);
                console.log('ProtectedRoute: ✅ Profile set successfully:', mappedProfile);
              }
            }
          } else {
            // No error but no profile data - user might not have a profile yet
            console.log('ProtectedRoute: ℹ️ No profile found for user, this is normal for new users');
          }
        } catch (error) {
          console.error('ProtectedRoute: ❌ Error loading fresh profile:', error);
        } finally {
          setIsLoadingProfile(false);
          console.log('ProtectedRoute: ⚡ INSTANT profile loading completed');
        }
      } catch (outerError) {
        console.error('ProtectedRoute: ❌ Outer error in profile loading:', outerError);
        setIsLoadingProfile(false);
      }
    };

      // Load immediately - no setTimeout or delays
      loadProfileInstantly();
    }, 100); // Small delay to prevent rapid-fire calls
    
    return () => clearTimeout(timeoutId);
  }, [user?.id, isHydrated, isLoadingProfile, personalProfile?.id]);

  // Profile loading is now handled naturally without timeouts

  // Memoize the rendered content to prevent excessive re-renders
  const content = useMemo(() => {
    // Enhanced debug logging to see what's happening (only when memoized value changes)
    // console.log('🔍 ProtectedRoute Debug:', {
    //   hasUser: !!user,
    //   userId: user?.id,
    //   hasPersonalProfile: !!personalProfile,
    //   personalProfileId: personalProfile?.id,
    //   isLoadingProfile,
    //   isHydrated,
    //   loadingTimeout,
    //   pathname,
    //   loading
    // });

    // 🚀 BULLETPROOF: If we have profile data, show content immediately (no loading screens)
    if (personalProfile && !loadingTimeout) {
      // console.log('🚀 BULLETPROOF: Profile exists, showing content immediately - no loading screens');
      return <>{children}</>;
    }

  // Wait for store to hydrate - but only if user exists AND no profile yet
  if (!isHydrated && !loadingTimeout && user && !personalProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show loading for signed-in users who are loading their profile AND no profile exists yet
  if (loading && !loadingTimeout && user && !personalProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Force timeout after 5 seconds - but only show login screen if no user
  if (loadingTimeout && !user) {
    console.log('ProtectedRoute: Timeout reached, showing login screen');
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
        <button
          onClick={() => {
            console.log('ProtectedRoute: Sign in button clicked after timeout');
            try {
              if (showLogin && typeof showLogin === 'function') {
                showLogin();
              } else {
                window.location.replace('/');
              }
            } catch (error) {
              console.error('ProtectedRoute: Error after timeout:', error);
              window.location.replace('/');
            }
          }}
          className="bg-orange-500 text-white px-8 py-4 font-semibold shadow-md hover:bg-orange-600 transition-colors"
          style={{ borderRadius: '10px' }}
        >
          Sign in
        </button>
      </div>
    );
  }

  // Don't show loading animation for profile loading - let content render immediately
  // Profile will load in the background

  // 🚀 BULLETPROOF: Only show login screen if BOTH user AND personalProfile are missing
  // This prevents the flash during client-side navigation when profile is set but user hasn't loaded yet
  // BUT: Allow public routes to render content even without user
  // CRITICAL: Allow signing-out page (it handles its own sign out)
  const isPublicRoute = pathname === '/' || 
                        pathname === '/signing-out' ||
                        pathname.startsWith('/explore') ||
                        pathname.startsWith('/for-you-listings') ||
                        pathname.startsWith('/casual-listings') ||
                        pathname.startsWith('/side-quest-listings') ||
                        (pathname === '/listing' || pathname.startsWith('/listing?'));
  
  console.log('🔍 ProtectedRoute: Access check', {
    pathname,
    hasUser: !!user,
    hasPersonalProfile: !!personalProfile,
    isPublicRoute,
    willShowLogin: !user && !personalProfile && !isPublicRoute
  });
  
  if (!user && !personalProfile && !isPublicRoute) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Title - matches PageHeader positioning - only on mobile */}
        <div className="lg:hidden absolute left-0 right-0 z-20" style={{ 
          paddingTop: 'max(env(safe-area-inset-top), 70px)',
          paddingBottom: '16px',
          pointerEvents: 'none'
        }}>
          <div className="px-8">
            <h1 
              className="font-semibold text-gray-900 text-center"
              style={{ 
                textAlign: 'center', 
                width: '100%', 
                display: 'block',
                fontSize: '22px',
                lineHeight: '28px'
              }}
            >
              {displayTitle}
            </h1>
          </div>
        </div>

        {/* Sign in button - centered */}
        <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
          <button
            onClick={() => {
              console.log('ProtectedRoute: Sign in button clicked, calling showLogin');
              try {
                if (!showLogin || typeof showLogin !== 'function') {
                  console.error('ProtectedRoute: showLogin is not available or not a function:', typeof showLogin);
                  window.location.replace('/');
                  return;
                }
                showLogin();
                console.log('ProtectedRoute: showLogin called successfully');
              } catch (error) {
                console.error('ProtectedRoute: Error calling showLogin:', error);
                window.location.replace('/');
              }
            }}
            className="bg-orange-500 text-white px-8 py-4 font-semibold transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
              borderRadius: '10px',
              borderWidth: '0.4px',
              borderColor: 'rgba(251, 146, 60, 0.3)',
              borderStyle: 'solid',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

    // If we have a user but timeout occurred, still show content (auth is working)
    if (loadingTimeout && user && personalProfile) {
      console.log('ProtectedRoute: Timeout occurred but user is authenticated, showing content');
      return <>{children}</>;
    }

    // User is authenticated, render children
    return <>{children}</>;
  }, [user, personalProfile, isLoadingProfile, isHydrated, loadingTimeout, pathname, loading, children]);
  
  return content;
}
