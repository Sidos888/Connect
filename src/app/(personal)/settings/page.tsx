"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import SettingsContent from "@/components/settings/SettingsContent";

export default function SettingsPage() {
  const router = useRouter();
  const { clearAll, personalProfile } = useAppStore();
  const { signOut, deleteAccount } = useAuth();
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
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Settings"
          backButton
          onBack={handleBack}
        />
        
        <div className="flex-1 overflow-y-auto scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
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
        
        {/* Bottom Blur */}
        <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: '80px',
            background: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0) 100%)'
          }} />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '20px', backdropFilter: 'blur(0.5px)', WebkitBackdropFilter: 'blur(0.5px)' }} />
          <div className="absolute left-0 right-0" style={{ bottom: '20px', height: '20px', backdropFilter: 'blur(0.3px)', WebkitBackdropFilter: 'blur(0.3px)' }} />
          <div className="absolute left-0 right-0" style={{ bottom: '40px', height: '20px', backdropFilter: 'blur(0.15px)', WebkitBackdropFilter: 'blur(0.15px)' }} />
          <div className="absolute left-0 right-0" style={{ bottom: '60px', height: '20px', backdropFilter: 'blur(0.05px)', WebkitBackdropFilter: 'blur(0.05px)' }} />
        </div>
      </MobilePage>
    </div>
  );
}