"use client";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Link from "next/link";
import ProfileStrip from "@/components/my-life/ProfileStrip";
import ProfileCard from "@/components/profile/ProfileCard";
import { useAppStore, useCurrentBusiness } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { ChevronDownIcon, BellIcon, ChevronLeftIcon } from "@/components/icons";
import { LogOut, Trash2, ChevronRightIcon, Eye, Pencil, Settings, MoreVertical, Plus, Share, QrCode } from "lucide-react";
import { SearchIcon } from "@/components/icons";
import { connectionsService, User as ConnectionUser, FriendRequest } from '@/lib/connectionsService';
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import { supabase as supabaseClient } from "@/lib/supabaseClient";
import ProfileModal from "@/components/profile/ProfileModal";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import ImagePicker from "@/components/ImagePicker";
import HappeningNowBanner from "@/components/HappeningNowBanner";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProfilePage from "@/components/profile/ProfilePage";
import LifePage from "@/components/profile/LifePage";
import EditProfileLanding from "@/components/settings/EditProfileLanding";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import MenuTopActions from "@/components/layout/MenuTopActions";
import ThreeDotLoading from "@/components/ThreeDotLoading";
import ThreeDotLoadingBounce from "@/components/ThreeDotLoadingBounce";
import Highlights from "@/components/highlights/Highlights";
import Timeline from "@/components/timeline/Timeline";
import Achievements from "@/components/achievements/Achievements";
import Connections from "@/components/connections/Connections";
import CenteredConnections from "@/components/connections/CenteredConnections";
import AddPage from "@/components/connections/AddPage";
import FriendRequestsModal from "@/components/connections/FriendRequestsModal";
import ConnectionsSearchModal from "@/components/connections/ConnectionsSearchModal";
import SettingsContent from "@/components/settings/SettingsContent";
import Notifications from "@/components/notifications/Notifications";
import Memories from "@/components/memories/Memories";
import Saved from "@/components/saved/Saved";
import ShareProfile from "@/components/profile/ShareProfile";
import AccountSettings from "@/components/settings/AccountSettings";

// Module-level cache for connections (persists across component mounts)
let connectionsCache: {
  data: any[] | null;
  timestamp: number | null;
  userId: string | null;
} = { data: null, timestamp: null, userId: null };

// FORCE RECOMPILE 2025-09-18
export default function Page() {
  const router = useRouter();
  const { personalProfile, context, resetMenuState } = useAppStore();
  const { signOut, deleteAccount, user, updateProfile, uploadAvatar, account, refreshAuthState, loadUserProfile } = useAuth();
  const currentBusiness = useCurrentBusiness();
  const [currentView, setCurrentView] = React.useState<'menu' | 'settings' | 'connections' | 'add-person' | 'friend-requests' | 'profile' | 'edit-profile' | 'friend-profile' | 'friend-connections' | 'highlights' | 'timeline' | 'achievements' | 'notifications' | 'memories' | 'saved' | 'share-profile' | 'account-settings' | 'life'>('menu');
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [selectedFriend, setSelectedFriend] = React.useState<ConnectionUser | null>(null);
  const [connectionsContextUser, setConnectionsContextUser] = React.useState<ConnectionUser | null>(null); // Track whose connections we're viewing
  const [showCenteredProfile, setShowCenteredProfile] = React.useState(false);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = React.useState(false);
  const [isConnectionsSearchOpen, setIsConnectionsSearchOpen] = React.useState(false);
  const [connectionsSearchQuery, setConnectionsSearchQuery] = React.useState('');

  // Helper to load a friend's profile by userId
  const loadFriendProfile = React.useCallback(async (userId: string, setAsConnectionsContext = false) => {
    console.log('🔷 Menu page: Loading friend profile for userId:', userId, 'setAsConnectionsContext:', setAsConnectionsContext);
    
    try {
      const { data, error } = await supabaseClient
        .from('accounts')
        .select('id, name, profile_pic, bio, profile_visibility, dob')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('🔷 Menu page: Error loading friend profile:', error);
        return;
      }

      if (data) {
        const friendUser: ConnectionUser = {
          id: data.id,
          name: data.name,
          bio: data.bio,
          profile_pic: data.profile_pic,
          connect_id: '',
          created_at: '',
          profile_visibility: data.profile_visibility,
          dob: data.dob
        };
        
        console.log('🔷 Menu page: Friend profile loaded:', friendUser);
        setSelectedFriend(friendUser);
        
        // If this is for viewing connections, also set as context
        if (setAsConnectionsContext) {
          console.log('🔷 Menu page: Setting as connections context user');
          setConnectionsContextUser(friendUser);
        }
      }
    } catch (error) {
      console.error('🔷 Menu page: Error in loadFriendProfile:', error);
    }
  }, []);

  // Drive currentView from URL query (?view=...)
  const searchParams = useSearchParams();
  React.useEffect(() => {
    const view = searchParams?.get('view');
    const userId = searchParams?.get('userId');
    
    console.log('🔶 Menu page: URL params:', { view, userId, currentView });
    
    if (view === 'profile') setCurrentView('profile');
    else if (view === 'highlights') setCurrentView('highlights');
    else if (view === 'timeline') setCurrentView('timeline');
    else if (view === 'achievements') setCurrentView('achievements');
    else if (view === 'life') setCurrentView('life');
    else if (view === 'connections') setCurrentView('connections');
    else if (view === 'settings') setCurrentView('settings');
    else if (view === 'notifications') setCurrentView('notifications');
    else if (view === 'memories') setCurrentView('memories');
    else if (view === 'saved') {
      console.log('Menu page: Setting currentView to saved');
      setCurrentView('saved');
    }
    else if (view === 'edit-profile') setCurrentView('edit-profile');
    else if (view === 'share-profile') setCurrentView('share-profile');
    else if (view === 'account-settings') setCurrentView('account-settings');
    else if (view === 'add-person' || view === 'add-friends') setCurrentView('add-person');
    else if (view === 'friend-requests') setCurrentView('friend-requests');
    else if (view === 'friend-profile') {
      console.log('🔶 Menu page: Setting currentView to friend-profile');
      setCurrentView('friend-profile');
    }
    else if (view === 'friend-connections' && userId) {
      console.log('🔶 Menu page: Setting currentView to friend-connections, loading friend:', userId);
      setCurrentView('friend-connections');
      
      // Load the friend's profile and set as connections context
      loadFriendProfile(userId, true); // true = set as connections context user
    }
    else if (!view) setCurrentView('menu');
  }, [searchParams]);

  // Hide bottom nav when on add-person or friend-connections view
  React.useEffect(() => {
    if (currentView === 'add-person' || currentView === 'friend-connections') {
      document.body.classList.add('connections-mode');
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('connections-mode');
      document.body.classList.remove('no-scroll');
    }

    return () => {
      document.body.classList.remove('connections-mode');
      document.body.classList.remove('no-scroll');
    };
  }, [currentView]);

  // Helper to update URL to a view on /menu (keeps transitions smooth)
  const goToView = (view: 'menu' | 'profile' | 'highlights' | 'timeline' | 'achievements' | 'connections' | 'settings' | 'notifications' | 'memories' | 'saved' | 'edit-profile' | 'share-profile' | 'account-settings' | 'add-person' | 'friend-requests' | 'friend-profile' | 'friend-connections' | 'life', from?: string, userId?: string) => {
    console.log('🔷 goToView called:', { view, from, userId });
    
    if (view === 'menu') {
      router.push('/menu');
    } else {
      let url = `/menu?view=${view}`;
      if (from) url += `&from=${from}`;
      if (userId) url += `&userId=${userId}`;
      
      console.log('🔷 goToView navigating to:', url);
      router.push(url);
    }
  };

  const handleFriendClick = (friend: ConnectionUser) => {
    setSelectedFriend(friend);
    goToView('friend-profile');
  };

  // Reset menu state when resetMenuState is called
  React.useEffect(() => {
    const handleReset = () => {
      goToView('menu');
      setShowProfileModal(false);
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
    
    if (currentView === 'edit-profile' || currentView === 'profile' || currentView === 'friend-profile' || currentView === 'highlights' || currentView === 'timeline' || currentView === 'achievements' || currentView === 'life' || currentView === 'connections' || currentView === 'settings' || currentView === 'notifications' || currentView === 'memories' || currentView === 'saved' || currentView === 'share-profile' || currentView === 'account-settings') {
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

  // No-op: snapshot capture removed

  const handleSignOut = async () => {
    console.log('Menu page: Starting sign out...');
    await signOut();
    console.log('Menu page: Sign out complete, navigating to explore');
    // Navigate to explore page (unsigned-in state) using replace to clear history
    router.replace('/explore');
    
    // Force a small delay to ensure state is cleared before navigation
    setTimeout(() => {
      // Ensure we're on explore page
      if (window.location.pathname !== '/explore') {
        router.replace('/explore');
      }
    }, 100);
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

  // Edit Profile Component - Using new design system
  const EditProfileView = () => {
    const from = searchParams?.get('from') || 'profile';
    return (
      <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex items-center justify-center">
        <EditProfileLanding
          name={currentAccount?.name}
          avatarUrl={currentAccount?.avatarUrl}
          onBack={() => goToView(from as any)}
          onOpenLinks={() => router.push('/settings/edit/links')}
          onOpenPersonalDetails={() => router.push('/settings/edit/details')}
          onOpenTimeline={() => router.push('/timeline')}
          onOpenHighlights={() => router.push('/highlights')}
        />
      </div>
    );
  };

  // Highlights View Component - Using same pattern as EditProfileView
  const HighlightsView = () => {
    const from = searchParams?.get('from') || 'menu';
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Highlights"
            backButton
            onBack={() => goToView(from as any)}
          />
          <Highlights />
          {/* Bottom Blur */}
          <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
            <div className="h-32 bg-gradient-to-t from-white via-white/95 to-transparent"></div>
          </div>
        </MobilePage>
      </div>
    );
  };

  // Timeline View Component
  const TimelineView = () => {
    const from = searchParams?.get('from') || 'menu';
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Timeline"
            backButton
            onBack={() => goToView(from as any)}
          />
          <Timeline />
          {/* Bottom Blur */}
          <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
            <div className="h-32 bg-gradient-to-t from-white via-white/95 to-transparent"></div>
          </div>
        </MobilePage>
      </div>
    );
  };

  // Achievements View Component
  const AchievementsView = () => {
    const from = searchParams?.get('from') || 'menu';
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Achievements"
            backButton
            onBack={() => goToView(from as any)}
          />
          <Achievements />
          {/* Bottom Blur */}
          <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
            <div className="h-32 bg-gradient-to-t from-white via-white/95 to-transparent"></div>
          </div>
        </MobilePage>
      </div>
    );
  };

  // Connections View Component
  const ConnectionsView = () => {
    const from = searchParams?.get('from') || 'menu';
    const handleFriendClick = (friend: ConnectionUser) => {
      router.push(`/profile?id=${friend.id}&from=connections`);
    };

    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Connections"
            backButton
            onBack={() => {
              // Check if we should return to new chat modal
              if (typeof window !== 'undefined') {
                const returnToNewChat = sessionStorage.getItem('returnToNewChat');
                if (returnToNewChat === 'true') {
                  sessionStorage.removeItem('returnToNewChat');
                  router.push('/chat?openNewChat=true');
                  return;
                }
              }
              goToView(from as any);
            }}
            actions={[
              {
                icon: <Plus size={20} className="text-gray-900" strokeWidth={2.5} />,
                onClick: () => router.push('/menu?view=add-person'),
                label: "Add person"
              }
            ]}
          />
          <div className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide" style={{
            paddingTop: 'var(--saved-content-padding-top, 140px)',
            paddingBottom: '32px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <Connections onFriendClick={handleFriendClick} />
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
  };

  // Settings View Component
  const SettingsView = () => {
    const from = searchParams?.get('from') || 'menu';
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [showFinalConfirm, setShowFinalConfirm] = React.useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

    const handleSignOut = async () => {
      await signOut();
      const { clearAll } = useAppStore.getState();
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
      const { clearAll } = useAppStore.getState();
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
            onBack={() => goToView(from as any)}
          />
          <div className="flex-1 overflow-y-auto scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <SettingsContent
              onBack={() => goToView(from as any)}
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
              onViewProfile={() => goToView('profile', 'settings')}
              onEditProfile={() => goToView('edit-profile', 'settings')}
              onShareProfile={() => goToView('share-profile', 'settings')}
              onAccountSettings={() => goToView('account-settings', 'settings')}
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
  };

  // Notifications View Component
  const NotificationsView = () => {
    const from = searchParams?.get('from') || 'menu';
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Notifications"
            backButton
            onBack={() => goToView(from as any)}
          />
          <Notifications />
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
  };

  // Memories View Component
  const MemoriesView = () => {
    const from = searchParams?.get('from') || 'menu';
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Memories"
            backButton
            onBack={() => goToView(from as any)}
          />
          <Memories />
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
  };

  // Account Settings View Component
  const AccountSettingsView = () => {
    const from = searchParams?.get('from') || 'settings';
    
    const handleDeleteAccount = async () => {
      // TODO: Add delete confirmation flow if needed
      await deleteAccount();
      const { clearAll } = useAppStore.getState();
      clearAll();
      router.replace('/');
    };

    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Account Settings"
            backButton
            onBack={() => goToView(from as any)}
          />
          <AccountSettings onDeleteAccount={handleDeleteAccount} />
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
  };

  // Share Profile View Component
  const ShareProfileView = () => {
    const fromParam = searchParams?.get('from');
    const from = fromParam ? decodeURIComponent(fromParam) : 'menu';
    
    const handleBack = () => {
      // If from is a full pathname (starts with /), navigate directly
      if (from.startsWith('/')) {
        router.push(from);
      } else {
        // Otherwise, treat it as a view name
        goToView(from as any);
      }
    };
    
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Share Profile"
            backButton
            onBack={handleBack}
          />
          <ShareProfile />
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
  };

  // Saved View Component
  const SavedView = () => {
    const from = searchParams?.get('from') || 'menu';
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Saved"
            backButton
            onBack={() => goToView(from as any)}
          />
          <Saved />
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
  };

  // Old Edit Profile Component (keeping for reference/backup)
  const OldEditProfileView = () => {
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

    // Lock background scroll while edit modal is open (web)
    React.useEffect(() => {
      document.body.classList.add('no-scroll');
      return () => document.body.classList.remove('no-scroll');
    }, []);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/50" onClick={() => goToView('profile')} />
        {/* Centered card */}
        <div className="relative bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Header inside card */}
          <div className="px-4 pb-4 pt-6">
            <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <button
                onClick={() => goToView('profile')}
                className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
                aria-label="Back to profile"
              >
                <span className="back-btn-circle">
                  <ChevronLeftIcon className="h-5 w-5" strokeWidth={2.5} />
                </span>
              </button>
              <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Edit Profile</h1>
            </div>
          </div>

          {/* Scrollable content inside card */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
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

          {/* Footer actions inside card */}
          <div className="px-4 py-4 border-t border-neutral-200">
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
                onClick={() => setCurrentView('profile')}
                className="text-base font-medium underline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Profile View Component
  const ProfileView = () => {
    const from = searchParams?.get('from') || 'menu';
    return (
        <ProfilePage
          profile={{
            id: account?.id || personalProfile?.id,
            name: currentAccount?.name,
            avatarUrl: currentAccount?.avatarUrl,
            bio: currentAccount?.bio,
            dateOfBirth: personalProfile?.dateOfBirth
          }}
          isOwnProfile={true}
          showBackButton={true}
        onClose={() => goToView(from as any)}
        onEdit={() => goToView('edit-profile', 'profile')}
          onSettings={() => goToView('settings', 'profile')}
        onShare={() => goToView('share-profile', 'profile')}
          onOpenTimeline={() => goToView('timeline', 'profile')}
        onOpenHighlights={() => goToView('highlights', 'profile')}
        onOpenBadges={() => goToView('achievements', 'profile')}
        onOpenFullLife={() => goToView('life', 'profile')}
        onOpenConnections={() => goToView('connections', 'profile')}
        />
    );
  };

  // Friend Profile Component
  const FriendProfileView = ({ friend }: { friend: ConnectionUser }) => {
    const from = searchParams?.get('from');
    
    console.log('🔵 FriendProfileView: Rendering', { 
      friendId: friend.id, 
      friendName: friend.name,
      profileVisibility: friend.profile_visibility,
      from
    });
    
    return (
        <ProfilePage
          profile={{
            id: friend.id,
            name: friend.name,
            avatarUrl: friend.profile_pic,
            bio: friend.bio,
            profile_visibility: friend.profile_visibility,
            dateOfBirth: friend.dob
          }}
          isOwnProfile={false}
          showBackButton={true}
        onClose={() => {
          console.log('🔵 FriendProfileView: onClose called, from:', from);
          
          // If we came from friend-connections, restore the context and go back there
          if (from === 'friend-connections' && connectionsContextUser) {
            console.log('🔵 FriendProfileView: Restoring connections context:', connectionsContextUser.name);
            setSelectedFriend(connectionsContextUser); // Restore the context user
            goToView('friend-connections', undefined, connectionsContextUser.id); // Pass userId!
          } else {
            // Otherwise go to your own connections
            goToView('connections');
          }
        }}
        onOpenConnections={() => {
          console.log('🔵 FriendProfileView: onOpenConnections called, switching to friend-connections');
          setConnectionsContextUser(friend); // Store whose connections we're viewing
          
          // Check if we're friends with this person
          const isFriendWithUser = friendshipStatus === 'friends';
          
          // If friends, show full connections; if not friends, show mutuals only
          goToView('friend-connections', 'friend-profile', friend.id);
        }}
        />
    );
  };

  // Friend Connections View - Show friend's connections list (no + button)
  const FriendConnectionsView = ({ friend }: { friend: ConnectionUser }) => {
    const [areFriends, setAreFriends] = React.useState(false);
    
    // Check if we're friends with this user
    React.useEffect(() => {
      const checkFriendship = async () => {
        if (!account?.id || !friend.id) return;
        
        const { connected } = await connectionsService.areConnected(account.id, friend.id);
        setAreFriends(connected);
      };
      
      checkFriendship();
    }, [friend.id, account?.id]);
    
    console.log('🟢 FriendConnectionsView: Rendering', { 
      friendId: friend.id, 
      friendName: friend.name,
      connectionsContextUser: connectionsContextUser?.name,
      areFriends
    });
    
    return (
      <CenteredConnections
        onBack={() => {
          console.log('🟢 FriendConnectionsView: onBack called');
          // Restore the friend whose connections we were viewing
          setSelectedFriend(friend);
          goToView('friend-profile');
        }}
        showAddPersonButton={false}
        userId={friend.id}
        showOnlyMutuals={!areFriends} // Show only mutuals if not friends
        onFriendClick={(clickedFriend) => {
          console.log('🟢 FriendConnectionsView: Friend clicked', { clickedFriendId: clickedFriend.id });
          // Keep the connections context, but update selected friend for profile view
          setSelectedFriend(clickedFriend);
          goToView('friend-profile', 'friend-connections');
        }}
      />
    );
  };

  // OLD AddPersonView component removed - now using AddPersonWrapper with AddPage component instead

  // Friend Requests full-screen view
  const FriendRequestsView = () => {
    const { account } = useAuth();
    const [requests, setRequests] = React.useState<FriendRequest[]>([]);

    React.useEffect(() => {
      const load = async () => {
        if (!account?.id) return;
        const { requests, error } = await connectionsService.getPendingRequests(account.id);
        if (!error) setRequests(requests);
      };
      load();
    }, [account?.id]);

    const handleAccept = async (requestId: string) => {
      const { error } = await connectionsService.acceptFriendRequest(requestId);
      if (!error) setRequests(prev => prev.filter(r => r.id !== requestId));
    };

    const handleReject = async (requestId: string) => {
      const { error } = await connectionsService.rejectFriendRequest(requestId);
      if (!error) setRequests(prev => prev.filter(r => r.id !== requestId));
    };

    return (
      <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col" style={{ paddingBottom: '0' }}>
        <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
          <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <button
              onClick={() => goToView('add-person')}
              className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
              aria-label="Back to add friends"
            >
              <span className="action-btn-circle">
                <ChevronLeftIcon className="h-5 w-5 text-gray-900" strokeWidth={2.5} />
              </span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Friend Requests</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] p-4" style={{ boxShadow: '0 0 1px rgba(100,100,100,0.25), inset 0 0 2px rgba(27,27,27,0.25)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {request.sender?.profile_pic ? (
                          <img src={request.sender.profile_pic} alt={request.sender.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500 text-lg font-medium">{request.sender?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{request.sender?.name}</h4>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleReject(request.id)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <button onClick={() => handleAccept(request.id)} className="w-8 h-8 flex items-center justify-center bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
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
      </div>
    );
  };

  // Add Person Wrapper Component
  const AddPersonWrapper = ({ onBack, onOpenFriendRequests }: { onBack: () => void; onOpenFriendRequests: () => void }) => {
    console.log('🔍 AddPersonWrapper: Rendering, isConnectionsSearchOpen:', isConnectionsSearchOpen);
    console.log('🔍 AddPersonWrapper: connectionsSearchQuery:', connectionsSearchQuery);
    return (
      <>
        <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
          <MobilePage>
            <PageHeader
              title="Add"
              backButton
              backIcon="arrow"
              onBack={onBack}
              customActions={
                <div
                  className="flex items-center transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    width: '88px', // Double the normal button width (44px * 2)
                    height: '44px',
                    borderRadius: '100px',
                    background: 'rgba(255, 255, 255, 0.96)',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  {/* Search Icon - Left Side */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConnectionsSearchOpen(true);
                    }}
                    className="flex items-center justify-center flex-1 h-full"
                  >
                    <SearchIcon size={20} className="text-gray-900" style={{ strokeWidth: 2.5 }} />
                  </button>
                  {/* QR Code Icon - Right Side */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Placeholder for QR code functionality
                      console.log('QR code clicked');
                    }}
                    className="flex items-center justify-center flex-1 h-full"
                  >
                    <QrCode size={20} className="text-gray-900" strokeWidth={2.5} />
                  </button>
                </div>
              }
            />
            <div className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide" style={{
              paddingTop: 'var(--saved-content-padding-top, 140px)',
              paddingBottom: '32px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <AddPage 
                onBack={onBack} 
                onOpenFriendRequests={onOpenFriendRequests}
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
        <ConnectionsSearchModal
          isOpen={isConnectionsSearchOpen}
          onClose={() => setIsConnectionsSearchOpen(false)}
          searchQuery={connectionsSearchQuery}
          onSearchChange={setConnectionsSearchQuery}
        />
      </>
    );
  };

  return (
    <ProtectedRoute
      title={currentView === 'menu' ? "Menu" : currentView === 'add-person' ? "Find Friends" : currentView === 'friend-profile' ? "Profile" : currentView === 'profile' ? "Profile" : currentView === 'highlights' ? "Highlights" : currentView === 'timeline' ? "Timeline" : currentView === 'life' ? "Life" : currentView === 'achievements' ? "Achievements" : currentView === 'connections' ? "Connections" : currentView === 'settings' ? "Settings" : currentView === 'notifications' ? "Notifications" : currentView === 'memories' ? "Memories" : currentView === 'saved' ? "Saved" : currentView === 'share-profile' ? "Share Profile" : currentView === 'account-settings' ? "Account Settings" : "Menu"}
      description="Log in / sign up to access your account settings and preferences"
      buttonText="Log in"
    >
      {currentView === 'add-person' ? (
        <AddPersonWrapper 
          onBack={() => {
            // Check if we should return to new chat modal
            if (typeof window !== 'undefined') {
              const returnToNewChat = sessionStorage.getItem('returnToNewChat');
              if (returnToNewChat === 'true') {
                sessionStorage.removeItem('returnToNewChat');
                router.push('/chat?openNewChat=true');
                return;
              }
            }
            // Check for 'from' parameter in URL
            const from = searchParams?.get('from');
            if (from) {
              router.push(from);
              return;
            }
            goToView('connections');
          }}
          onOpenFriendRequests={() => setShowFriendRequestsModal(true)}
        />
      ) : showFriendRequestsModal ? (
        <FriendRequestsModal 
          isOpen={showFriendRequestsModal} 
          onClose={() => setShowFriendRequestsModal(false)} 
        />
      ) : currentView === 'friend-requests' ? (
        <FriendRequestsView />
      ) : currentView === 'friend-profile' && selectedFriend ? (
        <FriendProfileView friend={selectedFriend} />
      ) : currentView === 'friend-connections' && connectionsContextUser ? (
        <FriendConnectionsView friend={connectionsContextUser} />
      ) : currentView === 'profile' ? (
        <ProfileView />
      ) : currentView === 'edit-profile' ? (
        <EditProfileView />
      ) : currentView === 'highlights' ? (
        <HighlightsView />
      ) : currentView === 'timeline' ? (
        <TimelineView />
      ) : currentView === 'life' ? (
        <LifePage 
          profile={{
            id: account?.id || personalProfile?.id,
            name: currentAccount?.name,
            dateOfBirth: personalProfile?.dateOfBirth
          }}
          onBack={() => goToView('profile')}
        />
      ) : currentView === 'achievements' ? (
        <AchievementsView />
      ) : currentView === 'connections' ? (
        <ConnectionsView />
      ) : currentView === 'settings' ? (
        <SettingsView />
      ) : currentView === 'notifications' ? (
        <NotificationsView />
      ) : currentView === 'memories' ? (
        <MemoriesView />
      ) : currentView === 'saved' ? (
        <SavedView />
      ) : currentView === 'share-profile' ? (
        <ShareProfileView />
      ) : currentView === 'account-settings' ? (
        <AccountSettingsView />
      ) : currentView === 'menu' ? (
        <>
          {/* Mobile Layout with Design System */}
          <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
            <MobilePage>
              <PageHeader
                title="Menu"
                backButton={true}
                customBackButton={
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                      style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '100px',
                      background: 'rgba(255, 255, 255, 0.9)',
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow',
                      padding: '2px'
                      }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    aria-label="Switch account"
                    >
                    <div className="w-[36px] h-[36px] rounded-full overflow-hidden">
                        <Avatar 
                          src={currentAccount?.avatarUrl ?? undefined} 
                        name={currentAccount?.name ?? ""} 
                          size={36} 
                        />
                      </div>
                  </button>
                }
                customActions={
                  <MenuTopActions
                    onSettingsClick={() => goToView('settings', 'menu')}
                    onNotificationsClick={() => goToView('notifications', 'menu')}
                  />
                }
              />

              <div className="flex-1 overflow-y-auto scrollbar-hide" style={{
                paddingTop: 'var(--saved-content-padding-top, 140px)',
                paddingBottom: '56px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {/* Top Spacing */}
                <div style={{ height: '12px' }} />
                
                {/* Profile Card */}
                <div style={{ paddingLeft: '22px', paddingRight: '22px', marginBottom: '30px' }}>
                  <ProfileCard
                    name={currentAccount?.name ?? "Your Name"}
                    avatarUrl={currentAccount?.avatarUrl}
                    onClick={() => goToView('profile')}
                    onViewProfile={() => goToView('profile')}
                    onEditProfile={() => goToView('edit-profile', 'menu')}
                    onShareProfile={() => goToView('share-profile', 'menu')}
                    avatarSize={36}
                    slim={true}
                    customActionIcon={QrCode}
                    onCustomAction={() => goToView('share-profile', 'menu')}
                  />
                </div>

                {/* Menu Grid - 2x3 layout */}
                <div className="grid grid-cols-2" style={{ 
                  paddingLeft: '22px', 
                  paddingRight: '22px',
                  gap: '22px',
                  rowGap: '22px'
                }}>
                  {(context.type === "business" ? 
                // Business account menu items
                [
                  { title: "Bookings", icon: "📅", href: "/business/bookings" },
                  { title: "Financials", icon: "💰", href: "/business/financials" },
                  { title: "Connections", icon: "👬", view: "connections" },
                  { title: "Settings", icon: "⚙️", view: "settings" },
                ] :
                // Personal account menu items
                [
                  { title: "Memories", icon: "🖼️", view: "memories" },
                  { title: "Achievements", icon: "🏆", view: "achievements" },
                  { title: "Timeline", icon: "🧭", view: "timeline" },
                  { title: "Connections", icon: "👬", view: "connections" },
                ]
              ).map((item) => (
                        <button
                      key={item.title}
                      className="rounded-2xl bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 w-full hover:-translate-y-[1px] active:scale-[0.98]"
                      style={{
                        height: '120px',
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                        willChange: 'transform, box-shadow',
                        touchAction: 'manipulation',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else if (item.view) {
                          goToView(item.view as any, 'menu');
                        } else if (item.href) {
                          router.push(item.href);
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }}
                    >
                      <div className="flex flex-col items-start h-full p-4 gap-2">
                        <div className="text-4xl leading-none">
                          {item.icon}
                        </div>
                        <span className="text-base font-semibold text-neutral-900 text-left leading-tight">
                          {item.title}
                        </span>
                      </div>
                            </button>
                  ))}
                          </div>
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

          {/* Desktop/Web Layout (unchanged) */}
          <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-6 lg:pt-6">
              {/* Profile Card only (no bio dropdown) */}
              <div className="mb-6 lg:mb-8">
                <div className="max-w-lg mx-auto lg:max-w-xl">
                  <ProfileCard
                    name={currentAccount?.name ?? "Your Name"}
                    avatarUrl={currentAccount?.avatarUrl}
                    onClick={() => setCurrentView('profile')}
                    onViewProfile={() => goToView('profile')}
                    onEditProfile={() => goToView('edit-profile', 'menu')}
                    onShareProfile={() => goToView('share-profile', 'menu')}
                    avatarSize={36}
                  />
                </div>
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
              </div>

              <div className="space-y-6">
                {/* Menu Grid - Desktop layout */}
          <div className="mb-6">
                  <div className="grid grid-cols-6 gap-6">
              {(context.type === "business" ? 
                // Business account menu items
                [
                  { title: "Bookings", icon: "📅", href: "/business/bookings" },
                  { title: "Financials", icon: "💰", href: "/business/financials" },
                        { title: "Connections", icon: "👬", view: "connections" },
                  { title: "Settings", icon: "⚙️", view: "settings" },
                ] :
                // Personal account menu items
                [
                        { title: "Memories", icon: "🖼️", href: "/memories" },
                  { title: "Achievements", icon: "🏆", view: "achievements" },
                  { title: "Timeline", icon: "🧭", view: "timeline" },
                        { title: "Connections", icon: "👬", view: "connections" },
                ]
              ).map((item) => (
                <button
                  key={item.title}
                        className="rounded-2xl bg-white hover:bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 aspect-square hover:-translate-y-[1px]"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          willChange: 'transform, box-shadow'
                  }}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (item.view) {
                      goToView(item.view as any, 'menu');
                    } else if (item.href) {
                      router.push(item.href);
                    }
                  }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full p-4 gap-6">
                          <div className="text-5xl">
                      {item.icon}
                    </div>
                          <span className="text-sm font-medium text-neutral-900 text-center leading-tight">
                      {item.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
          </div>
        </div>
        </>
      ) : (
        // Fallback - should not happen, but show menu as default
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-6 lg:pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Switcher Sheet */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        name={currentAccount?.name ?? "User"}
        avatarUrl={currentAccount?.avatarUrl}
        onViewProfile={() => goToView('profile', 'menu')}
        onShareProfile={() => goToView('share-profile', 'menu')}
        onAddBusiness={() => router.push('/create-business')}
      />
      <HappeningNowBanner />
    </ProtectedRoute>
  );
}




