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
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import AccountSwitcherSwipeModal from "@/components/AccountSwitcherSwipeModal";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import ImagePicker from "@/components/ImagePicker";
import LoadingSpinner from "@/components/LoadingSpinner";

// FORCE RECOMPILE 2025-09-18
export default function Page() {
  const router = useRouter();
  const { personalProfile, context, resetMenuState } = useAppStore();
  const { signOut, deleteAccount } = useAuth();
  const currentBusiness = useCurrentBusiness();
  const [currentView, setCurrentView] = React.useState<'menu' | 'settings' | 'profile' | 'edit-profile'>('menu');
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

  // Get current account info
  const currentAccount = context.type === "business" && currentBusiness 
    ? { name: currentBusiness.name, avatarUrl: currentBusiness.logoUrl, bio: currentBusiness.bio }
    : { name: personalProfile?.name, avatarUrl: personalProfile?.avatarUrl, bio: personalProfile?.bio };

  // Debug logging for bio
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
      name: currentAccount?.name || '',
      bio: currentAccount?.bio || '',
      profilePicture: null as File | null,
      profilePicturePreview: currentAccount?.avatarUrl || ''
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

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
        // Update personal profile
        const { setPersonalProfile } = useAppStore.getState();
        const updatedProfile = {
          ...personalProfile,
          name: formData.name.trim(),
          bio: formData.bio.trim(),
          avatarUrl: formData.profilePicturePreview
        };
        setPersonalProfile(updatedProfile);
        
        // TODO: Handle profile picture upload if needed
        
        setCurrentView('menu');
      } catch (err) {
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

        {/* Content */}
        <div className="flex-1 px-4 py-4">
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

            {/* Action Buttons */}
            <div className="flex flex-col items-center space-y-3 pt-4">
              <button
                onClick={handleSave}
                disabled={loading || !formData.name.trim()}
                className="px-8 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                onClick={() => setCurrentView('menu')}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 underline transition-colors"
              >
                Cancel
              </button>
            </div>
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

  return (
    <ProtectedRoute
      title={currentView === 'menu' ? "Menu" : "Settings"}
      description="Log in / sign up to access your account settings and preferences"
      buttonText="Log in"
    >
      {currentView === 'settings' ? (
        <SettingsView />
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
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
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
                      <div className="text-base font-semibold text-neutral-900 text-center">
                        {currentAccount?.name ?? "Your Name"}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAccountSwitcher(true);
                          }}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Users className="h-5 w-5 text-gray-400" />
                        </button>
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
                  { title: "Connections", icon: "👥", href: "/business/connections" },
                  { title: "Settings", icon: "⚙️", onClick: () => setCurrentView('settings') },
                ] :
                // Personal account menu items
                [
                  { title: "My Gallery", icon: "📷", href: "/gallery" },
                  { title: "Achievements", icon: "🏆", href: "/achievements" },
                  { title: "My Bookings", icon: "📅", href: "/my-life" },
                  { title: "Connections", icon: "👥", href: "/connections" },
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


