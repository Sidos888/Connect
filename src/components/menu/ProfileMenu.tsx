"use client";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Trash2, Settings, Share2, Menu, Camera, Trophy, Calendar, Users, Bookmark, Plus } from "lucide-react";
import Avatar from "@/components/Avatar";
import ShareProfileModal from "@/components/ShareProfileModal";

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
  currentAccount: { name?: string; avatarUrl?: string } | null; 
}) {
  return (
    <SimpleCard>
      <div className="space-y-4">
        {/* Profile Card - Compact and aesthetic */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
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
            <button
              onClick={onViewProfile}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              View
            </button>
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Camera size={20} className="text-gray-600" />
            <span className="font-medium">My Gallery</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Trophy size={20} className="text-gray-600" />
            <span className="font-medium">Achievements</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Calendar size={20} className="text-gray-600" />
            <span className="font-medium">My Bookings</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Users size={20} className="text-gray-600" />
            <span className="font-medium">My Connections</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Bookmark size={20} className="text-gray-600" />
            <span className="font-medium">Saved</span>
          </button>

          <button
            onClick={onShare}
            className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Share2 size={20} className="text-gray-600" />
            <span className="font-medium">Share Profile</span>
          </button>

          <button
            onClick={onSettings}
            className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Settings size={20} className="text-gray-600" />
            <span className="font-medium">Settings</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Action items */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Plus size={20} className="text-gray-600" />
            <span className="font-medium">Add account</span>
          </button>

          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={20} className="text-gray-600" />
            <span className="font-medium">Log out</span>
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
  currentAccount,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete
}: { 
  onBack: () => void; 
  onSignOut: () => void; 
  onDeleteAccount: () => void; 
  currentAccount: { name?: string; avatarUrl?: string } | null;
  showDeleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <SimpleCard>
      <div className="flex flex-col h-full">
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

        {/* Profile info */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
          <Avatar 
            src={currentAccount?.avatarUrl ?? undefined} 
            name={currentAccount?.name ?? "User"} 
            size={48} 
          />
          <div>
            <h3 className="text-base font-semibold text-gray-900">{currentAccount?.name ?? "Your Name"}</h3>
            <p className="text-xs text-gray-500">Personal account</p>
          </div>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1"></div>

        {/* Settings actions */}
        <div className="space-y-4">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-4 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
          >
            <div className="p-2 bg-gray-100 rounded-lg">
              <LogOut size={24} className="text-gray-600" />
            </div>
            <div>
              <div className="font-medium">Sign out</div>
              <div className="text-sm text-gray-500">Sign out of your account</div>
            </div>
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
              className="w-full flex items-center gap-4 px-4 py-4 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
            >
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <div className="font-medium">Delete Account</div>
                <div className="text-sm text-gray-500">Permanently delete your account and data</div>
              </div>
            </button>
          )}
        </div>
      </div>
    </SimpleCard>
  );
}

export default function ProfileMenu() {
  const { personalProfile, clearAll } = useAppStore();
  const { signOut, deleteAccount } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Get current account info for avatar
  const currentAccount = { 
    name: personalProfile?.name, 
    avatarUrl: personalProfile?.avatarUrl 
  };

  // Close menu when navigating
  useEffect(() => {
    setOpen(false);
    setShowSettings(false);
  }, [pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const onClickAway = (e: MouseEvent) => { 
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSettings(false);
        setShowDeleteConfirm(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => { 
      if (e.key === "Escape") {
        setOpen(false);
        setShowSettings(false);
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
    if (personalProfile?.connectId) {
      router.push(`/p/${personalProfile.connectId}`);
    } else {
      router.push('/onboarding');
    }
    setOpen(false);
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
              currentAccount={currentAccount}
              showDeleteConfirm={showDeleteConfirm}
              onConfirmDelete={confirmDeleteAccount}
              onCancelDelete={cancelDeleteAccount}
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