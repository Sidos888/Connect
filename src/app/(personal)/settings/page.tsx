"use client";

import { useState, useEffect } from "react";
import Button from "@/components/Button";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import { LogOut, Trash2 } from "lucide-react";
import Avatar from "@/components/Avatar";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SettingsPage() {
  const router = useRouter();
  const { clearAll, personalProfile } = useAppStore();
  const { signOut, deleteAccount, user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileSnapshot, setProfileSnapshot] = useState(personalProfile);

  // Keep profile snapshot updated (but not during logout)
  useEffect(() => {
    if (!isLoggingOut && personalProfile) {
      setProfileSnapshot(personalProfile);
    }
  }, [personalProfile, isLoggingOut]);

  // Hide bottom nav on mobile settings page
  useEffect(() => {
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
    
    hideBottomNav();
    
    return () => {
      showBottomNav();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      // Set logging out state to freeze the profile display
      setIsLoggingOut(true);
      
      await signOut();
      clearAll();
      router.replace("/explore");
    } catch (error) {
      console.error('Sign out error:', error);
      // Fallback to local clear
      clearAll();
      router.replace("/explore");
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const proceedToFinalConfirm = () => {
    setShowFinalConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    console.log('Settings: Starting account deletion...');
    setIsDeletingAccount(true);
    
    try {
      console.log('Settings: Calling deleteAccount()...');
      const { error } = await deleteAccount();
      console.log('Settings: deleteAccount() completed, error:', error);
      
      if (error) {
        console.error('Settings: Delete account error:', error);
        alert('Error deleting account: ' + error.message);
        setIsDeletingAccount(false);
        return;
      }
      
      console.log('Settings: Account deleted successfully, clearing state...');
      
      // Clear all local state immediately
      console.log('Settings: Clearing all application state...');
      clearAll();
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any stuck React states
      if (typeof window !== 'undefined') {
        // Clear any stuck modal states
        window.dispatchEvent(new CustomEvent('reset-all-modals'));
        
        // Clear any React Query cache if it exists
        if ((window as any).__REACT_QUERY_STATE__) {
          delete (window as any).__REACT_QUERY_STATE__;
        }
        
        // Clear any other potential state caches
        Object.keys(window).forEach(key => {
          if (key.startsWith('__CONNECT_') || key.startsWith('__AUTH_')) {
            delete (window as any)[key];
          }
        });
      }
      
      // Force a full page reload to ensure completely clean state
      console.log('Settings: Forcing immediate page reload...');
      window.location.replace('/');  // Use replace instead of href for immediate effect
      
    } catch (error) {
      console.error('Settings: Unexpected error during account deletion:', error);
      alert('An unexpected error occurred. Please try again.');
      setIsDeletingAccount(false);
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
  };

  const backToFirstConfirm = () => {
    setShowFinalConfirm(false);
  };

  if (showDeleteConfirm) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-200">
          <button
            onClick={cancelDeleteAccount}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to settings"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Delete Account</h1>
        </div>

        <div className="flex-1 flex flex-col px-4 py-6">
          {isDeletingAccount ? (
            <div className="flex-1 flex flex-col justify-center items-center space-y-6">
              {/* Loading animation */}
              <LoadingSpinner size="lg" />
              
              {/* Loading message */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">Deleting Account</h3>
                <p className="text-gray-600 mt-2">Please wait while we remove your data...</p>
              </div>
            </div>
          ) : showFinalConfirm ? (
            <div className="flex flex-col h-full">
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
                  onClick={confirmDeleteAccount}
                  disabled={isDeletingAccount}
                  className="w-full px-6 py-4 text-base font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
                <button
                  onClick={cancelDeleteAccount}
                  className="w-full py-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Subtext in the middle - takes up remaining space */}
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-600 leading-relaxed text-center max-w-sm">
                  Are you sure you want to delete your account?
                </p>
              </div>
              
              {/* Action buttons at the bottom */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelDeleteAccount}
                  className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={proceedToFinalConfirm}
                  className="flex-1 px-6 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, []);

  return (
    <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col" style={{ paddingBottom: '0' }}>
      {/* Header */}
      <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Go back"
        >
          <span className="back-btn-circle">
          <ChevronLeftIcon className="h-5 w-5" />
          </span>
        </button>
          <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Settings</h1>
        </div>
      </div>

      {/* Settings content */}
      <div className="flex-1 flex flex-col px-4 py-4">
        {/* Profile Card - Use snapshot during logout to prevent flicker */}
        <div className="bg-gray-100 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              {profileSnapshot?.avatarUrl ? (
                <img 
                  src={profileSnapshot.avatarUrl} 
                  alt={profileSnapshot.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-medium text-lg">
                  {profileSnapshot?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {profileSnapshot?.name || 'Your Name'}
              </h3>
            </div>
            <button
              onClick={() => router.push('/settings/edit')}
              className="text-blue-600 underline text-sm font-medium hover:text-blue-700"
              disabled={isLoggingOut}
            >
              Edit
            </button>
          </div>
        </div>

        {/* Empty space to push buttons to bottom */}
        <div className="flex-1"></div>
        
        {/* Account actions at bottom */}
        <div className="space-y-3 pb-safe-bottom mb-4">
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={20} className="text-gray-600" />
            <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
          </button>
          
          <button
            onClick={handleDeleteAccount}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={20} className="text-red-500" />
            <span className="font-medium">Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}