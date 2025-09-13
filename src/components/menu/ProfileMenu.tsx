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

// Simple menu view
function MenuView({ 
  onSettings, 
  onShare, 
  onSignOut, 
  onViewProfile,
  currentAccount 
}: { 
  onSettings: () => void; 
  onShare: () => void; 
  onSignOut: () => void; 
  onViewProfile: () => void;
  currentAccount: { name?: string; avatarUrl?: string; bio?: string } | null; 
}) {
  return (
    <SimpleCard>
      <div className="space-y-4">
        {/* Profile Card - Clickable */}
        <button
          onClick={onViewProfile}
          className="w-full rounded-lg border border-neutral-200 bg-white shadow-sm p-4 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
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
          </div>
        </button>

        {/* Menu items */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="font-medium">Notifications</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Users size={20} className="text-gray-600" />
            <span className="font-medium">My Connections</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Camera size={20} className="text-gray-600" />
            <span className="font-medium">Gallery</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Trophy size={20} className="text-gray-600" />
            <span className="font-medium">Achievements</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Bookmark size={20} className="text-gray-600" />
            <span className="font-medium">Saved</span>
          </button>

          <button
            onClick={onSettings}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Settings size={20} className="text-gray-600" />
            <span className="font-medium">Settings</span>
          </button>

          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={20} className="text-gray-600" />
            <span className="font-medium">Log out</span>
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
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Back to menu"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
            </div>

        {/* Profile Card */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-6 relative">
          {/* Edit Profile link in top right */}
          <button
            onClick={onEditProfile}
            className="absolute top-4 right-4 text-sm font-medium text-gray-900 hover:text-gray-700 underline transition-colors"
          >
            Edit Profile
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
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Back to profile"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
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
          <button
            onClick={() => {
              // Trigger the image picker
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
            className="mt-2 text-sm font-medium text-gray-600 hover:text-gray-800 underline transition-colors"
          >
            Edit Image
          </button>
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
            <TextArea
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="w-full text-base border-gray-200 focus:border-gray-400 focus:ring-gray-400 resize-none"
              rows={3}
            />
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
  onConfirmDelete,
  onCancelDelete
}: { 
  onBack: () => void; 
  onSignOut: () => void; 
  onDeleteAccount: () => void; 
  showDeleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <SimpleCard>
      <div className="space-y-4">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to menu"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        </div>
        
        {/* Settings actions */}
        <div className="space-y-1">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={20} className="text-gray-600" />
            <span className="font-medium">Sign out</span>
          </button>
          
          {showDeleteConfirm ? (
            <div className="w-full p-6 text-center bg-red-50 rounded-lg border border-red-200">
              <div className="mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account</h3>
                <p className="text-sm text-gray-700">Are you sure you want to delete your account? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onCancelDelete}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirmDelete}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onDeleteAccount}
              className="w-full flex items-center gap-3 px-3 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={20} className="text-red-600" />
              <span className="font-medium">Delete Account</span>
          </button>
        )}
      </div>
    </div>
    </SimpleCard>
  );
}

export default function ProfileMenu() {
  const { personalProfile, clearAll, setPersonalProfile } = useAppStore();
  const { signOut, deleteAccount, updateProfile, uploadAvatar } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Get current account info for avatar
  const currentAccount = { 
    name: personalProfile?.name, 
    avatarUrl: personalProfile?.avatarUrl,
    bio: personalProfile?.bio
  };

  // Close menu when navigating
  useEffect(() => {
    setOpen(false);
    setShowSettings(false);
    setShowProfile(false);
    setShowEditProfile(false);
  }, [pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const onClickAway = (e: MouseEvent) => { 
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSettings(false);
        setShowProfile(false);
        setShowEditProfile(false);
        setShowDeleteConfirm(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => { 
      if (e.key === "Escape") {
        setOpen(false);
        setShowSettings(false);
        setShowProfile(false);
        setShowEditProfile(false);
        setShowDeleteConfirm(false);
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
    await signOut();
    setOpen(false);
    setShowSettings(false);
    setShowProfile(false);
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    console.log('ProfileMenu: Starting account deletion...');
    console.log('ProfileMenu: Current state before deletion:', {
      showDeleteConfirm, 
      open, 
      showSettings 
    });
    
    // Immediately clear local state to prevent Guard from redirecting
    console.log('ProfileMenu: Immediately clearing local state...');
    clearAll();
    localStorage.removeItem('connect.app.v1');
    localStorage.clear();
    
    // Set up a fallback timeout to clear local data if delete hangs
    const fallbackTimeout = setTimeout(() => {
      console.log('ProfileMenu: Delete operation timed out, forcing redirect...');
      // Force a hard reload to clear all state
      window.location.href = '/';
    }, 2000); // 2 second fallback (reduced from 5 seconds)
    
    try {
      console.log('ProfileMenu: Calling deleteAccount()...');
      const { error } = await deleteAccount();
      console.log('ProfileMenu: deleteAccount() completed, error:', error);
      
      // Clear the fallback timeout since we completed
      clearTimeout(fallbackTimeout);
      
      if (error) {
        console.error('ProfileMenu: Delete account error:', error);
        // Even if there's an error, clear local data as fallback
        console.log('ProfileMenu: Clearing local data as fallback...');
        clearAll();
        localStorage.removeItem('connect.app.v1');
        localStorage.clear();
        console.log('ProfileMenu: Local data cleared, redirecting...');
        // Force a hard reload to clear all state
        window.location.href = '/';
        return;
      } else {
        console.log('ProfileMenu: Account deleted successfully');
      }
      
      // Always close modals and redirect
      console.log('ProfileMenu: Closing modals...');
      setOpen(false);
      setShowSettings(false);
      setShowDeleteConfirm(false);
      
      console.log('ProfileMenu: Clearing all local data and redirecting...');
      // Clear Zustand store
      clearAll();
      // Clear localStorage
      localStorage.removeItem('connect.app.v1');
      localStorage.clear();
      
      // Force a hard reload to clear all state and show explore page
      window.location.href = '/';
      
    } catch (err) {
      console.error('ProfileMenu: Unexpected error during deletion:', err);
      // Clear the fallback timeout
      clearTimeout(fallbackTimeout);
      
      // Even on error, clear local data and redirect
      console.log('ProfileMenu: Clearing local data due to error...');
      clearAll();
      localStorage.removeItem('connect.app.v1');
      localStorage.clear();
      console.log('ProfileMenu: Local data cleared due to error, redirecting...');
      // Force a hard reload to clear all state
      window.location.href = '/';
    }
    
    console.log('ProfileMenu: Setting showDeleteConfirm to false...');
    setShowDeleteConfirm(false);
    console.log('ProfileMenu: Delete process completed');
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
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

      // Update in Supabase
      const { error } = await updateProfile(updatedProfile);
      
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
    <div className="relative" ref={ref}>
      {/* Profile button */}
      <button
        aria-label="Open menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white shadow-sm px-2 py-1 hover:shadow-md transition-shadow focus:outline-none"
      >
        <Menu size={14} className="text-gray-700" />
        <Avatar 
          src={currentAccount?.avatarUrl ?? undefined} 
          name={currentAccount?.name ?? "User"} 
          size={32} 
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2">
          {showSettings ? (
            <SettingsView
              onBack={() => setShowSettings(false)}
              onSignOut={handleSignOut}
              onDeleteAccount={handleDeleteAccount}
              showDeleteConfirm={showDeleteConfirm}
              onConfirmDelete={confirmDeleteAccount}
              onCancelDelete={cancelDeleteAccount}
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
              onSignOut={handleSignOut}
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
  );
}