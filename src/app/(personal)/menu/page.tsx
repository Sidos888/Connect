"use client";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Link from "next/link";
import ProfileStrip from "@/components/my-life/ProfileStrip";
import { useAppStore, useCurrentBusiness } from "@/lib/store";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ChevronDownIcon, BellIcon, ChevronLeftIcon } from "@/components/icons";
import { LogOut, Trash2, ChevronRightIcon, Eye, Pencil, Settings, MoreVertical, Plus } from "lucide-react";
import { connectionsService, User as ConnectionUser, FriendRequest } from '@/lib/connectionsService';
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import { supabase as supabaseClient } from "@/lib/supabaseClient";
import AccountSwitcherSwipeModal from "@/components/AccountSwitcherSwipeModal";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import ImagePicker from "@/components/ImagePicker";
import LoadingSpinner from "@/components/LoadingSpinner";
import UnifiedProfileCard from "@/components/profile/UnifiedProfileCard";
import ThreeDotLoading from "@/components/ThreeDotLoading";
import ThreeDotLoadingBounce from "@/components/ThreeDotLoadingBounce";

// Module-level cache for connections (persists across component mounts)
let connectionsCache: {
  data: any[] | null;
  timestamp: number | null;
  userId: string | null;
} = { data: null, timestamp: null, userId: null };

// FORCE RECOMPILE 2025-09-18
export default function Page() {
  const router = useRouter();
  const { personalProfile, context, resetMenuState } = useAppStore();
  const { signOut, deleteAccount, user, updateProfile, uploadAvatar, account, refreshAuthState, loadUserProfile } = useAuth();
  const currentBusiness = useCurrentBusiness();
  const [currentView, setCurrentView] = React.useState<'menu' | 'settings' | 'connections' | 'add-person' | 'friend-requests' | 'profile' | 'edit-profile' | 'friend-profile'>('menu');
  const [showAccountSwitcher, setShowAccountSwitcher] = React.useState(false);
  const [selectedFriend, setSelectedFriend] = React.useState<ConnectionUser | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);
  const profileMenuButtonRef = React.useRef<HTMLButtonElement | null>(null);

  // Close profile dropdown on outside tap/click, but ignore clicks on the kebab button
  React.useEffect(() => {
    if (!isProfileMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const clickedInsideMenu = !!(profileMenuRef.current && target && profileMenuRef.current.contains(target));
      const clickedButton = !!(profileMenuButtonRef.current && target && profileMenuButtonRef.current.contains(target));
      if (!clickedInsideMenu && !clickedButton) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isProfileMenuOpen]);

  // Open profile view if query param view=profile is present
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'profile') setCurrentView('profile');
    if (view === 'connections') setCurrentView('connections');
    if (view === 'add-person' || view === 'add-friends') setCurrentView('add-person');
  }, []);

  const handleFriendClick = (friend: ConnectionUser) => {
    setSelectedFriend(friend);
    setCurrentView('friend-profile');
  };

  // Reset menu state when resetMenuState is called
  React.useEffect(() => {
    const handleReset = () => {
      setCurrentView('menu');
      setShowAccountSwitcher(false);
    };
    
    // Listen for resetMenuState custom event
    window.addEventListener('resetMenuState', handleReset);
    
    return () => {
      window.removeEventListener('resetMenuState', handleReset);
    };
  }, []);

  // Hide bottom nav when in edit profile mode
  React.useEffect(() => {
    const hideBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none';
        (bottomNav as HTMLElement).style.visibility = 'hidden';
        (bottomNav as HTMLElement).style.opacity = '0';
        (bottomNav as HTMLElement).style.transform = 'translateY(100%)';
      }
      document.body.style.paddingBottom = '0';
    };

    const showBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
        (bottomNav as HTMLElement).style.visibility = '';
        (bottomNav as HTMLElement).style.opacity = '';
        (bottomNav as HTMLElement).style.transform = '';
      }
      document.body.style.paddingBottom = '';
    };
    
    if (currentView === 'edit-profile' || currentView === 'profile' || currentView === 'friend-profile') {
      hideBottomNav();
    } else {
      showBottomNav();
    }
    
    return () => {
      showBottomNav();
    };
  }, [currentView]);

  // Load fresh profile data when menu loads
  React.useEffect(() => {
    if (user && !account) {
      console.log('Menu: User exists but no account in auth context, loading profile...');
      if (loadUserProfile) {
        loadUserProfile().then(({ profile, error }) => {
          if (error) {
            console.error('Menu: Error loading profile:', error);
          } else if (profile) {
            console.log('Menu: Profile loaded successfully:', profile);
            // The auth context should automatically update the account state
          }
        });
      }
    }
  }, [user, account, loadUserProfile]);

  // Get current account info - prioritize auth context account over local storage
  const currentAccount = context.type === "business" && currentBusiness 
    ? { name: currentBusiness.name, avatarUrl: currentBusiness.logoUrl, bio: currentBusiness.bio }
    : account 
      ? { name: account.name, avatarUrl: account.profile_pic, bio: account.bio }
      : { name: personalProfile?.name, avatarUrl: personalProfile?.avatarUrl, bio: personalProfile?.bio };

  // Debug logging for bio and auth context
  console.log('Menu Debug - Auth Context:', {
    hasUser: !!user,
    userId: user?.id,
    hasAccount: !!account,
    accountId: account?.id,
    accountName: account?.name,
    accountBio: account?.bio,
    accountProfilePic: account?.profile_pic
  });
  console.log('Menu Debug - App Store:', {
    hasPersonalProfile: !!personalProfile,
    personalProfileId: personalProfile?.id,
    personalProfileName: personalProfile?.name,
    personalProfileBio: personalProfile?.bio
  });
  console.log('Menu Debug - currentAccount:', currentAccount);
  console.log('Menu Debug - bio exists:', !!currentAccount?.bio);
  console.log('Menu Debug - bio content:', currentAccount?.bio);

  // No-op: snapshot capture removed

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      const { error } = await deleteAccount();
      if (error) {
        alert('Error deleting account: ' + error.message);
      } else {
        router.push('/');
      }
    }
  };

  // Edit Profile Component
  const EditProfileView = () => {
    const [formData, setFormData] = React.useState({
      name: account?.name || currentAccount?.name || '',
      bio: account?.bio || currentAccount?.bio || '',
      profilePicture: null as File | null,
      profilePicturePreview: account?.profile_pic || currentAccount?.avatarUrl || ''
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    // Update form data when auth context account changes
    React.useEffect(() => {
      if (account) {
        console.log('EditProfile: Auth context account changed, updating form data:', {
          accountName: account.name,
          accountBio: account.bio,
          accountProfilePic: account.profile_pic
        });
        setFormData(prev => ({
          ...prev,
          name: account.name || prev.name,
          bio: account.bio || prev.bio,
          profilePicturePreview: account.profile_pic || prev.profilePicturePreview
        }));
      }
    }, [account]);

    const handleInputChange = (field: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleImageChange = (file: File | null, dataUrl: string | null) => {
      setFormData(prev => ({
        ...prev,
        profilePicture: file,
        profilePicturePreview: dataUrl || prev.profilePicturePreview
      }));
    };

    const handleSave = async () => {
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Mobile environment detection for debugging
        const isCapacitor = typeof window !== 'undefined' && !!(window as unknown as { Capacitor?: unknown }).Capacitor;
        const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        console.log('EditProfile: Starting save process with data:', {
          name: formData.name.trim(),
          bio: formData.bio.trim(),
          hasProfilePicture: !!formData.profilePicture,
          currentAvatarUrl: currentAccount?.avatarUrl,
          isMobileDevice: isCapacitor || isMobile,
          isCapacitor,
          isMobile,
          userAgent: navigator.userAgent
        });

        // First handle profile picture upload if there's a new one
        let avatarUrl = formData.profilePicturePreview;
        if (formData.profilePicture && uploadAvatar) {
          console.log('EditProfile: Uploading new profile picture...');
          const { url, error: uploadError } = await uploadAvatar(formData.profilePicture);
          if (uploadError) {
            console.error('EditProfile: Avatar upload failed:', uploadError);
            setError('Failed to upload profile picture');
            return;
          }
          avatarUrl = url || avatarUrl;
          console.log('EditProfile: Avatar uploaded successfully:', url);
        }

        // Update profile in database using auth context
        if (!updateProfile) {
          console.error('EditProfile: updateProfile method not available');
          setError('Profile update not available');
          return;
        }

        console.log('EditProfile: Updating profile in database...');
        console.log('EditProfile: Update data being sent:', {
          name: formData.name.trim(),
          bio: formData.bio.trim(),
          avatarUrl: avatarUrl,
          currentAccountId: account?.id,
          hasUpdateProfileFunction: !!updateProfile
        });
        
        const { error: updateError } = await updateProfile({
          name: formData.name.trim(),
          bio: formData.bio.trim(),
          avatarUrl: avatarUrl
        });
        
        console.log('EditProfile: Update result:', { updateError });

        if (updateError) {
          console.warn('EditProfile: updateProfile failed, attempting direct Supabase update fallback');
          try {
            if (!user?.id) throw new Error('No user ID for direct update');
            const result = await supabaseClient
              ?.from('accounts')
              .update({ name: formData.name.trim(), bio: formData.bio.trim(), profile_pic: avatarUrl })
              .eq('id', user.id);
            if (result?.error) {
              console.error('EditProfile: Direct Supabase update failed:', result.error);
              setError('Failed to save profile changes');
              setLoading(false);
              return;
            }
            console.log('EditProfile: Direct Supabase update succeeded');
          } catch (e) {
            console.error('EditProfile: Direct update exception:', e);
            setError('Failed to save profile changes');
            setLoading(false);
            return;
          }
        }

        console.log('EditProfile: Profile updated successfully in database');

        // Refresh auth state to get the latest account data from database
        console.log('EditProfile: Refreshing auth state to sync with database...');
        if (refreshAuthState) {
          await refreshAuthState();
          console.log('EditProfile: Auth state refreshed');
        }

        // Update local app store for immediate UI update - sync with auth context account
        const { setPersonalProfile } = useAppStore.getState();
        const updatedProfile = {
          ...personalProfile,
          id: account?.id || personalProfile?.id || user?.id || '',
          name: formData.name.trim(),
          bio: formData.bio.trim(),
          avatarUrl: avatarUrl,
          email: personalProfile?.email || user?.email || '',
          phone: personalProfile?.phone || user?.phone || '',
          dateOfBirth: account?.dob || personalProfile?.dateOfBirth || '',
          connectId: account?.connect_id || personalProfile?.connectId || '',
          createdAt: account?.created_at || personalProfile?.createdAt || new Date().toISOString(),
          updatedAt: account?.updated_at || new Date().toISOString()
        };
        setPersonalProfile(updatedProfile);
        
        console.log('EditProfile: Local store updated with auth context data, navigating back to menu');
        
        // Force a page refresh to ensure we're displaying the latest data
        setTimeout(() => {
          console.log('EditProfile: Forcing page refresh to show updated data');
          window.location.reload();
        }, 100);
        
        setCurrentView('menu');
      } catch (err) {
        console.error('EditProfile: Unexpected error during save:', err);
        setError('Failed to save profile');
      } finally {
        setLoading(false);
      }
    };

    // Lock background scroll while edit modal is open (web)
    React.useEffect(() => {
      document.body.classList.add('no-scroll');
      return () => document.body.classList.remove('no-scroll');
    }, []);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/50" onClick={() => setCurrentView('profile')} />
        {/* Centered card */}
        <div className="relative bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Header inside card */}
          <div className="px-4 pb-4 pt-6">
            <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <button
                onClick={() => setCurrentView('profile')}
                className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
                aria-label="Back to profile"
              >
                <span className="back-btn-circle">
                  <ChevronLeftIcon className="h-5 w-5" />
                </span>
              </button>
              <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Edit Profile</h1>
            </div>
          </div>

          {/* Scrollable content inside card */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            <div className="space-y-5">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center justify-center py-1">
                <div className="flex justify-center">
                  <ImagePicker
                    onChange={handleImageChange}
                    initialPreviewUrl={formData.profilePicturePreview}
                    shape="circle"
                    size={100}
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                {/* Name Field */}
                <div>
                  <Input
                    type="text"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full text-base border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    required
                  />
                </div>

                {/* Bio Field */}
                <div>
                  <div className="relative">
                    <TextArea
                      placeholder="Tell us about yourself..."
                      value={formData.bio}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 150) {
                          handleInputChange('bio', value);
                        }
                      }}
                      className="w-full text-base border-gray-200 focus:border-gray-400 focus:ring-gray-400 resize-none pr-16"
                      rows={4}
                      maxLength={150}
                    />
                    {/* Character counter inside the textarea */}
                    <div className="absolute bottom-2 right-2 pointer-events-none">
                      <span className={`text-xs font-medium ${formData.bio.length > 135 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {formData.bio.length}/150
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer actions inside card */}
          <div className="px-4 py-4 border-t border-neutral-200">
            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={handleSave}
                disabled={loading || !formData.name.trim()}
                className="w-full h-12 text-base font-semibold flex items-center justify-center gap-2"
                style={{ backgroundColor: '#3b82f6' }}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView('profile')}
                className="text-base font-medium underline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Profile View Component
  const ProfileView = () => {
    return (
      <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white">
        <UnifiedProfileCard
          profile={{
            id: currentAccount?.id,
            name: currentAccount?.name,
            avatarUrl: currentAccount?.avatarUrl,
            bio: currentAccount?.bio
          }}
          isOwnProfile={true}
          showBackButton={true}
          onClose={() => setCurrentView('menu')}
          onEdit={() => setCurrentView('edit-profile')}
          onSettings={() => router.push('/settings')}
          onShare={() => router.push('/share-profile')}
          onOpenTimeline={() => router.push('/timeline')}
          onOpenHighlights={() => {}}
          onOpenBadges={() => {}}
          onOpenConnections={() => setCurrentView('connections')}
        />
      </div>
    );
  };

  // Connections Component
  const ConnectionsView = () => {
    const [activeTab, setActiveTab] = React.useState<'friends' | 'following'>('friends');
    const [peopleConnections, setPeopleConnections] = React.useState<any[]>([]);
    const [businessConnections, setBusinessConnections] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
    const { account } = useAuth();

    // Load real connections data with module-level caching
    React.useEffect(() => {
      let cancelled = false;
      const loadConnections = async () => {
        if (!account?.id) {
          // Soft-retry if account not ready yet
          setLoading(true);
          setTimeout(() => { if (!cancelled) loadConnections(); }, 300);
          return;
        }

        // Check cache validity (using module-level cache)
        const now = Date.now();
        const cacheAge = connectionsCache.timestamp ? now - connectionsCache.timestamp : Infinity;
        const isCacheFresh = cacheAge < 5 * 60 * 1000; // 5 minutes
        const isSameUser = connectionsCache.userId === account.id;

        // Show cached data immediately if available and fresh
        if (connectionsCache.data && isCacheFresh && isSameUser) {
          console.log('🚀 Mobile ConnectionsView: Using cached connections (age: ' + Math.round(cacheAge / 1000) + 's)');
          setPeopleConnections(connectionsCache.data);
          setLoading(false);
          setHasLoadedOnce(true);
        }

        try {
          const { connections: userConnections, error } = await connectionsService.getConnections(account.id);
          if (!error) {
            // For now, all accounts are treated as personal accounts (friends)
            // TODO: Implement business accounts later
            const people = userConnections || [];
            const businesses: any[] = [];
            
            console.log('🔍 Mobile ConnectionsView: Fetched connections:', {
              people: people.length,
              businesses: businesses.length,
              total: userConnections?.length || 0,
              fromCache: isCacheFresh && isSameUser
            });
            
            if (!cancelled) {
            setPeopleConnections(people);
            setBusinessConnections(businesses);
              setHasLoadedOnce(true);
              // Update module-level cache
              connectionsCache = {
                data: people,
                timestamp: now,
                userId: account.id
              };
            }
          } else {
            console.error('Error loading connections:', error);
          }
        } catch (error) {
          console.error('Error loading connections:', error);
        } finally {
          if (!cancelled) {
          setLoading(false);
            setHasLoadedOnce(true);
          }
        }
      };

      loadConnections();

      // Revalidate on window focus and page visibility
      const onFocus = () => { if (account?.id) loadConnections(); };
      const onVisible = () => { if (document.visibilityState === 'visible' && account?.id) loadConnections(); };
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        cancelled = true;
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisible);
      };
    }, [account?.id]);

    // Immediately add connections-mode class to prevent nav bar flash
    React.useLayoutEffect(() => {
      document.body.classList.add('connections-mode');
      document.body.classList.add('no-scroll');
      
      return () => {
        document.body.classList.remove('connections-mode');
        document.body.classList.remove('no-scroll');
      };
    }, []);

    // Hide bottom nav when in connections mode
    React.useEffect(() => {
      const hideBottomNav = () => {
        // Try multiple selectors to find the bottom nav
        const selectors = [
          '[data-testid="mobile-bottom-nav"]',
          '.tabbar-nav',
          'nav[class*="bottom"]',
          'nav[class*="fixed"]',
          '.fixed.bottom-0'
        ];
        
        let bottomNav = null;
        for (const selector of selectors) {
          bottomNav = document.querySelector(selector);
          if (bottomNav) break;
        }
        
        if (bottomNav) {
          (bottomNav as HTMLElement).style.display = 'none !important';
          (bottomNav as HTMLElement).style.visibility = 'hidden !important';
          (bottomNav as HTMLElement).style.opacity = '0 !important';
          (bottomNav as HTMLElement).style.transform = 'translateY(100%) !important';
          (bottomNav as HTMLElement).style.position = 'fixed !important';
          (bottomNav as HTMLElement).style.bottom = '-100px !important';
          (bottomNav as HTMLElement).style.zIndex = '-1 !important';
        }
        
        // Also try to hide by class
        const navElements = document.querySelectorAll('nav');
        navElements.forEach(nav => {
          if (nav.className.includes('bottom') || nav.className.includes('fixed')) {
            (nav as HTMLElement).style.display = 'none !important';
            (nav as HTMLElement).style.visibility = 'hidden !important';
          }
        });
        
        // Add padding to prevent content from being hidden behind nav
        document.body.style.paddingBottom = '0';
        document.documentElement.style.setProperty('--bottom-nav-height', '0px');
      };
      
      const showBottomNav = () => {
        // Try multiple selectors to find the bottom nav
        const selectors = [
          '[data-testid="mobile-bottom-nav"]',
          '.tabbar-nav',
          'nav[class*="bottom"]',
          'nav[class*="fixed"]',
          '.fixed.bottom-0'
        ];
        
        let bottomNav = null;
        for (const selector of selectors) {
          bottomNav = document.querySelector(selector);
          if (bottomNav) break;
        }
        
        if (bottomNav) {
          (bottomNav as HTMLElement).style.display = '';
          (bottomNav as HTMLElement).style.visibility = '';
          (bottomNav as HTMLElement).style.opacity = '';
          (bottomNav as HTMLElement).style.transform = '';
          (bottomNav as HTMLElement).style.position = '';
          (bottomNav as HTMLElement).style.bottom = '';
          (bottomNav as HTMLElement).style.zIndex = '';
        }
        
        // Restore nav elements
        const navElements = document.querySelectorAll('nav');
        navElements.forEach(nav => {
          if (nav.className.includes('bottom') || nav.className.includes('fixed')) {
            (nav as HTMLElement).style.display = '';
            (nav as HTMLElement).style.visibility = '';
          }
        });
        
        document.body.style.paddingBottom = '';
        document.documentElement.style.removeProperty('--bottom-nav-height');
      };
      
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        hideBottomNav();
        // Also add class to body for CSS targeting
        document.body.classList.add('connections-mode');
        document.body.classList.add('no-scroll');
      }, 100);
      
      return () => {
        showBottomNav();
        document.body.classList.remove('connections-mode');
        document.body.classList.remove('no-scroll');
      };
    }, []);

    return (
    <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col" style={{ paddingBottom: '0' }}>
      {/* Header */}
      <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <button
            onClick={() => setCurrentView('menu')}
            className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Back to menu"
          >
            <span className="action-btn-circle">
              <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
            </span>
          </button>
          <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Connections</h1>
          <button
            onClick={() => setCurrentView('add-person')}
            className="absolute right-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Add person"
          >
            <span className="action-btn-circle">
              <Plus className="w-5 h-5 text-gray-900" />
            </span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white px-4 pb-4 pt-2">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-2 text-sm font-medium rounded-2xl transition-all duration-200 ${
              activeTab === 'friends'
                ? 'text-gray-900 bg-white'
                : 'text-gray-500 bg-white'
            }`}
            style={
              activeTab === 'friends'
                ? {
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    transform: 'translateY(-1px)',
                  }
                : {
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }
            }
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-6 py-2 text-sm font-medium rounded-2xl transition-all duration-200 ${
              activeTab === 'following'
                ? 'text-gray-900 bg-white'
                : 'text-gray-500 bg-white'
            }`}
            style={
              activeTab === 'following'
                ? {
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    transform: 'translateY(-1px)',
                  }
                : {
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }
            }
          >
            Following
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && !hasLoadedOnce ? (
          <div className="flex items-center justify-center h-full">
            <ThreeDotLoadingBounce />
            </div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'friends' ? (
            peopleConnections.length > 0 ? (
              peopleConnections.map((connection) => {
                // Get the friend (not the current user) from the connection
                const friend = connection.user1?.id === account?.id ? connection.user2 : connection.user1;
                if (!friend) return null;

                return (
                  <div
                    key={connection.id}
                    className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] p-4 py-8 relative min-h-[80px] cursor-pointer hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] hover:border-[#D1D5DB] transition-all duration-200"
                    style={{
                      boxShadow: `
                        0 0 1px rgba(100, 100, 100, 0.25),
                        inset 0 0 2px rgba(27, 27, 27, 0.25)
                      `
                    }}
                    onClick={() => handleFriendClick(friend)}
                  >
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                      {friend.profile_pic ? (
                        <img src={friend.profile_pic} alt={friend.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 text-lg font-medium">
                          {friend.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="w-full text-center flex items-center justify-center h-full">
                      <h3 className="text-base font-semibold text-gray-900">{friend.name}</h3>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-500 text-sm">No friends yet</p>
                <p className="text-gray-400 text-xs mt-1">Start adding friends to see them here</p>
              </div>
            )
          ) : (
            businessConnections.length > 0 ? (
              businessConnections.map((connection) => {
                // Get the business (not the current user) from the connection
                const business = connection.user1?.id === account?.id ? connection.user2 : connection.user1;
                if (!business) return null;

                return (
                  <div
                    key={connection.id}
                    className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] p-4 py-8 relative min-h-[80px]"
                    style={{
                      boxShadow: `
                        0 0 1px rgba(100, 100, 100, 0.25),
                        inset 0 0 2px rgba(27, 27, 27, 0.25)
                      `
                    }}
                  >
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                      {business.profile_pic ? (
                        <img src={business.profile_pic} alt={business.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 text-lg font-medium">
                          {business.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="w-full text-center flex items-center justify-center h-full">
                      <h3 className="text-base font-semibold text-gray-900">{business.name}</h3>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🏢</div>
                <p className="text-gray-500 text-sm">No businesses followed yet</p>
                <p className="text-gray-400 text-xs mt-1">Start following businesses to see them here</p>
              </div>
            )
          )}
        </div>
        )}
      </div>

    </div>
    );
  };

  // Friend Profile Component
  const FriendProfileView = ({ friend }: { friend: ConnectionUser }) => {
    return (
      <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white">
        <UnifiedProfileCard
          profile={{
            id: friend.id,
            name: friend.name,
            avatarUrl: friend.profile_pic,
            bio: friend.bio
          }}
          isOwnProfile={false}
          showBackButton={true}
          onClose={() => setCurrentView('connections')}
        />
      </div>
    );
  };

  // Add Person Component (merged view: Requests card + Suggested/Search)
  const AddPersonView = () => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<ConnectionUser[]>([]);
    const [suggestedFriends, setSuggestedFriends] = React.useState<ConnectionUser[]>([]);
    const [pendingRequests, setPendingRequests] = React.useState<FriendRequest[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [searchLoading, setSearchLoading] = React.useState(false);
    const [userConnectionStatuses, setUserConnectionStatuses] = React.useState<Record<string, 'none' | 'pending_sent' | 'pending_received' | 'connected'>>({});
    const { account } = useAuth();

    // Load initial data
    React.useEffect(() => {
      console.log('🔍 Mobile AddPersonView: Account state changed:', account ? { id: account.id, name: account.name } : null);
      if (account?.id) {
        console.log('🔍 Mobile AddPersonView: Loading suggested friends and pending requests for account:', account.id);
        loadSuggestedFriends();
        loadPendingRequests();
      } else {
        console.log('🔍 Mobile AddPersonView: No account ID available, skipping data loading');
      }
    }, [account?.id]);

    // Search users with debounce
    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (searchQuery.trim() && account?.id) {
          searchUsers();
        } else {
          setSearchResults([]);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }, [searchQuery, account?.id]);

    const loadSuggestedFriends = async () => {
      if (!account?.id) return;
      
      setLoading(true);
      const { users, error } = await connectionsService.getSuggestedFriends(account.id);
      if (!error) {
        setSuggestedFriends(users);
        // Load connection statuses for suggested friends
        loadConnectionStatuses(users);
      }
      setLoading(false);
    };

    const loadPendingRequests = async () => {
      if (!account?.id) return;
      
      const { requests, error } = await connectionsService.getPendingRequests(account.id);
      if (!error) {
        setPendingRequests(requests);
      }
    };

    const searchUsers = async () => {
      if (!account?.id || !searchQuery.trim()) return;
      
      setSearchLoading(true);
      const { users, error } = await connectionsService.searchUsers(searchQuery, account.id);
      if (!error) {
        setSearchResults(users);
        // Load connection statuses for search results
        loadConnectionStatuses(users);
      }
      setSearchLoading(false);
    };

    const sendFriendRequest = async (userId: string) => {
      if (!account?.id) return;
      
      const { error } = await connectionsService.sendFriendRequest(account.id, userId);
      if (!error) {
        // Update connection status for this user
        setUserConnectionStatuses(prev => ({
          ...prev,
          [userId]: 'pending_sent'
        }));
        console.log('Updated connection status for user', userId, 'to pending_sent');
      } else {
        // Show more user-friendly error messages
        if (error.message.includes('already friends')) {
          alert('You are already friends with this person');
        } else if (error.message.includes('already sent')) {
          alert('Friend request already sent');
        } else {
          alert('Failed to send friend request: ' + error.message);
        }
      }
    };

    // Load connection status for users
    const loadConnectionStatuses = async (users: ConnectionUser[]) => {
      if (!account?.id) return;
      
      const statusPromises = users.map(async (user) => {
        const { status } = await connectionsService.getConnectionStatus(account.id, user.id);
        return { userId: user.id, status };
      });
      
      const statuses = await Promise.all(statusPromises);
      const statusMap: Record<string, 'none' | 'pending_sent' | 'pending_received' | 'connected'> = {};
      statuses.forEach(({ userId, status }) => {
        statusMap[userId] = status;
      });
      
      setUserConnectionStatuses(prev => ({ ...prev, ...statusMap }));
    };

    // Cancel friend request
    const cancelFriendRequest = async (userId: string) => {
      if (!account?.id) return;
      
    const { error } = await connectionsService.cancelFriendRequest(account.id, userId);
    if (!error) {
      // Update connection status for this user back to none
      setUserConnectionStatuses(prev => ({
        ...prev,
        [userId]: 'none'
      }));
      console.log('Cancelled friend request for user', userId, '- status updated to none');
    } else {
        console.error('Error cancelling friend request:', error);
        alert('Failed to cancel friend request: ' + error.message);
      }
    };

    // Get button text and styling based on connection status
    const getButtonConfig = (userId: string) => {
      const status = userConnectionStatuses[userId] || 'none';
      
      switch (status) {
        case 'connected':
          return { text: 'Friends', className: 'px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium cursor-not-allowed' };
        case 'pending_sent':
          return { 
            text: 'Added', 
            className: 'px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1.5' 
          };
        case 'pending_received':
          return { text: 'Accept', className: 'px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors' };
        default:
          return { text: 'Add', className: 'px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors' };
      }
    };

    const acceptFriendRequest = async (requestId: string) => {
      const { error } = await connectionsService.acceptFriendRequest(requestId);
      if (!error) {
        loadPendingRequests();
      }
    };

    const rejectFriendRequest = async (requestId: string) => {
      const { error } = await connectionsService.rejectFriendRequest(requestId);
      if (!error) {
        loadPendingRequests();
      }
    };

    // Hide bottom nav when in add-person mode
    React.useLayoutEffect(() => {
      document.body.classList.add('connections-mode');
      document.body.classList.add('no-scroll');
      
      return () => {
        document.body.classList.remove('connections-mode');
        document.body.classList.remove('no-scroll');
      };
    }, []);

    // Hide bottom nav when in add-person mode
    React.useEffect(() => {
      const hideBottomNav = () => {
        // Try multiple selectors to find the bottom nav
        const selectors = [
          '[data-testid="mobile-bottom-nav"]',
          '.tabbar-nav',
          'nav[class*="bottom"]',
          'nav[class*="fixed"]',
          '.fixed.bottom-0'
        ];
        
        let bottomNav = null;
        for (const selector of selectors) {
          bottomNav = document.querySelector(selector);
          if (bottomNav) break;
        }
        
        if (bottomNav) {
          (bottomNav as HTMLElement).style.display = 'none';
          (bottomNav as HTMLElement).style.visibility = 'hidden';
        }
      };
      
      const showBottomNav = () => {
        const selectors = [
          '[data-testid="mobile-bottom-nav"]',
          '.tabbar-nav',
          'nav[class*="bottom"]',
          'nav[class*="fixed"]',
          '.fixed.bottom-0'
        ];
        
        selectors.forEach(selector => {
          const nav = document.querySelector(selector);
          if (nav) {
            (nav as HTMLElement).style.display = '';
            (nav as HTMLElement).style.visibility = '';
          }
        });
        
        document.body.style.paddingBottom = '';
        document.documentElement.style.removeProperty('--bottom-nav-height');
      };
      
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        hideBottomNav();
      }, 100);
      
      return () => {
        showBottomNav();
      };
    }, []);

    return (
      <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col" style={{ paddingBottom: '0' }}>
        {/* Header */}
        <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
          <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <button
              onClick={() => setCurrentView('connections')}
              className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
              aria-label="Back to connections"
            >
              <span className="action-btn-circle">
                <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
              </span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Find Friends</h1>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {/* Search + Suggested */}
              <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                    placeholder="Search..."
                    className="w-full px-4 py-3 pl-10 bg-white rounded-2xl focus:outline-none focus:ring-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                    }}
                      />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchQuery.trim() && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
                        {searchResults.length > 0 ? (
                          <div className="space-y-2">
                            {searchResults
                              .filter(user => userConnectionStatuses[user.id] !== 'connected')
                              .map((user) => (
                            <div 
                              key={user.id} 
                              className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] p-4 flex items-center justify-between"
                              style={{
                                boxShadow: `
                                  0 0 1px rgba(100, 100, 100, 0.25),
                                  inset 0 0 2px rgba(27, 27, 27, 0.25)
                                `
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                  {user.profile_pic ? (
                                    <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-500 text-sm font-medium">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                                </div>
                              </div>
                              {(() => {
                                const status = userConnectionStatuses[user.id] || 'none';
                                if (status === 'connected') {
                                  return null; // Don't show button for friends
                                }
                                const buttonConfig = getButtonConfig(user.id);
                                return (
                                  <button 
                                    onClick={() => {
                                      if (buttonConfig.text === 'Add') {
                                        sendFriendRequest(user.id);
                                      } else if (buttonConfig.text === 'Added') {
                                        cancelFriendRequest(user.id);
                                      } else if (buttonConfig.text === 'Accept') {
                                        // Handle accept logic if needed
                                      }
                                    }}
                                    className={buttonConfig.className}
                                  >
                                    {buttonConfig.text === 'Added' && (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                    {buttonConfig.text}
                                  </button>
                                );
                              })()}
                            </div>
                          ))}
                        </div>
                      ) : !searchLoading ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">No users found</p>
                        </div>
                      ) : null}
                    </div>
                  )}

              {/* Friend Requests summary card (below search) */}
              {!searchQuery.trim() && (
                <button 
                  onClick={() => setCurrentView('friend-requests')}
                  className="w-full bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] p-5 text-left hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] transition-all"
                  style={{ boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27,27,27,0.25)' }}
                  aria-label="Open friend requests"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Friend Requests</h3>
                    <span className="text-sm font-medium text-gray-700">{pendingRequests.length}</span>
                  </div>
                </button>
                  )}

                {/* Suggested Friends Section */}
                {!searchQuery.trim() && (
                  <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 text-center">Suggested Friends</h3>
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-500 text-sm mt-2">Loading suggestions...</p>
                      </div>
                    ) : suggestedFriends.length > 0 ? (
                      <div className="space-y-2">
                        {suggestedFriends
                          .filter(user => userConnectionStatuses[user.id] !== 'connected')
                          .slice(0, 5)
                          .map((user) => (
                          <div 
                            key={user.id} 
                            className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] p-4 flex items-center justify-between"
                            style={{
                              boxShadow: `
                                0 0 1px rgba(100, 100, 100, 0.25),
                                inset 0 0 2px rgba(27, 27, 27, 0.25)
                              `
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                {user.profile_pic ? (
                                  <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-gray-500 text-sm font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                              </div>
                            </div>
                            {(() => {
                              const status = userConnectionStatuses[user.id] || 'none';
                              if (status === 'connected') {
                                return null; // Don't show button for friends
                              }
                              const buttonConfig = getButtonConfig(user.id);
                              return (
                                <button 
                                  onClick={() => {
                                    if (buttonConfig.text === 'Add') {
                                      sendFriendRequest(user.id);
                                    } else if (buttonConfig.text === 'Added') {
                                      cancelFriendRequest(user.id);
                                    } else if (buttonConfig.text === 'Accept') {
                                      // Handle accept logic if needed
                                    }
                                  }}
                                  className={buttonConfig.className}
                                >
                                  {buttonConfig.text === 'Added' && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  {buttonConfig.text}
                                </button>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">No suggested friends at the moment</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    );
  };

  // Friend Requests full-screen view
  const FriendRequestsView = () => {
    const { account } = useAuth();
    const [requests, setRequests] = React.useState<FriendRequest[]>([]);

    React.useEffect(() => {
      const load = async () => {
        if (!account?.id) return;
        const { requests, error } = await connectionsService.getPendingRequests(account.id);
        if (!error) setRequests(requests);
      };
      load();
    }, [account?.id]);

    const handleAccept = async (requestId: string) => {
      const { error } = await connectionsService.acceptFriendRequest(requestId);
      if (!error) setRequests(prev => prev.filter(r => r.id !== requestId));
    };

    const handleReject = async (requestId: string) => {
      const { error } = await connectionsService.rejectFriendRequest(requestId);
      if (!error) setRequests(prev => prev.filter(r => r.id !== requestId));
    };

    return (
      <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col" style={{ paddingBottom: '0' }}>
        <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
          <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <button
              onClick={() => setCurrentView('add-person')}
              className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
              aria-label="Back to add friends"
            >
              <span className="action-btn-circle">
                <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
              </span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Friend Requests</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] p-4" style={{ boxShadow: '0 0 1px rgba(100,100,100,0.25), inset 0 0 2px rgba(27,27,27,0.25)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {request.sender?.profile_pic ? (
                          <img src={request.sender.profile_pic} alt={request.sender.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500 text-lg font-medium">{request.sender?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{request.sender?.name}</h4>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleReject(request.id)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <button onClick={() => handleAccept(request.id)} className="w-8 h-8 flex items-center justify-center bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📨</div>
              <p className="text-gray-500 text-sm">No pending requests</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute
      title={currentView === 'menu' ? "Menu" : currentView === 'connections' ? "Connections" : currentView === 'add-person' ? "Find Friends" : currentView === 'friend-profile' ? "Profile" : currentView === 'profile' ? "Profile" : "Menu"}
      description="Log in / sign up to access your account settings and preferences"
      buttonText="Log in"
    >
      {currentView === 'connections' ? (
        <ConnectionsView />
      ) : currentView === 'add-person' ? (
        <AddPersonView />
      ) : currentView === 'friend-requests' ? (
        <FriendRequestsView />
      ) : currentView === 'friend-profile' && selectedFriend ? (
        <FriendProfileView friend={selectedFriend} />
      ) : currentView === 'profile' ? (
        <ProfileView />
      ) : currentView === 'edit-profile' ? (
        <EditProfileView />
      ) : currentView === 'menu' ? (
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-6 lg:pt-6">
              {/* Profile Card only (no bio dropdown) */}
              <div className="mb-6 lg:mb-8">
                <div className="max-w-lg mx-auto lg:max-w-xl relative">
                  {/* Profile Card */}
                  <div className="relative z-10">
                    <div
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 grid grid-cols-[40px_1fr_40px] items-center cursor-pointer"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                      }}
                      onClick={() => {
                        setCurrentView('profile');
                      }}
                    >
                      <div className="flex items-center">
                        <Avatar 
                          src={currentAccount?.avatarUrl ?? undefined} 
                          name={currentAccount?.name ?? "Your Name"} 
                          size={36} 
                        />
                      </div>
                      <div className="text-base font-semibold text-gray-900 text-center">
                        {currentAccount?.name ?? "Your Name"}
                      </div>
                      <div
                        className="flex justify-end relative"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        {/* Kebab menu (mobile + web) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsProfileMenuOpen((v) => !v);
                          }}
                          ref={profileMenuButtonRef}
                          className="p-3 -m-3 rounded-full hover:bg-gray-100 transition-colors relative z-30"
                          aria-label="Open profile menu"
                          aria-expanded={isProfileMenuOpen}
                        >
                          <MoreVertical className="h-5 w-5 text-gray-700" />
                        </button>
                        {isProfileMenuOpen && (
                          <div
                            ref={profileMenuRef}
                            role="menu"
                            aria-label="Profile actions"
                            className="absolute -right-5 top-12 z-20 w-56 rounded-2xl border border-neutral-200 bg-white shadow-xl p-1"
                          >
                            <button
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsProfileMenuOpen(false);
                                setCurrentView('profile');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                            >
                              <Eye className="h-5 w-5 text-gray-700" />
                              View Profile
                            </button>
                            <div className="mx-2 my-1 h-px bg-neutral-200" />
                            <button
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsProfileMenuOpen(false);
                                router.push('/settings/edit');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                            >
                              <Pencil className="h-5 w-5 text-gray-700" />
                              Edit Profile
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
              </div>

              <div className="space-y-6">

          {/* Menu Grid - Mobile 2x3 layout */}
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {(context.type === "business" ? 
                // Business account menu items
                [
                  { title: "Bookings", icon: "📅", href: "/business/bookings" },
                  { title: "Financials", icon: "💰", href: "/business/financials" },
                  { title: "Connections", icon: "👬", onClick: () => setCurrentView('connections') },
                  { title: "Settings", icon: "⚙️", href: "/settings", isSettings: true },
                ] :
                // Personal account menu items
                [
                  { title: "Memories", icon: "🖼️", href: "/memories" },
                  { title: "Achievements", icon: "🏆", href: "/achievements" },
                  { title: "Timeline", icon: "🧭", href: "/timeline" },
                  { title: "Connections", icon: "👬", onClick: () => setCurrentView('connections') },
                  { title: "Saved", icon: "❤️", href: "/saved" },
                  { title: "Settings", icon: "⚙️", href: "/settings", isSettings: true },
                ]
              ).map((item) => (
                <button
                  key={item.title}
                  className="
                    rounded-2xl bg-white
                    hover:bg-white transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1
                    w-full h-28 lg:aspect-square lg:h-auto
                  "
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                  }}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (item.href) {
                      // If this is settings, store current page before navigating
                      if (item.isSettings) {
                        sessionStorage.setItem('settings_previous_page', '/menu');
                      }
                      router.push(item.href);
                    }
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full p-4 gap-6">
                    <div className="text-4xl sm:text-4xl lg:text-5xl">
                      {item.icon}
                    </div>
                    <span className="text-sm sm:text-sm lg:text-sm font-medium text-neutral-900 text-center leading-tight">
                      {item.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
          </div>
        </div>
      ) : (
        // Fallback - should not happen, but show menu as default
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-6 lg:pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      )}

      {/* Account Switcher Modal */}
      <AccountSwitcherSwipeModal 
        isOpen={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />

    </ProtectedRoute>
  );
}


