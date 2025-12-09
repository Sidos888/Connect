"use client";

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/auth/LoginModal';
import SignUpModal from '@/components/auth/SignUpModal';
import { useAuth } from './authContext';
import { useAppStore } from './store';
import CenteredNotifications from '@/components/notifications/CenteredNotifications';
import CenteredMemories from '@/components/memories/CenteredMemories';
import CenteredAchievements from '@/components/achievements/CenteredAchievements';
import CenteredTimeline from '@/components/timeline/CenteredTimeline';
import CenteredShareProfile from '@/components/profile/CenteredShareProfile';
import CenteredConnections from '@/components/connections/CenteredConnections';
import CenteredAddPerson from '@/components/connections/CenteredAddPerson';
import CenteredAccountSettings from '@/components/settings/CenteredAccountSettings';
import CenteredHighlights from '@/components/highlights/CenteredHighlights';
import ProfilePage from '@/components/profile/ProfilePage';
import EditProfileLanding from '@/components/settings/EditProfileLanding';
import SettingsContent from '@/components/settings/SettingsContent';
import Saved from '@/components/saved/Saved';
import { PageHeader } from '@/components/layout/PageSystem';
import EditPersonalDetails, { EditPersonalDetailsRef } from '@/components/settings/EditPersonalDetails';
import { formatNameForDisplay } from '@/lib/utils';

interface ModalContextType {
  showLogin: () => void;
  showSignUp: () => void;
  showAddChat: () => void;
  showAddFriend: () => void;
  hideModals: () => void;
  isAnyModalOpen: boolean;
  // Profile modals
  showProfile: (from?: string) => void;
  showEditProfile: (from?: string) => void;
  showSettings: (from?: string) => void;
  showAccountSettings: () => void;
  showTimeline: (from?: string) => void;
  showHighlights: (from?: string) => void;
  showAchievements: () => void;
  showSaved: () => void;
  showNotifications: () => void;
  showMemories: () => void;
  showConnections: (from?: string) => void;
  showAddPerson: () => void;
  showShareProfile: (from?: string) => void;
  closeProfileModal: (modal: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isAddChatOpen, setIsAddChatOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [originalPath, setOriginalPath] = useState<string | null>(null);
  const router = useRouter();
  const { signOut, personalProfile } = useAuth();
  const { personalProfile: storeProfile } = useAppStore();

  // Profile modal states
  const [showCenteredProfile, setShowCenteredProfile] = useState(false);
  const [showCenteredEditLanding, setShowCenteredEditLanding] = useState(false);
  const [showCenteredEditPersonal, setShowCenteredEditPersonal] = useState(false);
  const [editPersonalLoading, setEditPersonalLoading] = useState(false);
  const [editPersonalHasChanges, setEditPersonalHasChanges] = useState(false);
  const editPersonalRef = React.useRef<EditPersonalDetailsRef>(null);
  const [showCenteredSettings, setShowCenteredSettings] = useState(false);

  // Track changes in edit personal details
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (editPersonalRef.current) {
        setEditPersonalHasChanges(editPersonalRef.current.hasChanges);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [showCenteredEditPersonal]);

  // Helper to close all modals
  const closeAllModals = () => {
    setShowCenteredProfile(false);
    setShowCenteredEditLanding(false);
    setShowCenteredEditPersonal(false);
    setShowCenteredSettings(false);
    setShowCenteredAccountSettings(false);
    setShowCenteredTimeline(false);
    setShowCenteredHighlights(false);
    setShowCenteredAchievements(false);
    setShowCenteredSaved(false);
    setShowCenteredNotifications(false);
    setShowCenteredMemories(false);
    setShowCenteredConnections(false);
    setShowCenteredAddPerson(false);
    setShowCenteredShareProfile(false);
    setShowCenteredFriendProfile(false);
  };
  const [showCenteredAccountSettings, setShowCenteredAccountSettings] = useState(false);
  const [showCenteredTimeline, setShowCenteredTimeline] = useState(false);
  const [showCenteredHighlights, setShowCenteredHighlights] = useState(false);
  const [showCenteredAchievements, setShowCenteredAchievements] = useState(false);
  const [showCenteredSaved, setShowCenteredSaved] = useState(false);
  const [showCenteredNotifications, setShowCenteredNotifications] = useState(false);
  const [showCenteredMemories, setShowCenteredMemories] = useState(false);
  const [showCenteredConnections, setShowCenteredConnections] = useState(false);
  const [showCenteredAddPerson, setShowCenteredAddPerson] = useState(false);
  const [showCenteredShareProfile, setShowCenteredShareProfile] = useState(false);

  // Navigation tracking states
  const [profileFromSettings, setProfileFromSettings] = useState(false);
  const [settingsFromProfile, setSettingsFromProfile] = useState(false);
  const [editProfileFromProfile, setEditProfileFromProfile] = useState(false);
  const [editProfileFromMyLife, setEditProfileFromMyLife] = useState(false);
  const [editProfileFromMenu, setEditProfileFromMenu] = useState(false);
  const [editProfileFromSettings, setEditProfileFromSettings] = useState(false);
  const [connectionsFromProfile, setConnectionsFromProfile] = useState(false);
  const [shareFromProfile, setShareFromProfile] = useState(false);
  const [shareFromSettings, setShareFromSettings] = useState(false);
  const [shareFromMyLife, setShareFromMyLife] = useState(false);
  const [shareFromMenu, setShareFromMenu] = useState(false);
  const [timelineFromProfile, setTimelineFromProfile] = useState(false);
  const [timelineFromEditProfile, setTimelineFromEditProfile] = useState(false);
  const [achievementsFromProfile, setAchievementsFromProfile] = useState(false);
  const [highlightsFromProfile, setHighlightsFromProfile] = useState(false);

  // Friend profile states
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [showCenteredFriendProfile, setShowCenteredFriendProfile] = useState(false);

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = 
      isLoginOpen ||
      isSignUpOpen ||
      showCenteredProfile ||
      showCenteredEditLanding ||
      showCenteredEditPersonal ||
      showCenteredSettings ||
      showCenteredAccountSettings ||
      showCenteredTimeline ||
      showCenteredHighlights ||
      showCenteredAchievements ||
      showCenteredSaved ||
      showCenteredNotifications ||
      showCenteredMemories ||
      showCenteredConnections ||
      showCenteredAddPerson ||
      showCenteredShareProfile ||
      showCenteredFriendProfile;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [
    isLoginOpen,
    isSignUpOpen,
    showCenteredProfile,
    showCenteredEditLanding,
    showCenteredEditPersonal,
    showCenteredSettings,
    showCenteredAccountSettings,
    showCenteredTimeline,
    showCenteredHighlights,
    showCenteredAchievements,
    showCenteredSaved,
    showCenteredNotifications,
    showCenteredMemories,
    showCenteredConnections,
    showCenteredAddPerson,
    showCenteredShareProfile,
    showCenteredFriendProfile,
  ]);

  // Listen for reset events to clear all modal states
  React.useEffect(() => {
    const handleResetModals = () => {
      console.log('ModalProvider: Resetting all modal states');
      setIsLoginOpen(false);
      setIsSignUpOpen(false);
      setIsAddChatOpen(false);
      setIsAddFriendOpen(false);
    };

    window.addEventListener('reset-all-modals', handleResetModals);
    
    return () => {
      window.removeEventListener('reset-all-modals', handleResetModals);
    };
  }, []);

  const showLogin = () => {
    console.log('ModalProvider: showLogin called');
    console.log('ModalProvider: Current modal states:', { isLoginOpen, isSignUpOpen });
    // Capture current path before opening modal
    setOriginalPath(window.location.pathname);
    setIsLoginOpen(true);
    setIsSignUpOpen(false);
    console.log('ModalProvider: Login modal should now be open');
  };

  const showSignUp = () => {
    console.log('ModalProvider: showSignUp called');
    console.log('ModalProvider: Current modal states:', { isLoginOpen, isSignUpOpen });
    // Capture current path before opening modal
    setOriginalPath(window.location.pathname);
    setIsSignUpOpen(true);
    setIsLoginOpen(false);
    console.log('ModalProvider: SignUp modal should now be open');
  };

  const showAddChat = () => {
    setIsAddChatOpen(true);
    setIsLoginOpen(false);
    setIsSignUpOpen(false);
    setIsAddFriendOpen(false);
  };

  const showAddFriend = () => {
    setIsAddFriendOpen(true);
    setIsLoginOpen(false);
    setIsSignUpOpen(false);
    setIsAddChatOpen(false);
  };

  const hideModals = () => {
    setIsLoginOpen(false);
    setIsSignUpOpen(false);
    setIsAddChatOpen(false);
    setIsAddFriendOpen(false);
    setOriginalPath(null);
    // Also reset all profile modals
    setShowCenteredProfile(false);
    setShowCenteredEditLanding(false);
    setShowCenteredEditPersonal(false);
    setShowCenteredSettings(false);
    setShowCenteredAccountSettings(false);
    setShowCenteredTimeline(false);
    setShowCenteredHighlights(false);
    setShowCenteredAchievements(false);
    setShowCenteredSaved(false);
    setShowCenteredNotifications(false);
    setShowCenteredMemories(false);
    setShowCenteredConnections(false);
    setShowCenteredAddPerson(false);
    setShowCenteredShareProfile(false);
    setShowCenteredFriendProfile(false);
    setSelectedFriend(null);
    // Reset navigation tracking
    setProfileFromSettings(false);
    setSettingsFromProfile(false);
    setEditProfileFromProfile(false);
    setConnectionsFromProfile(false);
    setShareFromProfile(false);
    setShareFromSettings(false);
    setShareFromMyLife(false);
    setEditProfileFromMyLife(false);
    setTimelineFromProfile(false);
    setTimelineFromEditProfile(false);
  };

  // Profile modal functions
  const showProfile = (from?: string) => {
    console.log('🔵 showProfile called, from:', from);
    if (from === 'settings') setProfileFromSettings(true);
    setShowCenteredProfile(true);
  };

  const showEditProfile = (from?: string) => {
    if (from === 'profile') setEditProfileFromProfile(true);
    if (from === 'my-life') setEditProfileFromMyLife(true);
    if (from === 'menu') setEditProfileFromMenu(true);
    if (from === 'settings') setEditProfileFromSettings(true);
    setShowCenteredEditLanding(true);
  };

  const showSettings = (from?: string) => {
    if (from === 'profile') setSettingsFromProfile(true);
    setShowCenteredSettings(true);
  };

  const showAccountSettings = () => {
    setShowCenteredAccountSettings(true);
  };

  const showTimeline = (from?: string) => {
    // On mobile, navigate to route instead of modal
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      router.push('/timeline');
      return;
    }
    if (from === 'profile') setTimelineFromProfile(true);
    if (from === 'editProfile') setTimelineFromEditProfile(true);
    setShowCenteredTimeline(true);
  };

  const showHighlights = (from?: string) => {
    // On mobile, navigate to route instead of modal
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      router.push('/highlights');
      return;
    }
    if (from === 'profile') setHighlightsFromProfile(true);
    setShowCenteredHighlights(true);
  };

  const showAchievements = (from?: string) => {
    // On mobile, navigate to route instead of modal
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      router.push('/achievements');
      return;
    }
    if (from === 'profile') setAchievementsFromProfile(true);
    setShowCenteredAchievements(true);
  };

  const showSaved = () => {
    setShowCenteredSaved(true);
  };

  const showNotifications = () => {
    setShowCenteredNotifications(true);
  };

  const showMemories = () => {
    setShowCenteredMemories(true);
  };

  const showConnections = (from?: string) => {
    console.log('🟦 ModalContext: showConnections called', { 
      from, 
      currentState: showCenteredConnections,
      timestamp: new Date().toISOString() 
    });
    if (from === 'profile') setConnectionsFromProfile(true);
    setShowCenteredConnections(true);
  };

  const showAddPerson = () => {
    setShowCenteredAddPerson(true);
  };

  const showShareProfile = (from?: string) => {
    if (from === 'profile') setShareFromProfile(true);
    if (from === 'my-life') setShareFromMyLife(true);
    if (from === 'menu') setShareFromMenu(true);
    if (from === 'settings') setShareFromSettings(true);
    setShowCenteredShareProfile(true);
  };

  const closeProfileModal = (modal: string) => {
    console.log('🟥 ModalContext: closeProfileModal called', { 
      modal, 
      timestamp: new Date().toISOString() 
    });
    switch (modal) {
      case 'profile':
        setShowCenteredProfile(false);
        if (profileFromSettings) {
          setShowCenteredSettings(true);
          setProfileFromSettings(false);
        }
        break;
      case 'editProfile':
        setShowCenteredEditLanding(false);
        setShowCenteredEditPersonal(false);
        if (editProfileFromProfile) {
          setShowCenteredProfile(true);
          setEditProfileFromProfile(false);
        } else if (editProfileFromSettings) {
          setShowCenteredSettings(true);
          setEditProfileFromSettings(false);
        } else if (editProfileFromMyLife) {
          // Don't open any modal - just close (returns to My Life page)
          setEditProfileFromMyLife(false);
        } else if (editProfileFromMenu) {
          // Don't open any modal - just close (returns to menu)
          setEditProfileFromMenu(false);
        } else {
          setShowCenteredSettings(true);
        }
        break;
      case 'settings':
        setShowCenteredSettings(false);
        if (settingsFromProfile) {
          setShowCenteredProfile(true);
          setSettingsFromProfile(false);
        }
        break;
      case 'accountSettings':
        setShowCenteredAccountSettings(false);
        setShowCenteredSettings(true);
        break;
      case 'timeline':
        setShowCenteredTimeline(false);
        if (timelineFromProfile) {
          setShowCenteredProfile(true);
          setTimelineFromProfile(false);
        } else if (timelineFromEditProfile) {
          setShowCenteredEditLanding(true);
          setTimelineFromEditProfile(false);
        }
        break;
      case 'highlights':
        setShowCenteredHighlights(false);
        if (highlightsFromProfile) {
          setShowCenteredProfile(true);
          setHighlightsFromProfile(false);
        }
        break;
      case 'achievements':
        setShowCenteredAchievements(false);
        if (achievementsFromProfile) {
          setShowCenteredProfile(true);
          setAchievementsFromProfile(false);
        }
        break;
      case 'saved':
        setShowCenteredSaved(false);
        break;
      case 'notifications':
        setShowCenteredNotifications(false);
        break;
      case 'memories':
        setShowCenteredMemories(false);
        break;
      case 'connections':
        setShowCenteredConnections(false);
        if (connectionsFromProfile) {
          setShowCenteredProfile(true);
          setConnectionsFromProfile(false);
        }
        break;
      case 'addPerson':
        setShowCenteredAddPerson(false);
        setShowCenteredConnections(true);
        break;
      case 'shareProfile':
        setShowCenteredShareProfile(false);
        if (shareFromProfile) {
          setShowCenteredProfile(true);
          setShareFromProfile(false);
        } else if (shareFromSettings) {
          setShowCenteredSettings(true);
          setShareFromSettings(false);
        } else if (shareFromMyLife) {
          // Don't open any modal - just close (returns to My Life page)
          setShareFromMyLife(false);
        } else if (shareFromMenu) {
          // Don't open any modal - just close (returns to menu)
          setShareFromMenu(false);
        }
        break;
      case 'friendProfile':
        setShowCenteredFriendProfile(false);
        setSelectedFriend(null);
        setShowCenteredConnections(true);
        break;
      default:
        break;
    }
  };

  return (
    <ModalContext.Provider value={{ 
      showLogin, 
      showSignUp, 
      showAddChat, 
      showAddFriend, 
      hideModals, 
      isAnyModalOpen: isLoginOpen || isSignUpOpen || isAddChatOpen || isAddFriendOpen,
      // Profile modals
      showProfile,
      showEditProfile,
      showSettings,
      showAccountSettings,
      showTimeline,
      showHighlights,
      showAchievements,
      showSaved,
      showNotifications,
      showMemories,
      showConnections,
      showAddPerson,
      showShareProfile,
      closeProfileModal
    }}>
      {children}
      
      {/* Render modals at root level */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={async () => {
          // NOT signing out - preserving user state
          console.log('ModalContext: Closing modal but preserving user authentication');
          setIsLoginOpen(false);
          // Return to original page if available
          if (originalPath && originalPath !== window.location.pathname) {
            router.push(originalPath);
          }
        }}
        onProfileSetup={() => {
          setIsLoginOpen(false);
          // Don't redirect to onboarding - let AccountCheckModal handle profile creation
        }}
      />

      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={async () => {
          // NOT signing out - preserving user state
          console.log('ModalContext: Closing modal but preserving user authentication');
          setIsSignUpOpen(false);
          // Return to original page if available
          if (originalPath && originalPath !== window.location.pathname) {
            router.push(originalPath);
          }
        }}
        onProfileSetup={() => {
          setIsSignUpOpen(false);
          // Don't redirect to onboarding - let AccountCheckModal handle profile creation
        }}
      />

      {/* Profile Modal */}
      {showCenteredProfile && (
        <div className="flex fixed inset-0 z-50 items-center justify-center p-4">
          <div 
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('profile')}
          />
          <ProfilePage
            profile={{ 
              id: storeProfile?.id, 
              name: storeProfile?.name, 
              avatarUrl: storeProfile?.avatarUrl, 
              bio: storeProfile?.bio 
            }}
            isOwnProfile={true}
            showBackButton={profileFromSettings}
            onClose={() => closeProfileModal('profile')}
            onEdit={() => { 
              setShowCenteredProfile(false); 
              setEditProfileFromProfile(true); 
              setShowCenteredEditLanding(true); 
            }}
            onSettings={() => { 
              setShowCenteredProfile(false); 
              setSettingsFromProfile(true); 
              setShowCenteredSettings(true); 
            }}
            onShare={() => { 
              setShowCenteredProfile(false); 
              setShareFromProfile(true); 
              setShowCenteredShareProfile(true); 
            }}
            onOpenTimeline={() => { 
              setShowCenteredProfile(false); 
              showTimeline('profile');
            }}
            onOpenHighlights={() => { 
              setShowCenteredProfile(false); 
              showHighlights('profile');
            }}
            onOpenBadges={() => { 
              setShowCenteredProfile(false); 
              showAchievements('profile');
            }}
            onOpenConnections={() => { 
              setShowCenteredProfile(false); 
              showConnections('profile');
            }}
          />
        </div>
      )}

      {/* Edit Profile Landing Modal */}
      {showCenteredEditLanding && (
        <div className="flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('editProfile')}
          />
          <EditProfileLanding
            name={storeProfile?.name ?? 'Your Name'}
            avatarUrl={storeProfile?.avatarUrl ?? undefined}
            onBack={() => closeProfileModal('editProfile')}
            backIcon={(editProfileFromMyLife || editProfileFromMenu) ? 'close' : 'arrow'}
            onOpenLinks={() => { setShowCenteredEditLanding(false); router.push('/settings/edit/links'); }}
            onOpenPersonalDetails={() => { setShowCenteredEditLanding(false); setShowCenteredEditPersonal(true); }}
            onOpenTimeline={() => { setShowCenteredEditLanding(false); setTimelineFromEditProfile(true); setShowCenteredTimeline(true); }}
            onOpenHighlights={() => { setShowCenteredEditLanding(false); router.push('/settings/edit/highlights'); }}
          />
        </div>
      )}

      {/* Settings Modal */}
      {showCenteredSettings && (
        <div className="flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('settings')}
          />
          <div 
            className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative"
            style={{ '--saved-content-padding-top': '104px' } as React.CSSProperties}
          >
            <PageHeader
              title="Settings"
              backButton
              backIcon={settingsFromProfile ? "arrow" : "close"}
              onBack={() => closeProfileModal('settings')}
            />
            
            <div className="flex-1 overflow-y-auto scrollbar-hide" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <SettingsContent
                onBack={() => closeProfileModal('settings')}
                onSignOut={async () => {
                  console.log('🚪 Logging out from Settings...');
                  
                  // Close ALL modals immediately
                  closeAllModals();
                  
                  // Sign out and clear all state (WAIT for it to complete)
                  await signOut();
                  
                  console.log('✅ Logout complete, navigating to explore');
                  
                  // Force navigation to explore page - use multiple methods for reliability
                  try {
                    // Method 1: Next.js router (preferred)
                    router.replace('/explore');
                    console.log('🧭 Navigation: Used router.replace(/explore)');
                    
                    // Method 2: Fallback with window.location after a short delay
                    setTimeout(() => {
                      if (window.location.pathname !== '/explore') {
                        console.log('🧭 Navigation: Fallback - using window.location.replace');
                        window.location.replace('/explore');
                      } else {
                        console.log('🧭 Navigation: Already on /explore, skipping fallback');
                      }
                    }, 100);
                  } catch (navError) {
                    console.error('⚠️ Navigation error, using window.location fallback:', navError);
                    window.location.replace('/explore');
                  }
                  
                  // Force open login modal after a short delay
                  setTimeout(() => {
                    console.log('🔓 Opening login modal after logout');
                    setIsLoginOpen(true);
                  }, 500);
                }}
                onDeleteAccount={() => {}}
                showDeleteConfirm={false}
                showFinalConfirm={false}
                onConfirmDelete={async () => {}}
                onCancelDelete={() => {}}
                onProceedToFinalConfirm={() => {}}
                onBackToMenu={() => {}}
                isDeletingAccount={false}
                personalProfile={storeProfile}
                showBackButton={false}
                onViewProfile={() => {
                  setShowCenteredSettings(false);
                  setProfileFromSettings(true);
                  setShowCenteredProfile(true);
                }}
                onEditProfile={() => {
                  setShowCenteredSettings(false);
                  setEditProfileFromSettings(true);
                  setShowCenteredEditLanding(true);
                }}
                onShareProfile={() => {
                  setShowCenteredSettings(false);
                  setShareFromSettings(true);
                  setShowCenteredShareProfile(true);
                }}
                onAccountSettings={() => {
                  setShowCenteredSettings(false);
                  setShowCenteredAccountSettings(true);
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
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
      {showCenteredAccountSettings && (
        <CenteredAccountSettings
          onClose={() => closeProfileModal('accountSettings')}
          onDeleteAccount={() => {}}
        />
      )}

      {/* Timeline Modal */}
      {showCenteredTimeline && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('timeline')}
          />
          <div 
            className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative"
            style={{ '--saved-content-padding-top': '104px' } as React.CSSProperties}
          >
            <CenteredTimeline 
              onClose={() => closeProfileModal('timeline')} 
              fromProfile={timelineFromProfile || timelineFromEditProfile}
            />
          </div>
        </div>
      )}

      {/* Connections Modal */}
      {showCenteredConnections && (() => {
        console.log('🟩 ModalContext: Rendering Connections modal', { 
          showCenteredConnections,
          connectionsFromProfile,
          timestamp: new Date().toISOString() 
        });
        return (
        <div className="flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('connections')}
          />
          <CenteredConnections
            onBack={() => closeProfileModal('connections')}
            fromProfile={connectionsFromProfile}
            showAddPersonButton={true}
            onAddPerson={() => {
              setShowCenteredConnections(false);
              setShowCenteredAddPerson(true);
            }}
            onFriendClick={(friend) => {
              setSelectedFriend(friend);
              setShowCenteredConnections(false);
              setShowCenteredFriendProfile(true);
            }}
          />
        </div>
        );
      })()}

      {/* Add Person Modal */}
      {showCenteredAddPerson && (
        <div className="flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('addPerson')}
          />
          <CenteredAddPerson
            onBack={() => closeProfileModal('addPerson')}
            onOpenRequests={() => {}}
          />
        </div>
      )}

      {/* Notifications Modal */}
      {showCenteredNotifications && (
        <div className="flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('notifications')}
          />
          <CenteredNotifications onBack={() => closeProfileModal('notifications')} />
        </div>
      )}

      {/* Memories Modal */}
      {showCenteredMemories && (
        <div className="flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('memories')}
          />
          <CenteredMemories onBack={() => closeProfileModal('memories')} />
        </div>
      )}

      {/* Achievements Modal */}
      {showCenteredAchievements && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('achievements')}
          />
          <CenteredAchievements 
            onBack={() => closeProfileModal('achievements')} 
            fromProfile={achievementsFromProfile}
          />
        </div>
      )}

      {/* Highlights Modal */}
      {showCenteredHighlights && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('highlights')}
          />
          <CenteredHighlights 
            onBack={() => closeProfileModal('highlights')} 
            fromProfile={highlightsFromProfile}
          />
        </div>
      )}

      {/* Saved Modal */}
      {showCenteredSaved && (
        <div className="flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('saved')}
          />
          <div 
            className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative"
            style={{ '--saved-content-padding-top': '104px' } as React.CSSProperties}
          >
            <PageHeader
              title="Saved"
              backButton
              backIcon="close"
              onBack={() => closeProfileModal('saved')}
            />
            <Saved />
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
          </div>
        </div>
      )}

      {/* Share Profile Modal */}
      {showCenteredShareProfile && (
        <div className="flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('shareProfile')}
          />
          <CenteredShareProfile 
            onBack={() => closeProfileModal('shareProfile')}
            backIcon={(shareFromMyLife || shareFromMenu) ? 'close' : 'arrow'}
          />
        </div>
      )}

      {/* Friend Profile Modal */}
      {showCenteredFriendProfile && selectedFriend && (
        <div className="flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => closeProfileModal('friendProfile')}
          />
          <ProfilePage
            profile={{ 
              id: selectedFriend.id, 
              name: selectedFriend.name, 
              avatarUrl: selectedFriend.profile_pic, 
              bio: selectedFriend.bio 
            }}
            isOwnProfile={false}
            showBackButton={true}
            onClose={() => closeProfileModal('friendProfile')}
            onThreeDotsMenu={() => {}}
            onOpenConnections={() => {}}
          />
        </div>
      )}

      {/* Edit Personal Details Modal (Web Only) */}
      {showCenteredEditPersonal && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => {
              setShowCenteredEditPersonal(false);
              setShowCenteredEditLanding(true);
            }}
          />
          <div 
            className="relative bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100"
            style={{ '--saved-content-padding-top': '104px' } as React.CSSProperties}
          >
            <PageHeader
              title="Personal Details"
              backButton
              backIcon="arrow"
              onBack={() => {
                setShowCenteredEditPersonal(false);
                setShowCenteredEditLanding(true);
              }}
              customActions={
                editPersonalHasChanges ? (
                  <button
                    key="save"
                    onClick={async () => {
                      if (editPersonalRef.current && !editPersonalLoading) {
                        setEditPersonalLoading(true);
                        console.log('💾 Saving personal details...');
                        try {
                          await editPersonalRef.current.save();
                          console.log('✅ Save completed, closing modal');
                          // Success - close modal and go back to edit landing
                          setShowCenteredEditPersonal(false);
                          setShowCenteredEditLanding(true);
                          setEditPersonalLoading(false);
                          setEditPersonalHasChanges(false);
                        } catch (e) {
                          console.error('❌ Error saving:', e);
                          setEditPersonalLoading(false);
                        }
                      }
                    }}
                    disabled={editPersonalLoading}
                    className="flex items-center justify-center transition-all"
                    style={{
                      height: '40px',
                      paddingLeft: editPersonalLoading ? '20px' : '20px',
                      paddingRight: editPersonalLoading ? '20px' : '20px',
                      minWidth: editPersonalLoading ? '70px' : 'auto',
                      borderRadius: '100px',
                      background: '#FF6600',
                      borderWidth: '0.4px',
                      borderColor: 'rgba(0, 0, 0, 0.04)',
                      borderStyle: 'solid',
                      boxShadow: editPersonalLoading 
                        ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                        : '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      transform: editPersonalLoading ? 'translateY(0)' : 'translateY(0)',
                      willChange: 'transform, box-shadow',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: editPersonalLoading ? 'not-allowed' : 'pointer',
                      opacity: editPersonalLoading ? 0.7 : 1,
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (!editPersonalLoading) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!editPersonalLoading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                  >
                    {editPersonalLoading ? (
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
                      </div>
                    ) : (
                      'Save'
                    )}
                  </button>
                ) : null
              }
            />
            
            <EditPersonalDetails
              ref={editPersonalRef}
              loading={editPersonalLoading}
            />
            
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
          </div>
        </div>
      )}

    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
