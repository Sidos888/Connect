"use client";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Link from "next/link";
import MobileTitle from "@/components/MobileTitle";
import ProfileStrip from "@/components/my-life/ProfileStrip";
import { useAppStore, useCurrentBusiness } from "@/lib/store";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ChevronDownIcon, BellIcon, ChevronLeftIcon } from "@/components/icons";
import { LogOut, Trash2, ChevronRightIcon, Users } from "lucide-react";
import { connectionsService, User as ConnectionUser, FriendRequest } from '@/lib/connectionsService';
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import { supabase as supabaseClient } from "@/lib/supabaseClient";
import AccountSwitcherSwipeModal from "@/components/AccountSwitcherSwipeModal";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import ImagePicker from "@/components/ImagePicker";
import LoadingSpinner from "@/components/LoadingSpinner";

// FORCE RECOMPILE 2025-09-18
export default function Page() {
  const router = useRouter();
  const { personalProfile, context, resetMenuState } = useAppStore();
  const { signOut, deleteAccount, user, updateProfile, uploadAvatar, account, refreshAuthState, loadUserProfile } = useAuth();
  const currentBusiness = useCurrentBusiness();
  const [currentView, setCurrentView] = React.useState<'menu' | 'settings' | 'connections' | 'add-person' | 'profile' | 'edit-profile'>('menu');
  const [showAccountSwitcher, setShowAccountSwitcher] = React.useState(false);

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
    
    if (currentView === 'edit-profile' || currentView === 'profile') {
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

    return (
      <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col" style={{ paddingBottom: '0' }}>
        {/* Header */}
        <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
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

        {/* Content - with bottom padding for fixed button */}
        <div className="flex-1 px-4 py-4 pb-32">
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

        {/* Fixed Action Buttons at Bottom - Mobile Optimized */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
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
              onClick={() => setCurrentView('menu')}
              className="text-base font-medium underline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Profile View Component
  const ProfileView = () => {
    React.useEffect(() => {
      document.body.classList.add('no-scroll');
      return () => document.body.classList.remove('no-scroll');
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
              <span className="back-btn-circle">
                <ChevronLeftIcon className="h-5 w-5" />
              </span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Profile</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            {/* Card Header: Edit Profile action (right aligned) */}
            <div className="flex justify-end items-start mb-4">
              <button
                onClick={() => setCurrentView('edit-profile')}
                className="text-black hover:text-black font-medium text-sm underline"
              >
                Edit Profile
              </button>
            </div>

            {/* Profile Picture */}
            <div className="flex justify-center mb-4">
              <Avatar 
                src={currentAccount?.avatarUrl ?? undefined} 
                name={currentAccount?.name ?? "Your Name"} 
                size={120} 
              />
            </div>

            {/* Name and Account Type (centered) */}
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {currentAccount?.name ?? "Your Name"}
              </h2>
              <p className="text-gray-600 text-sm">Personal Account</p>
            </div>

            {/* Bio Section (optional) */}
            {currentAccount?.bio && (
              <div className="text-center mt-6">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Bio</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {currentAccount.bio}
                </p>
              </div>
            )}

            {/* Share Profile Option */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button className="w-full flex items-center justify-center gap-2 py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="font-medium">Share Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Settings Component
  const SettingsView = () => {
    // Immediately add settings-mode class to prevent nav bar flash
    React.useLayoutEffect(() => {
      document.body.classList.add('settings-mode');
      document.body.classList.add('no-scroll');
      
      return () => {
        document.body.classList.remove('settings-mode');
        document.body.classList.remove('no-scroll');
      };
    }, []);

    // Hide bottom nav when in settings mode
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
        
        console.log('Settings: Found bottom nav:', bottomNav);
        
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
        
        document.body.style.paddingBottom = '0';
        document.documentElement.style.setProperty('--bottom-nav-height', '0px');
      };

      const showBottomNav = () => {
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
        document.body.classList.add('settings-mode');
        document.body.classList.add('no-scroll');
      }, 100);
      
      return () => {
        showBottomNav();
        document.body.classList.remove('settings-mode');
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
            <span className="back-btn-circle">
              <ChevronLeftIcon className="h-5 w-5" />
            </span>
          </button>
          <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-4">
        {/* Empty space to push buttons to bottom */}
        <div className="flex-1"></div>
        
        {/* Account actions at bottom */}
        <div className="space-y-3 pb-safe-bottom mb-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={20} className="text-gray-600" />
            <span className="font-medium">Log out</span>
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={20} className="text-red-500" />
            <span className="font-medium">Delete Account</span>
          </button>
        </div>
      </div>
    </div>
    );
  };

  // Connections Component
  const ConnectionsView = () => {
    const [activeTab, setActiveTab] = React.useState<'friends' | 'following'>('friends');
    const [connections, setConnections] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const { account } = useAuth();

    // Load real connections data
    React.useEffect(() => {
      const loadConnections = async () => {
        if (!account?.id) {
          setLoading(false);
          return;
        }

        try {
          const { connections: userConnections, error } = await connectionsService.getConnections(account.id);
          if (!error) {
            setConnections(userConnections || []);
          } else {
            console.error('Error loading connections:', error);
          }
        } catch (error) {
          console.error('Error loading connections:', error);
        } finally {
          setLoading(false);
        }
      };

      loadConnections();
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
    <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-gray-50 flex flex-col" style={{ paddingBottom: '0' }}>
      {/* Header */}
      <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <button
            onClick={() => setCurrentView('menu')}
            className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Back to menu"
          >
            <span className="back-btn-circle">
              <ChevronLeftIcon className="h-5 w-5" />
            </span>
          </button>
          <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Connections</h1>
          <button
            onClick={() => setCurrentView('add-person')}
            className="absolute right-0 p-2 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Add person"
          >
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {/* Person silhouette */}
              <circle cx="12" cy="8" r="4" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              {/* Plus sign in top right */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 5h2m0 0h2m-2 0v2m0-2V3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white px-4 pb-2">
        <div className="flex justify-center space-x-8">
          <button
            onClick={() => setActiveTab('friends')}
            className={`py-3 text-base font-medium border-b-2 transition-colors ${
              activeTab === 'friends'
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-500 border-transparent'
            }`}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`py-3 text-base font-medium border-b-2 transition-colors ${
              activeTab === 'following'
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-500 border-transparent'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Loading connections...</p>
            </div>
          ) : connections.length > 0 ? (
            connections.map((connection) => {
              // Get the friend (not the current user) from the connection
              const friend = connection.user1?.id === account?.id ? connection.user2 : connection.user1;
              if (!friend) return null;

              return (
                <div
                  key={connection.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center space-x-4"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {friend.profile_pic ? (
                      <img src={friend.profile_pic} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 text-lg font-medium">
                        {friend.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{friend.name}</h3>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-gray-500 text-sm">No connections yet</p>
              <p className="text-gray-400 text-xs mt-1">Start adding friends to see them here</p>
            </div>
          )}
        </div>
      </div>

    </div>
    );
  };

  // Add Person Component
  const AddPersonView = () => {
    const [activeTab, setActiveTab] = React.useState<'requests' | 'add-friends'>('add-friends');
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
      if (account?.id) {
        loadSuggestedFriends();
        loadPendingRequests();
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
      <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-gray-50 flex flex-col" style={{ paddingBottom: '0' }}>
        {/* Header */}
        <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
          <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <button
              onClick={() => setCurrentView('connections')}
              className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
              aria-label="Back to connections"
            >
              <span className="back-btn-circle">
                <ChevronLeftIcon className="h-5 w-5" />
              </span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Find Friends</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white px-4 pb-2">
          <div className="flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-3 text-base font-medium border-b-2 transition-colors ${
                activeTab === 'requests'
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              Requests
            </button>
            <button
              onClick={() => setActiveTab('add-friends')}
              className={`py-3 text-base font-medium border-b-2 transition-colors ${
                activeTab === 'add-friends'
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              Add Friends
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {pendingRequests.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Friend Requests</h3>
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                              {request.sender?.profile_pic ? (
                                <img src={request.sender.profile_pic} alt={request.sender.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-gray-500 text-lg font-medium">
                                  {request.sender?.name?.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{request.sender?.name}</h4>
                                </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => rejectFriendRequest(request.id)}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-300 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => acceptFriendRequest(request.id)}
                              className="w-8 h-8 flex items-center justify-center bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
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
            )}

            {activeTab === 'add-friends' && (
              <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for people by name..."
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
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
                            <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
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

                {/* Suggested Friends Section */}
                {!searchQuery.trim() && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Suggested Friends</h3>
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
                          <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
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
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute
      title={currentView === 'menu' ? "Menu" : currentView === 'connections' ? "Connections" : currentView === 'add-person' ? "Find Friends" : "Settings"}
      description="Log in / sign up to access your account settings and preferences"
      buttonText="Log in"
    >
      {currentView === 'settings' ? (
        <SettingsView />
      ) : currentView === 'connections' ? (
        <ConnectionsView />
      ) : currentView === 'add-person' ? (
        <AddPersonView />
      ) : currentView === 'profile' ? (
        <ProfileView />
      ) : currentView === 'edit-profile' ? (
        <EditProfileView />
      ) : (
        <div>
          <MobileTitle 
            title="Menu" 
            action={
              <button
                className="p-2 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 ring-brand"
                aria-label="Notifications"
                onClick={() => router.push("/notifications")}
              >
                <BellIcon className="h-5 w-5 text-black" />
              </button>
            }
          />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-[120px] lg:pt-6">
              {/* Profile and Bio Cards - Layered and Connected */}
              <div className="mb-6 lg:mb-8">
                <div className="max-w-lg mx-auto lg:max-w-xl relative">
                  {/* Bio Card - Back layer with only bottom corners */}
                  {currentAccount?.bio && (
                    <div className="absolute top-0 left-0 right-0 bg-white border-l border-r border-b border-gray-200 p-6 shadow-sm rounded-b-2xl z-0 block" style={{ top: '56px' }}>
                      <h3 className="font-semibold text-gray-900 mb-3 text-sm text-center">Bio</h3>
                      <p className="text-sm text-gray-700 leading-relaxed text-center">{currentAccount.bio}</p>
                    </div>
                  )}
                  
                  {/* Profile Card - Front layer with full corner radius */}
                  <div className="relative z-10">
                    <button
                      onClick={() => setCurrentView('profile')}
                      className="w-full rounded-2xl border border-neutral-200 shadow-sm bg-white px-5 py-4 grid grid-cols-[40px_1fr_40px] items-center hover:bg-gray-50 transition-colors"
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
                      <div className="flex justify-end">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAccountSwitcher(true);
                          }}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  {/* Spacer div to account for bio card height */}
                  {currentAccount?.bio && (
                    <div className="h-24 lg:h-28"></div>
                  )}
                </div>
              </div>

              <div className="hidden lg:block mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
              </div>

              <div className="space-y-6">

          {/* Menu Grid - Mobile 2x3 layout */}
          <div className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-6">
              {(context.type === "business" ? 
                // Business account menu items
                [
                  { title: "Bookings", icon: "📅", href: "/business/bookings" },
                  { title: "Financials", icon: "💰", href: "/business/financials" },
                  { title: "Connections", icon: "👥", onClick: () => setCurrentView('connections') },
                  { title: "Settings", icon: "⚙️", onClick: () => setCurrentView('settings') },
                ] :
                // Personal account menu items
                [
                  { title: "My Gallery", icon: "📷", href: "/gallery" },
                  { title: "Achievements", icon: "🏆", href: "/achievements" },
                  { title: "My Bookings", icon: "📅", href: "/my-life" },
                  { title: "Connections", icon: "👥", onClick: () => setCurrentView('connections') },
                  { title: "Saved", icon: "🔖", href: "/saved" },
                  { title: "Settings", icon: "⚙️", onClick: () => setCurrentView('settings') },
                ]
              ).map((item) => (
                <button
                  key={item.title}
                  className="
                    rounded-2xl border border-neutral-200 bg-white p-4 lg:p-6 shadow-sm
                    hover:shadow-md hover:bg-neutral-50 transition-shadow duration-200
                    focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1
                    h-28 lg:h-36 xl:h-40
                  "
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (item.href) {
                      router.push(item.href);
                    }
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-2 lg:gap-3">
                    <div className="text-2xl lg:text-4xl xl:text-5xl">
                      {item.icon}
                    </div>
                    <span className="text-xs lg:text-sm font-medium text-neutral-900 text-center leading-tight">
                      {item.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
          </div>
        </div>      )}

      {/* Account Switcher Modal */}
      <AccountSwitcherSwipeModal 
        isOpen={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />
    </ProtectedRoute>
  );
}


