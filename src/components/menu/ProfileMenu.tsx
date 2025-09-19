"use client";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Trash2, Settings, Share2, Menu, Camera, Trophy, Calendar, Users, Bookmark, Plus, ChevronLeft, Bell, Save, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import ShareProfileModal from "@/components/ShareProfileModal";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import ImagePicker from "@/components/ImagePicker";
import LoadingSpinner from "@/components/LoadingSpinner";

// Simple, clean card component that can be easily replicated
function SimpleCard({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-[400px] h-[640px] rounded-xl border border-neutral-200 bg-white shadow-sm p-5 ${className}`}>
      {children}
    </div>
  );
}

// Loading overlay component
function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-6">
        {/* Loading spinner */}
        <LoadingSpinner size="lg" />
        
        {/* Loading message */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
        </div>
      </div>
    </div>
  );
}

// Simple menu view
function MenuView({ 
  onSettings, 
  onShare, 
  onViewProfile,
  currentAccount 
}: { 
  onSettings: () => void; 
  onShare: () => void; 
  onViewProfile: () => void;
  currentAccount: { name?: string; avatarUrl?: string; bio?: string } | null; 
}) {
  return (
    <SimpleCard>
      <div className="space-y-4">
        {/* Profile Card - Clickable */}
        <button
          onClick={onViewProfile}
          className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm"
        >
          <Avatar
            src={currentAccount?.avatarUrl ?? undefined}
            name={currentAccount?.name ?? "User"}
            size={48}
          />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{currentAccount?.name ?? "Your Name"}</h3>
            <p className="text-xs text-gray-500">Personal Account</p>
          </div>
          <div className="text-xs text-gray-500">
            View
          </div>
        </button>

        {/* Menu items */}
        <div className="space-y-3">
          <button className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="font-medium">Notifications</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Users size={20} className="text-gray-600" />
            <span className="font-medium">My Connections</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Camera size={20} className="text-gray-600" />
            <span className="font-medium">Gallery</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Trophy size={20} className="text-gray-600" />
            <span className="font-medium">Achievements</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Bookmark size={20} className="text-gray-600" />
            <span className="font-medium">Saved</span>
          </button>

          <button
            onClick={onSettings}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Settings size={20} className="text-gray-600" />
            <span className="font-medium">Settings</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Add business section */}
      <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Plus size={20} className="text-gray-600" />
            <span className="font-medium">Add business</span>
          </button>
        </div>
      </div>
    </SimpleCard>
  );
}

// Simple profile view
function ProfileView({ 
  onBack, 
  onEditProfile,
  onShare,
  currentAccount 
}: { 
  onBack: () => void; 
  onEditProfile: () => void;
  onShare: () => void;
  currentAccount: { name?: string; avatarUrl?: string; bio?: string } | null;
}) {
  return (
    <SimpleCard>
      <div className="space-y-4">
        {/* Header with back button */}
        <div className="flex items-center justify-center relative w-full mb-6" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <button
            onClick={onBack}
            className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Back to menu"
          >
            <span className="back-btn-circle">
              <ChevronLeft size={20} className="text-gray-700" />
            </span>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Profile</h2>
        </div>

        {/* Profile Card */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-6 relative">
          {/* Edit Profile link in top right */}
          <button
            onClick={onEditProfile}
            className="absolute top-4 right-4 text-sm font-medium text-gray-900 hover:text-gray-700 underline transition-colors"
          >
            Edit
          </button>
          
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar
              src={currentAccount?.avatarUrl ?? undefined}
              name={currentAccount?.name ?? "User"}
              size={80}
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {currentAccount?.name ?? "Your Name"}
              </h3>
              <p className="text-sm text-gray-500 mb-3">Personal Account</p>
              {currentAccount?.bio && (
                <p className="text-sm text-gray-600 max-w-xs">
                  {currentAccount.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Profile actions */}
        <div className="space-y-1">
          <button
            onClick={onShare}
            className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Share2 size={20} className="text-gray-600" />
            <span className="font-medium">Share Profile</span>
          </button>
        </div>
      </div>
    </SimpleCard>
  );
}

// Edit profile view
function EditProfileView({ 
  onBack, 
  onSave,
  currentAccount 
}: { 
  onBack: () => void; 
  onSave: (data: { name: string; bio: string; profilePicture?: File }) => Promise<void>;
  currentAccount: { name?: string; avatarUrl?: string; bio?: string } | null;
}) {
  const [formData, setFormData] = useState({
    name: currentAccount?.name || '',
    bio: currentAccount?.bio || '',
    profilePicture: null as File | null,
    profilePicturePreview: currentAccount?.avatarUrl || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await onSave({
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        profilePicture: formData.profilePicture || undefined
      });
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimpleCard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <button
            onClick={onBack}
            className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Back to profile"
          >
            <span className="back-btn-circle">
              <ChevronLeft size={20} className="text-gray-700" />
            </span>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Edit Profile</h2>
        </div>

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
            className="w-48 px-6 py-3 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
          <button
            onClick={onBack}
            className="text-sm font-medium text-gray-600 hover:text-gray-800 underline transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </SimpleCard>
  );
}

// Simple settings view
function SettingsView({ 
  onBack, 
  onSignOut, 
  onDeleteAccount, 
  showDeleteConfirm,
  showFinalConfirm,
  onConfirmDelete,
  onCancelDelete,
  onProceedToFinalConfirm,
  onBackToFirstConfirm,
  onBackToMenu,
  isDeletingAccount,
  personalProfile
}: { 
  onBack: () => void; 
  onSignOut: () => void; 
  onDeleteAccount: () => void; 
  showDeleteConfirm: boolean;
  showFinalConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onProceedToFinalConfirm: () => void;
  onBackToFirstConfirm: () => void;
  onBackToMenu: () => void;
  isDeletingAccount: boolean;
  personalProfile: any;
}) {
  return (
    <SimpleCard>
      <div className="flex flex-col h-full">
        {showDeleteConfirm ? (
          <div className="w-full h-full flex flex-col">
            {isDeletingAccount ? (
              <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                {/* Loading animation */}
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-gray-100 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-red-500 rounded-full animate-spin"></div>
                </div>
                
                {/* Loading message */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900">Deleting Account</h3>
                  <p className="text-gray-600 mt-2">Please wait while we remove your data...</p>
                </div>
              </div>
            ) : showFinalConfirm ? (
              <div className="flex flex-col h-full px-4 py-6">
                {/* Subtext at the top */}
                <div className="text-center mb-6">
                  <p className="text-base text-gray-600 leading-relaxed">
                    This action cannot be undone and all your data will be permanently removed.
                  </p>
                </div>
                
                {/* Profile card in the middle */}
                <div className="flex-1 flex items-center justify-center mb-6">
                  <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-3 w-full max-w-sm">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={personalProfile?.avatarUrl ?? undefined}
                        name={personalProfile?.name ?? "User"}
                        size={48}
                      />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">
                          {personalProfile?.name ?? "Your Name"}
                        </h3>
                        <p className="text-xs text-gray-500">Personal Account</p>
                      </div>
                      <div className="text-red-500 text-xs font-medium">
                        Delete
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons at the bottom */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={onConfirmDelete}
                    className="w-full px-6 py-4 text-base font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                  >
                    Delete Account
                  </button>
                        <button
                          onClick={onBackToMenu}
                          className="w-full py-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors underline"
                        >
                          Cancel
                        </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full px-4 py-6">
                {/* Title at the top */}
                <div className="text-center mb-3">
                  <h1 className="text-2xl font-semibold text-gray-900">Delete Account</h1>
                </div>
                
                {/* Subtext in the middle - takes up remaining space */}
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-gray-600 leading-relaxed text-center max-w-sm">
                    Are you sure you want to delete your account?
                  </p>
                </div>
                
                {/* Action buttons at the bottom */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={onCancelDelete}
                    className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onProceedToFinalConfirm}
                    className="flex-1 px-6 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header with back button */}
            <div className="flex items-center justify-center relative w-full mb-6" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <button
                onClick={onBack}
                className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
                aria-label="Back to menu"
              >
                <span className="back-btn-circle">
                  <ChevronLeft size={20} className="text-gray-700" />
                </span>
              </button>
              <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Settings</h2>
            </div>
            
            {/* Settings content - empty space for future settings */}
            <div className="flex-1">
            </div>
            
            {/* Account actions at bottom */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut size={20} className="text-gray-600" />
                <span className="font-medium">Log out</span>
              </button>
              
              <button
                onClick={onDeleteAccount}
                className="w-full flex items-center gap-3 px-4 py-4 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} className="text-red-500" />
                <span className="font-medium">Delete Account</span>
              </button>
            </div>
          </>
        )}
      </div>
    </SimpleCard>
  );
}

export default function ProfileMenu() {
  const { personalProfile, clearAll, setPersonalProfile } = useAppStore();
  const { signOut, deleteAccount, updateProfile, uploadAvatar, supabase } = useAuth();
  const [open, setOpen] = useState(false);
  const [showDim, setShowDim] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Get current account info for avatar with debugging
  const currentAccount = { 
    name: personalProfile?.name, 
    avatarUrl: personalProfile?.avatarUrl,
    bio: personalProfile?.bio
  };
  
  // Debug profile loading in menu
  useEffect(() => {
    console.log('ProfileMenu: Profile data updated:', {
      hasProfile: !!personalProfile,
      name: personalProfile?.name,
      hasAvatar: !!personalProfile?.avatarUrl,
      avatarUrl: personalProfile?.avatarUrl
    });
  }, [personalProfile]);


  // Close menu when navigating - immediate hide
  useEffect(() => {
    setOpen(false);
    setShowMenu(false); // Immediately hide menu on navigation
    setShowSettings(false);
    setShowProfile(false);
    setShowEditProfile(false);
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
  }, [pathname]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Handle dimming transition
  useEffect(() => {
    if (open) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowDim(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      // Start undim transition immediately, but keep overlay visible during transition
      setShowDim(false);
    }
  }, [open]);

  // Keep overlay visible during undim transition
  const [showOverlay, setShowOverlay] = useState(false);
  
  useEffect(() => {
    if (open) {
      setShowOverlay(true);
    } else {
      // Keep overlay visible during undim transition
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 500); // Match the transition duration
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle menu visibility - completely independent of transitions
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Update resetAllStates to immediately hide menu
  const resetAllStates = () => {
    setOpen(false);
    setShowMenu(false); // Immediately hide menu
    // Also directly hide menu via ref for instant response
    if (menuRef.current) {
      menuRef.current.style.display = 'none';
    }
    setShowSettings(false);
    setShowProfile(false);
    setShowEditProfile(false);
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
  };

  // Handle ESC key to close menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        resetAllStates();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Close menu when clicking outside
  useEffect(() => {
    const onClickAway = (e: MouseEvent) => { 
      if (ref.current && !ref.current.contains(e.target as Node)) {
        resetAllStates();
      }
    };
    const onEsc = (e: KeyboardEvent) => { 
      if (e.key === "Escape") {
        resetAllStates();
      }
    };
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    setLoadingMessage('Signing out...');
    setOpen(false);
    setShowSettings(false);
    setShowProfile(false);
    
    try {
      console.log('ProfileMenu: Starting sign out...');
      
      // Clear all local state first
      clearAll();
      
      // Then sign out from auth
      await signOut();
      console.log('ProfileMenu: Sign out completed');
      
      // Immediate redirect to prevent hanging
      console.log('ProfileMenu: Redirecting to home page');
      window.location.href = '/';
      
    } catch (error) {
      console.error('ProfileMenu: Sign out error:', error);
      // Even if there's an error, try to clear state and reload
      clearAll();
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(true);
  };

  const proceedToFinalConfirm = () => {
    setShowFinalConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    console.log('🚯 BULLETPROOF DELETE: Starting comprehensive account deletion');
    setIsDeletingAccount(true);
    
    try {
      // Store the profile ID before we clear local data
      const accountId = personalProfile?.id;
      
      if (accountId && supabase) {
        console.log('🚯 DATABASE: Starting database cleanup for:', accountId);
        
        try {
          // Step 1: Delete account_identities first (foreign key dependency)
          console.log('🚯 DATABASE: Deleting account identities...');
          const { error: identityError } = await supabase
            .from('account_identities')
            .delete()
            .eq('account_id', accountId);
          
          if (identityError) {
            console.error('🚯 DATABASE: Identity cleanup failed:', identityError);
          } else {
            console.log('🚯 DATABASE: ✅ Identity records deleted');
          }
          
          // Step 2: Delete accounts record
          console.log('🚯 DATABASE: Deleting account record...');
          const { error: accountError } = await supabase
            .from('accounts')
            .delete()
            .eq('id', accountId);
          
          if (accountError) {
            console.error('🚯 DATABASE: Account cleanup failed:', accountError);
          } else {
            console.log('🚯 DATABASE: ✅ Account record deleted');
          }
          
          console.log('🚯 DATABASE: ✅ Database cleanup completed successfully');
        } catch (dbError) {
          console.error('🚯 DATABASE: Database cleanup error:', dbError);
          // Continue with local cleanup even if database cleanup fails
        }
      }
      
      // Now clear all local data after database cleanup
      console.log('🚯 LOCAL: Clearing all local data and signing out');
      clearAll();
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out (don't wait for it to complete)
      signOut().catch(err => console.log('Sign out error (ignoring):', err));
      
      // Short animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // FORCE REDIRECT - multiple methods for reliability
      console.log('🚯 FORCE REDIRECT: Going to explore now');
      window.location.replace('/explore');
      
    } catch (error) {
      console.error('🚯 Error during nuclear delete, forcing redirect:', error);
      // Force redirect no matter what
      window.location.replace('/explore');
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
  };

  const backToFirstConfirm = () => {
    setShowFinalConfirm(false);
  };

  const backToMenu = () => {
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
    setShowSettings(false);
    // Keep the menu open - don't set setOpen(false)
  };

  const handleViewProfile = () => {
    setShowProfile(true);
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleSaveProfile = async (data: { name: string; bio: string; profilePicture?: File }) => {
    console.log('handleSaveProfile: Starting profile save with data:', {
      name: data.name,
      bio: data.bio,
      hasProfilePicture: !!data.profilePicture,
      profilePictureType: data.profilePicture?.type,
      profilePictureSize: data.profilePicture?.size
    });

    try {
      let avatarUrl = personalProfile?.avatarUrl;
      console.log('handleSaveProfile: Current avatar URL:', avatarUrl);

      // Upload new profile picture if one was selected
      if (data.profilePicture) {
        console.log('handleSaveProfile: Uploading new profile picture...');
        const uploadResult = await uploadAvatar(data.profilePicture);
        console.log('handleSaveProfile: Upload result:', uploadResult);
        
        if (uploadResult.url) {
          avatarUrl = uploadResult.url;
          console.log('handleSaveProfile: Using new avatar URL:', avatarUrl);
        } else {
          console.error('handleSaveProfile: Failed to upload avatar, keeping existing URL. Error:', uploadResult.error);
        }
      } else {
        console.log('handleSaveProfile: No new profile picture selected, keeping existing URL');
      }

      // Update profile data
      const updatedProfile = {
        ...personalProfile,
        name: data.name,
        bio: data.bio,
        avatarUrl: avatarUrl,
        updatedAt: new Date().toISOString()
      };

      console.log('handleSaveProfile: Updating profile with data:', updatedProfile);

      // Update in Supabase - pass the correct format expected by updateProfile
      const { error } = await updateProfile({
        name: data.name,
        bio: data.bio,
        avatarUrl: avatarUrl
      });
      
      if (error) {
        console.error('handleSaveProfile: Error updating profile in Supabase:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      console.log('handleSaveProfile: Profile updated successfully in Supabase');

      // Update local state
      setPersonalProfile(updatedProfile);
      console.log('handleSaveProfile: Local state updated');
      
      // Go back to profile view
      setShowEditProfile(false);
      console.log('handleSaveProfile: Edit profile view closed');
      
    } catch (err) {
      console.error('handleSaveProfile: Error updating profile:', err);
      throw err;
    }
  };

  return (
    <>
      {/* Loading overlay */}
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      
      <div className="relative" ref={ref}>
        {/* Profile button */}
        <button
          aria-label="Open menu"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => {
            const newOpen = !open;
            setOpen(newOpen);
            setShowMenu(newOpen);
            // Also directly show/hide menu via ref for instant response
            if (menuRef.current) {
              menuRef.current.style.display = newOpen ? 'block' : 'none';
            }
          }}
          className={`flex items-center gap-2 rounded-full border border-neutral-200 bg-white shadow-sm px-2 py-1 hover:shadow-md transition-all duration-700 ease-in-out focus:outline-none relative z-50 ${
            open ? 'opacity-60' : 'opacity-100'
          }`}
        >
          <Menu size={14} className="text-gray-700" />
          <Avatar 
            src={currentAccount?.avatarUrl ?? undefined} 
            name={currentAccount?.name ?? "User"} 
            size={32} 
          />
        </button>

        {/* Full page dimming overlay */}
        {showOverlay && (
          <div 
            className="fixed inset-0 z-40 transition-opacity duration-500 ease-in-out"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              opacity: showDim ? 1 : 0
            }}
            onClick={resetAllStates}
          />
        )}

        {/* Dropdown menu */}
        {showMenu && (
          <div ref={menuRef} role="menu" className="profile-menu-card absolute right-0 z-50 mt-2">
            {showSettings ? (
              <SettingsView
                onBack={() => setShowSettings(false)}
                onSignOut={handleSignOut}
                onDeleteAccount={handleDeleteAccount}
                showDeleteConfirm={showDeleteConfirm}
                showFinalConfirm={showFinalConfirm}
                onConfirmDelete={confirmDeleteAccount}
                onCancelDelete={cancelDeleteAccount}
                onProceedToFinalConfirm={proceedToFinalConfirm}
                onBackToFirstConfirm={backToFirstConfirm}
                onBackToMenu={backToMenu}
                isDeletingAccount={isDeletingAccount}
                personalProfile={personalProfile}
              />
            ) : showEditProfile ? (
              <EditProfileView
                onBack={() => setShowEditProfile(false)}
                onSave={handleSaveProfile}
                currentAccount={currentAccount}
              />
            ) : showProfile ? (
              <ProfileView
                onBack={() => setShowProfile(false)}
                onEditProfile={handleEditProfile}
                onShare={() => {
                  setOpen(false);
                  setShowShareModal(true);
                }}
                currentAccount={currentAccount}
              />
            ) : (
              <MenuView
                onSettings={() => setShowSettings(true)}
                onShare={() => {
                        setOpen(false);
                  setShowShareModal(true);
                }}
                onViewProfile={handleViewProfile}
                currentAccount={currentAccount}
              />
            )}
            </div>
        )}
        
        {/* Share Profile Modal */}
        <ShareProfileModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      </div>
    </>
  );
}