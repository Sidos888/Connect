"use client";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Link from "next/link";
import MobileTitle from "@/components/MobileTitle";
import ProfileStrip from "@/components/my-life/ProfileStrip";
import { useAppStore, useCurrentBusiness } from "@/lib/store";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ChevronDownIcon, BellIcon, ChevronLeftIcon, UsersIcon } from "@/components/icons";
import { LogOut, Trash2, ChevronRightIcon } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import AccountSwitcherSwipeModal from "@/components/AccountSwitcherSwipeModal";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import ImagePicker from "@/components/ImagePicker";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Page() {
  const router = useRouter();
  const { personalProfile, context, resetMenuState } = useAppStore();
  const { signOut, deleteAccount } = useAuth();
  const currentBusiness = useCurrentBusiness();
  const [currentView, setCurrentView] = React.useState<'menu' | 'settings' | 'edit-profile'>('menu');
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
      <div className="lg:hidden min-h-screen bg-white flex flex-col -mx-4 -my-6">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-200">
          <button
            onClick={() => setCurrentView('menu')}
            className="p-2 rounded-md hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Edit Profile</h1>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="max-w-md mx-auto space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="flex justify-center">
                <ImagePicker
                  onChange={handleImageChange}
                  initialPreviewUrl={formData.profilePicturePreview}
                  shape="circle"
                  size={120}
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
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
            <div className="text-center space-y-4 pt-8">
              <button
                onClick={handleSave}
                disabled={loading || !formData.name.trim()}
                className="w-full px-6 py-3 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
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

  // Settings Component
  const SettingsView = () => (
    <div className="lg:hidden min-h-screen bg-white flex flex-col -mx-4 -my-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-200">
        <button
          onClick={() => setCurrentView('menu')}
          className="p-2 rounded-md hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Back to menu"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      {/* Settings content - empty space for future settings */}
      <div className="flex-1">
      </div>
      
      {/* Account actions at bottom */}
      <div className="space-y-3 p-4 pt-6 border-t border-gray-200">
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
  );

  return (
    <ProtectedRoute
      title={currentView === 'menu' ? "Menu" : "Settings"}
      description="Log in / sign up to access your account settings and preferences"
      buttonText="Log in"
    >
      {currentView === 'settings' ? (
        <SettingsView />
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
                      onClick={() => setCurrentView('edit-profile')}
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
                          <UsersIcon className="h-5 w-5 text-gray-400" />
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
      
      {/* Desktop message */}
      <div className="hidden lg:flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Menu</h1>
          <p className="text-gray-600">Use the profile menu in the top right to access settings and account options.</p>
        </div>
      </div>

      {/* Account Switcher Modal */}
      <AccountSwitcherSwipeModal 
        isOpen={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />
    </ProtectedRoute>
  );
}


