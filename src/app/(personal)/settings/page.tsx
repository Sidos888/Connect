"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import SettingsContent from "@/components/settings/SettingsContent";

export default function SettingsPage() {
  const router = useRouter();
  const { clearAll, personalProfile } = useAppStore();
  const { signOut, deleteAccount, user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Handle back button - redirect to the page user came from
  const handleBack = () => {
    // Only access sessionStorage on client side
    if (typeof window === 'undefined') {
      router.back();
      return;
    }
    
    // Check if we have a stored previous page
    const previousPage = sessionStorage.getItem('settings_previous_page');
    
    if (previousPage) {
      // Clear the stored page
      sessionStorage.removeItem('settings_previous_page');
      // Navigate to the previous page
      router.push(previousPage);
    } else {
      // Fallback to browser back history
      router.back();
    }
  };


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
    await signOut();
    clearAll();
    router.replace("/");
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    await deleteAccount();
    setIsDeletingAccount(false);
    clearAll();
    router.replace('/');
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
  };

  const backToMenu = () => {
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col lg:max-w-2xl lg:mx-auto">
      {/* Header */}
      <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10"
            style={{
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-[18px] leading-6 text-gray-900">Settings</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Settings content - use shared component */}
      <div className="flex-1 overflow-hidden">
        <SettingsContent
          onBack={handleBack}
          onSignOut={handleSignOut}
          onDeleteAccount={handleDeleteAccount}
          showDeleteConfirm={showDeleteConfirm}
          showFinalConfirm={showFinalConfirm}
          onConfirmDelete={confirmDeleteAccount}
          onCancelDelete={cancelDeleteAccount}
          onProceedToFinalConfirm={() => setShowFinalConfirm(true)}
          onBackToMenu={backToMenu}
          isDeletingAccount={isDeletingAccount}
          personalProfile={personalProfile}
          showBackButton={false}
          onViewProfile={() => {
            router.push('/menu?view=profile');
          }}
          onEditProfile={() => {
            router.push('/settings/edit');
          }}
          onAccountSettings={() => {
            router.push('/settings/account-settings');
          }}
        />
      </div>
    </div>
  );
}