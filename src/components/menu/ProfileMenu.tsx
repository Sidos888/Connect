"use client";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Trash2, Settings, Share2, Menu, Camera, Trophy, Calendar, Users, Bookmark, Plus, ChevronLeft, Bell, Save, X, MessageCircle, Share, MoreVertical, ChevronRight, ArrowLeft, Pencil, User, Eye } from "lucide-react";
import { connectionsService, User as ConnectionUser, FriendRequest } from '@/lib/connectionsService';
import EditProfileLanding from '@/components/settings/EditProfileLanding';
import InlineProfileView from '@/components/InlineProfileView';
import ConnectionsModal from '@/components/chat/ConnectionsModal';
import SettingsModal from '@/components/chat/SettingsModal';
import AboutMeView from '@/components/AboutMeView';
import EditProfileModal from '@/components/chat/EditProfileModal';
import Avatar from "@/components/Avatar";
import UnifiedProfileCard from "@/components/profile/UnifiedProfileCard";
import CenteredConnections from "@/components/connections/CenteredConnections";
import CenteredAddPerson from "@/components/connections/CenteredAddPerson";
import CenteredNotifications from "@/components/notifications/CenteredNotifications";
import CenteredMemories from "@/components/memories/CenteredMemories";
import CenteredAchievements from "@/components/achievements/CenteredAchievements";
import { PageHeader } from "@/components/layout/PageSystem";
import ShareProfileModal from "@/components/ShareProfileModal";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import ThreeDotLoading from "@/components/ThreeDotLoading";
import ThreeDotLoadingBounce from "@/components/ThreeDotLoadingBounce";
import ImagePicker from "@/components/ImagePicker";
import LoadingSpinner from "@/components/LoadingSpinner";
import SettingsContent from "@/components/settings/SettingsContent";
import CenteredAccountSettings from "@/components/settings/CenteredAccountSettings";
import Saved from "@/components/saved/Saved";

// Simple, clean card component that can be easily replicated
function SimpleCard({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div 
      className={`w-[400px] h-[640px] rounded-xl bg-white p-5 ${className}`} 
      style={{ 
        backgroundColor: 'white',
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
      }}
    >
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

// Connections view
function ConnectionsView({ 
  onBack,
  onAddPerson,
  onFriendClick,
  fromProfile = false
}: { 
  onBack: () => void;
  onAddPerson: () => void;
  onFriendClick: (friend: ConnectionUser) => void;
  fromProfile?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'friends' | 'following'>('friends');
  const [peopleConnections, setPeopleConnections] = useState<any[]>([]);
  const [businessConnections, setBusinessConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { account } = useAuth();
  const { personalProfile } = useAppStore();

  // Load real connections data
  useEffect(() => {
    let cancelled = false;
    const loadConnections = async () => {
      if (!account?.id) {
        // Soft-retry if account not yet available
        setLoading(true);
        setTimeout(() => { if (!cancelled) loadConnections(); }, 300);
        return;
      }

      try {
        const { connections: userConnections, error } = await connectionsService.getConnections(account.id);
        if (!error) {
          // For now, all accounts are treated as personal accounts (friends)
          // TODO: Implement business accounts later
          const people = userConnections || [];
          const businesses: any[] = [];
          
          // Connection logging removed for performance
          
          if (!cancelled) {
          setPeopleConnections(people);
          setBusinessConnections(businesses);
          }
        } else {
          console.error('Error loading connections:', error);
          // Gracefully degrade: show empty lists rather than surfacing runtime error
          setPeopleConnections([]);
          setBusinessConnections([]);
        }
      } catch (error) {
        console.error('Error loading connections:', error);
        setPeopleConnections([]);
        setBusinessConnections([]);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();

    const onFocus = () => { if (account?.id) loadConnections(); };
      const onVisible = () => { if (document.visibilityState === 'visible' && account?.id) loadConnections(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
        cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [account?.id]);

  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-0">
      {/* Header with close (X) and add person */}
      <div className="flex items-center justify-center relative w-full mb-6" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <button
          onClick={onBack}
          className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Close connections"
        >
          <span className="back-btn-circle">
            {fromProfile ? (
              <ArrowLeft size={20} className="text-gray-700" />
            ) : (
              <X size={20} className="text-gray-700" />
            )}
          </span>
        </button>
        <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Connections</h2>
        <button
          onClick={onAddPerson}
          className="absolute right-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Add person"
        >
          <span className="action-btn-circle">
            <Plus className="w-5 h-5 text-gray-900" />
          </span>
        </button>
      </div>

      {/* Large personal profile card (to match viewing another person's connections) */}
      <div 
        className="bg-white rounded-2xl p-6 mb-6"
        style={{
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
        }}
      >
        <div className="flex items-center gap-4">
          <Avatar
            src={personalProfile?.avatarUrl}
            name={personalProfile?.name}
            size={60}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{personalProfile?.name || 'You'}</h3>
            <p className="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
              {activeTab === 'friends' ? peopleConnections.length : businessConnections.length} {activeTab === 'friends' ? 'friends' : 'following'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
        <div className="mb-4">
          <div className="flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab('friends')}
              className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'friends'
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'following'
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              Following
            </button>
          </div>
        </div>
        
        {/* Connections content */}
      <div 
        className="flex-1 overflow-y-auto no-scrollbar px-2"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollPaddingTop: '0px'
          }}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            if (target.scrollTop < 0) {
              target.scrollTop = 0;
            }
          }}
        >
          <div className="space-y-3 pb-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Loading connections...</p>
              </div>
            ) : activeTab === 'friends' ? (
              peopleConnections.length > 0 ? (
                peopleConnections.map((connection) => {
                  // Get the friend (not the current user) from the connection
                  const friend = connection.user1?.id === account?.id ? connection.user2 : connection.user1;
                  if (!friend) return null;

                  return (
                    <div
                      key={connection.id}
                      className="bg-white rounded-2xl p-6 py-6 min-h-[70px] cursor-pointer hover:bg-white transition-all duration-200 mx-auto max-w-md"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                      }}
                      onClick={() => onFriendClick(friend)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                          {friend.profile_pic ? (
                            <img src={friend.profile_pic} alt={friend.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500 text-sm font-medium">
                              {friend.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 flex items-center justify-center min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{friend.name}</h3>
                        </div>
                        <div className="w-10" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-gray-500 text-sm">No friends yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start adding friends to see them here</p>
                </div>
              )
            ) : (
              businessConnections.length > 0 ? (
                businessConnections.map((connection) => {
                  // Get the business (not the current user) from the connection
                  const business = connection.user1?.id === account?.id ? connection.user2 : connection.user1;
                  if (!business) return null;

                  return (
                    <div
                      key={connection.id}
                      className="bg-white rounded-2xl p-6 py-8 relative min-h-[70px]"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                      }}
                    >
                      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {business.profile_pic ? (
                          <img src={business.profile_pic} alt={business.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500 text-sm font-medium">
                            {business.name?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="w-full text-center flex items-center justify-center h-full min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{business.name}</h3>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🏢</div>
                  <p className="text-gray-500 text-sm">No businesses followed yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start following businesses to see them here</p>
                </div>
              )
            )}
        </div>

      </div>
    </div>
  );
}


// Add Person view
function AddPersonView({ 
  onBack 
}: { 
  onBack: () => void; 
}) {
  const [showRequests, setShowRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ConnectionUser[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<ConnectionUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userConnectionStatuses, setUserConnectionStatuses] = useState<Record<string, 'none' | 'pending_sent' | 'pending_received' | 'connected'>>({});
  const { account } = useAuth();

  // Load initial data
  useEffect(() => {
    console.log('🔍 AddPersonView: Account state changed:', account ? { id: account.id, name: account.name } : null);
    if (account?.id) {
      console.log('🔍 AddPersonView: Loading suggested friends and pending requests for account:', account.id);
      loadSuggestedFriends();
      loadPendingRequests();
    } else {
      console.log('🔍 AddPersonView: No account ID available, skipping data loading');
    }
  }, [account?.id]);

  // Search users with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('🔍 AddPersonView: Search effect triggered with query:', searchQuery, 'account:', account?.id);
      if (searchQuery.trim() && account?.id) {
        console.log('🔍 AddPersonView: Calling searchUsers with query:', searchQuery);
        searchUsers();
      } else {
        console.log('🔍 AddPersonView: Clearing search results - no query or no account');
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, account?.id]);

  const loadSuggestedFriends = async () => {
    if (!account?.id) {
      console.log('loadSuggestedFriends: No account ID available');
      return;
    }
    
    console.log('loadSuggestedFriends: Loading suggested friends for account:', account.id);
    setLoading(true);
    const { users, error } = await connectionsService.getSuggestedFriends(account.id);
    if (!error) {
      console.log('loadSuggestedFriends: Got', users.length, 'suggested friends:', users.map(u => ({ id: u.id, name: u.name })));
      setSuggestedFriends(users);
      // Load connection statuses for suggested friends
      loadConnectionStatuses(users);
    } else {
      console.error('loadSuggestedFriends: Error loading suggested friends:', error);
    }
    setLoading(false);
  };

  const loadPendingRequests = async () => {
    if (!account?.id) return;
    
    const { requests, error } = await connectionsService.getPendingRequests(account.id);
    if (!error) {
      setPendingRequests(requests);
    }
  };

  const searchUsers = async () => {
    console.log('🔍 AddPersonView: searchUsers called with query:', searchQuery, 'account:', account?.id);
    if (!account?.id || !searchQuery.trim()) {
      console.log('🔍 AddPersonView: searchUsers early return - no account or no query');
      return;
    }
    
    console.log('🔍 AddPersonView: Calling connectionsService.searchUsers...');
    setSearchLoading(true);
    const { users, error } = await connectionsService.searchUsers(searchQuery, account.id);
    console.log('🔍 AddPersonView: searchUsers result:', { users: users?.length || 0, error });
    
    if (!error) {
      console.log('🔍 AddPersonView: Setting search results:', users.map(u => ({ id: u.id, name: u.name })));
      setSearchResults(users);
      // Load connection statuses for search results
      loadConnectionStatuses(users);
    } else {
      console.error('🔍 AddPersonView: Search error:', error);
    }
    setSearchLoading(false);
  };

  const sendFriendRequest = async (userId: string) => {
    console.log('Send friend request clicked for user:', userId);
    console.log('Current account:', account);
    
    if (!account?.id) {
      console.log('No account ID available - user not logged in');
      alert('Please log in to send friend requests');
      return;
    }
    
    console.log('Sending friend request from:', account.id, 'to:', userId);
    const { error } = await connectionsService.sendFriendRequest(account.id, userId);
    
    if (!error) {
      console.log('Friend request sent successfully');
      // Update connection status for this user
      setUserConnectionStatuses(prev => ({
        ...prev,
        [userId]: 'pending_sent'
      }));
      // Don't reload suggested friends immediately - just update the button status
      // This prevents the user from disappearing from the list
      console.log('Updated connection status for user', userId, 'to pending_sent');
    } else {
      console.error('Error sending friend request:', error);
      // Show more user-friendly error messages
      if (error.message.includes('already friends')) {
        alert('You are already friends with this person');
      } else if (error.message.includes('already sent')) {
        alert('Friend request already sent');
      } else {
        alert('Failed to send friend request: ' + error.message);
      }
    }
  };

  // Load connection status for users
  const loadConnectionStatuses = async (users: ConnectionUser[]) => {
    if (!account?.id) {
      console.log('loadConnectionStatuses: No account ID available');
      return;
    }
    
    console.log('loadConnectionStatuses: Loading statuses for', users.length, 'users');
    console.log('loadConnectionStatuses: Users:', users.map(u => ({ id: u.id, name: u.name })));
    
    const statusPromises = users.map(async (user) => {
      const { status } = await connectionsService.getConnectionStatus(account.id, user.id);
      console.log(`loadConnectionStatuses: User ${user.name} (${user.id}) status:`, status);
      return { userId: user.id, status };
    });
    
    const statuses = await Promise.all(statusPromises);
    const statusMap: Record<string, 'none' | 'pending_sent' | 'pending_received' | 'connected'> = {};
    statuses.forEach(({ userId, status }) => {
      statusMap[userId] = status;
    });
    
    console.log('loadConnectionStatuses: Final status map:', statusMap);
    setUserConnectionStatuses(prev => ({ ...prev, ...statusMap }));
  };

  // Cancel friend request
  const cancelFriendRequest = async (userId: string) => {
    console.log('🔄 ProfileMenu: Cancel friend request clicked for user:', userId);
    console.log('🔄 ProfileMenu: Current account:', account);
    
    if (!account?.id) {
      console.log('🔄 ProfileMenu: No account ID available');
      return;
    }
    
    console.log('🔄 ProfileMenu: Calling connectionsService.cancelFriendRequest...');
    const { error } = await connectionsService.cancelFriendRequest(account.id, userId);
    
    if (!error) {
      console.log('🔄 ProfileMenu: Friend request cancelled successfully');
      // Update connection status for this user back to none
      setUserConnectionStatuses(prev => ({
        ...prev,
        [userId]: 'none'
      }));
      console.log('🔄 ProfileMenu: Status updated to none for user:', userId);
    } else {
      console.error('🔄 ProfileMenu: Error cancelling friend request:', error);
      alert('Failed to cancel friend request: ' + error.message);
    }
  };

  // Get button text and styling based on connection status
  const getButtonConfig = (userId: string) => {
    const status = userConnectionStatuses[userId] || 'none';
    
    switch (status) {
      case 'connected':
        return { text: 'Friends', className: 'px-4 py-2 bg-white text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed border border-gray-200' };
      case 'pending_sent':
        return { 
          text: 'Added ✓', 
          className: 'px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5 border border-gray-200' 
        };
      case 'pending_received':
        return { text: 'Accept', className: 'px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200' };
      default:
        return { text: 'Add +', className: 'px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200' };
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    const { error } = await connectionsService.acceptFriendRequest(requestId);
    if (!error) {
      loadPendingRequests();
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    const { error } = await connectionsService.rejectFriendRequest(requestId);
    if (!error) {
      loadPendingRequests();
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header with back button */}
      <div className="flex items-center justify-center relative w-full mb-6" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <button
            onClick={onBack}
            className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Back to connections"
          >
            <span className="action-btn-circle">
              <ChevronLeft size={20} className="text-gray-900" />
            </span>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>{showRequests ? 'Friend Requests' : 'Find Friends'}</h2>
        </div>
        {/* Search is shown first in the content below; requests card is placed below it */}
        
        {/* Add Person content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-2">
          <div className="space-y-4">
            {showRequests && (
              <div className="space-y-4">
                {pendingRequests.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Friend Requests</h3>
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="bg-white rounded-2xl p-6 py-8 relative min-h-[70px] mx-auto max-w-md"
                        style={{
                          borderWidth: '0.4px',
                          borderColor: '#E5E7EB',
                          borderStyle: 'solid',
                          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                        }}>
                        <div className="absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                          {request.sender?.profile_pic ? (
                            <img src={request.sender.profile_pic} alt={request.sender.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500 text-sm font-medium">
                              {request.sender?.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="w-full text-center flex items-center justify-center h-full">
                          <h3 className="text-sm font-semibold text-gray-900">{request.sender?.name}</h3>
                        </div>
                        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex space-x-2">
                          <button 
                            onClick={() => rejectFriendRequest(request.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => acceptFriendRequest(request.id)}
                            className="w-8 h-8 flex items-center justify-center bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
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
            )}

            {!showRequests && (
              <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                       placeholder="Search..."
                       className="w-full px-4 py-3 pl-10 bg-white rounded-2xl focus:outline-none focus:ring-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                       style={{
                         borderWidth: '0.4px',
                         borderColor: '#E5E7EB',
                         borderStyle: 'solid',
                         boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                       }}
                      />
                     <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      {searchLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>

                    {/* Friend Requests summary card (below search, with proper gap) */}
                    {!searchQuery.trim() && !showRequests && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowRequests(true)}
                          className="w-full bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] p-5 text-left hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] transition-all"
                          style={{ boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27,27,27,0.25)' }}
                          aria-label="Open friend requests"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Friend Requests</h3>
                            <span className="text-sm font-medium text-gray-700">{pendingRequests.length}</span>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Search Results */}
                    {searchQuery.trim() && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
                                {searchResults.length > 0 ? (
                          <div className="space-y-2">
                            {searchResults
                              .filter(user => userConnectionStatuses[user.id] !== 'connected')
                              .map((user) => (
                              <div key={user.id} className="bg-white rounded-2xl p-6 py-8 relative min-h-[70px] mx-auto max-w-md"
                                style={{
                                  borderWidth: '0.4px',
                                  borderColor: '#E5E7EB',
                                  borderStyle: 'solid',
                                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                                }}>
                                <div className="absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                  {user.profile_pic ? (
                                    <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-500 text-sm font-medium">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="w-full text-center flex items-center justify-center h-full min-w-0">
                                  <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{user.name}</h3>
                                </div>
                                {(() => {
                                  const status = userConnectionStatuses[user.id] || 'none';
                                  if (status === 'connected') {
                                    return null; // Don't show button for friends
                                  }
                                  const buttonConfig = getButtonConfig(user.id);
                                  return (
                                    <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                                      <button 
                                        onClick={() => {
                                          if (buttonConfig.text === 'Add +') {
                                            sendFriendRequest(user.id);
                                          } else if (buttonConfig.text === 'Added ✓') {
                                            cancelFriendRequest(user.id);
                                          } else if (buttonConfig.text === 'Accept') {
                                            // Handle accept logic if needed
                                          }
                                        }}
                                        className={buttonConfig.className}
                                      >
                                        {buttonConfig.text}
                                      </button>
                                    </div>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        ) : !searchLoading ? (
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-sm">No users found</p>
                          </div>
                        ) : null}
                      </div>
                    )}

                {/* Suggested Friends Section */}
                {!searchQuery.trim() && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 text-center">Suggested Friends</h3>
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-500 text-sm mt-2">Loading suggestions...</p>
                      </div>
                    ) : suggestedFriends.length > 0 ? (
                      <div className="space-y-2">
                        {suggestedFriends
                          .filter(user => userConnectionStatuses[user.id] !== 'connected')
                          .slice(0, 5)
                          .map((user) => (
                          <div key={user.id} className="bg-white rounded-2xl p-6 py-8 relative min-h-[70px] mx-auto max-w-md"
                            style={{
                              borderWidth: '0.4px',
                              borderColor: '#E5E7EB',
                              borderStyle: 'solid',
                              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                            }}>
                            <div className="absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                              {user.profile_pic ? (
                                <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-gray-500 text-sm font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="w-full text-center flex items-center justify-center h-full min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{user.name}</h3>
                            </div>
                            {(() => {
                              const status = userConnectionStatuses[user.id] || 'none';
                              if (status === 'connected') {
                                return null; // Don't show button for friends
                              }
                              const buttonConfig = getButtonConfig(user.id);
                              return (
                                <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                                  <button 
                                    onClick={() => {
                                      if (buttonConfig.text === 'Add +') {
                                        sendFriendRequest(user.id);
                                      } else if (buttonConfig.text === 'Added ✓') {
                                        cancelFriendRequest(user.id);
                                      } else if (buttonConfig.text === 'Accept') {
                                        // Handle accept logic if needed
                                      }
                                    }}
                                    className={buttonConfig.className}
                                  >
                                    {buttonConfig.text}
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">No suggested friends at the moment</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
  onConnections,
  onNotifications,
  onGallery,
  onAchievements,
  onSaved,
  onEditProfile,
  currentAccount 
}: { 
  onSettings: () => void; 
  onShare: () => void; 
  onViewProfile: () => void;
  onConnections: () => void;
  onNotifications: () => void;
  onGallery: () => void;
  onAchievements: () => void;
  onSaved: () => void;
  onEditProfile: () => void;
  currentAccount: { name?: string; avatarUrl?: string; bio?: string } | null; 
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const clickedInsideMenu = !!(profileMenuRef.current && target && profileMenuRef.current.contains(target));
      const clickedButton = !!(profileMenuButtonRef.current && target && profileMenuButtonRef.current.contains(target));
      if (!clickedInsideMenu && !clickedButton) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isProfileMenuOpen]);

  return (
    <SimpleCard>
      <div className="space-y-4">
        {/* Profile Card - Clickable */}
        <div
          onClick={onViewProfile}
          className="w-full rounded-lg bg-white relative cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
          style={{
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            willChange: 'transform, box-shadow'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
        >
          <div className="flex items-center px-4 py-4 gap-3">
          <Avatar
            src={currentAccount?.avatarUrl ?? undefined}
            name={currentAccount?.name ?? "User"}
            size={48}
          />
            <div className="flex-1 text-center">
              <h3 className="text-base font-semibold text-gray-900">{currentAccount?.name ?? "Your Name"}</h3>
          </div>
            <div 
              className="relative"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileMenuOpen((v) => !v);
                }}
                ref={profileMenuButtonRef}
                className="flex items-center justify-center w-10 h-10"
                aria-label="Open profile menu"
                aria-expanded={isProfileMenuOpen}
              >
                <MoreVertical size={20} className="text-gray-900" />
        </button>
              {isProfileMenuOpen && (
                <div
                  ref={profileMenuRef}
                  role="menu"
                  aria-label="Profile actions"
                  className="absolute -right-5 top-12 z-20 w-56 rounded-2xl border border-neutral-200 bg-white shadow-xl p-1"
                >
                  <button
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileMenuOpen(false);
                      onViewProfile();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                  >
                    <Eye className="h-5 w-5 text-gray-700" />
                    View Profile
                  </button>
                  <div className="mx-2 my-1 h-px bg-neutral-200" />
                  <button
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileMenuOpen(false);
                      onEditProfile();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                  >
                    <Pencil className="h-5 w-5 text-gray-700" />
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-3">
          <button 
            onClick={onNotifications}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-900 rounded-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <Bell size={20} className="text-gray-900 transition-all duration-200" />
            <span className="font-medium transition-all duration-200">Notifications</span>
          </button>

          <button 
            onClick={onConnections}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-900 rounded-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <Users size={20} className="text-gray-900 transition-all duration-200" />
            <span className="font-medium transition-all duration-200">Connections</span>
          </button>

          <button 
            onClick={onGallery}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-900 rounded-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <Camera size={20} className="text-gray-900 transition-all duration-200" />
            <span className="font-medium transition-all duration-200">Memories</span>
          </button>

          <button 
            onClick={onAchievements}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-900 rounded-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <Trophy size={20} className="text-gray-900 transition-all duration-200" />
            <span className="font-medium transition-all duration-200">Achievements</span>
          </button>

          <button 
            onClick={onSaved}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-900 rounded-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <Bookmark size={20} className="text-gray-900 transition-all duration-200" />
            <span className="font-medium transition-all duration-200">Saved</span>
          </button>

          <button
            onClick={onSettings}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-900 rounded-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <Settings size={20} className="text-gray-900 transition-all duration-200" />
            <span className="font-medium transition-all duration-200">Settings</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Add business section */}
      <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-900 rounded-lg transition-all duration-200 hover:scale-[1.02]">
            <Plus size={20} className="text-gray-900 transition-all duration-200" />
            <span className="font-medium transition-all duration-200">Add business</span>
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
  onConnections,
  onSettings,
  currentAccount 
}: { 
  onBack: () => void; 
  onEditProfile: () => void;
  onShare: () => void;
  onConnections: () => void;
  onSettings: () => void;
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
            <span className="action-btn-circle">
              <ChevronLeft size={20} className="text-gray-900" />
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
              <button
                onClick={() => {
                  setShowCenteredProfile(false);
                  router.push('/share-profile');
                }}
                className="inline-block mb-3"
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  padding: '10px 16px'
                }}
                aria-label="Open links card"
              >
                <span className="text-3xl font-bold text-gray-900">{personalProfile?.name ?? 'Your Name'}</span>
              </button>
              {personalProfile?.bio && (
                <p className="text-gray-600 text-lg">{personalProfile?.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Profile actions */}
        <div className="space-y-1">
          <button
            onClick={onShare}
            className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-700 hover:shadow-sm hover:bg-white rounded-lg transition-all"
          >
            <Share2 size={20} className="text-gray-600" />
            <span className="font-medium">Share Profile</span>
          </button>
        </div>
      </div>
    </SimpleCard>
  );
}


// Simple settings view wrapper for dropdown
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
  personalProfile,
  onViewProfile,
  onEditProfile,
  onAccountSettings,
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
  onViewProfile?: () => void;
  onEditProfile?: () => void;
  onAccountSettings?: () => void;
}) {
  return (
    <SimpleCard>
      <SettingsContent
        onBack={onBack}
        onSignOut={onSignOut}
        onDeleteAccount={onDeleteAccount}
        showDeleteConfirm={showDeleteConfirm}
        showFinalConfirm={showFinalConfirm}
        onConfirmDelete={onConfirmDelete}
        onCancelDelete={onCancelDelete}
        onProceedToFinalConfirm={onProceedToFinalConfirm}
        onBackToMenu={onBackToMenu}
        isDeletingAccount={isDeletingAccount}
        personalProfile={personalProfile}
        showBackButton={true}
        onViewProfile={onViewProfile}
        onEditProfile={onEditProfile}
        onAccountSettings={onAccountSettings}
      />
    </SimpleCard>
  );
}

export default function ProfileMenu() {
  const { personalProfile, clearAll, setPersonalProfile } = useAppStore();
  const { signOut, deleteAccount, updateProfile, uploadAvatar, supabase, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showDim, setShowDim] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  
  // Removed debugging log for performance
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<ConnectionUser | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showCenteredProfile, setShowCenteredProfile] = useState(false);
  const [showCenteredConnections, setShowCenteredConnections] = useState(false);
  const [connectionsFromProfile, setConnectionsFromProfile] = useState(false);
  const [showCenteredAddPerson, setShowCenteredAddPerson] = useState(false);
  const [showCenteredNotifications, setShowCenteredNotifications] = useState(false);
  const [showCenteredMemories, setShowCenteredMemories] = useState(false);
  const [showCenteredHighlights, setShowCenteredHighlights] = useState(false);
  const [showCenteredAchievements, setShowCenteredAchievements] = useState(false);
  const [showCenteredSaved, setShowCenteredSaved] = useState(false);
  const [showCenteredSettings, setShowCenteredSettings] = useState(false);
  const [settingsFromProfile, setSettingsFromProfile] = useState(false);
  const [profileFromSettings, setProfileFromSettings] = useState(false);
  const [showCenteredAccountSettings, setShowCenteredAccountSettings] = useState(false);
  const [showCenteredAboutMe, setShowCenteredAboutMe] = useState(false);
  const [aboutMeFromProfile, setAboutMeFromProfile] = useState(false);
  const [showCenteredEditProfile, setShowCenteredEditProfile] = useState(false);
  const [showCenteredEditLanding, setShowCenteredEditLanding] = useState(false);
  const [editProfileFromProfile, setEditProfileFromProfile] = useState(false);
  const [showCenteredFriendProfile, setShowCenteredFriendProfile] = useState(false);
  const [friendProfileUserId, setFriendProfileUserId] = useState<string | null>(null);
  const [showCenteredConnectionsModal, setShowCenteredConnectionsModal] = useState(false);
  const [connectionsModalUserId, setConnectionsModalUserId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Get current account info for avatar with debugging
  const currentAccount = { 
    name: personalProfile?.name, 
    avatarUrl: personalProfile?.avatarUrl ?? undefined,
    bio: personalProfile?.bio
  };
  
  // Profile data updated
  useEffect(() => {
    // Profile data has been updated
  }, [personalProfile]);


  // Close menu when navigating - immediate hide
  useEffect(() => {
    console.log('ProfileMenu: Pathname changed to', pathname, '- Resetting all modal states');
    setOpen(false);
    setShowMenu(false); // Immediately hide menu on navigation
    setShowSettings(false);
    setShowConnections(false);
    setShowAddPerson(false);
    setShowProfile(false);
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
    setShowCenteredProfile(false);
    setShowCenteredConnections(false);
    setShowCenteredAddPerson(false);
    setShowCenteredNotifications(false);
    setShowCenteredAchievements(false);
    setShowCenteredSaved(false);
    setShowCenteredSettings(false);
    setShowCenteredFriendProfile(false);
    setShowCenteredConnectionsModal(false);
    setConnectionsModalUserId(null);
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

  // Prevent background scroll when any centered modal is open
  useEffect(() => {
    const isAnyCenteredOpen =
      showCenteredProfile ||
      showCenteredConnections ||
      showCenteredAddPerson ||
      showCenteredNotifications ||
      showCenteredMemories || showCenteredHighlights ||
      showCenteredAchievements ||
      showCenteredSaved ||
      showCenteredSettings ||
      showCenteredAccountSettings ||
      showCenteredFriendProfile ||
      showCenteredConnectionsModal ||
      showCenteredEditLanding ||
      showCenteredEditProfile ||
      showShareModal;

    if (isAnyCenteredOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [
    showCenteredProfile,
    showCenteredConnections,
    showCenteredAddPerson,
    showCenteredNotifications,
    showCenteredAchievements,
    showCenteredSaved,
    showCenteredAccountSettings,
    showCenteredSettings,
    showCenteredFriendProfile,
    showCenteredConnectionsModal,
    showCenteredEditLanding,
    showCenteredEditProfile,
    showShareModal
  ]);

  // Cleanup on unmount - ensure all modals are closed
  useEffect(() => {
    return () => {
      console.log('ProfileMenu: Component unmounting - cleaning up modal states');
      setShowCenteredConnections(false);
      setShowCenteredProfile(false);
      setShowCenteredAddPerson(false);
      setShowCenteredNotifications(false);
      setShowCenteredAchievements(false);
      setShowCenteredSettings(false);
      setShowCenteredFriendProfile(false);
      setShowCenteredConnectionsModal(false);
      setConnectionsModalUserId(null);
    };
  }, []);

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
    setShowConnections(false);
    setShowAddPerson(false);
    setSelectedFriend(null);
    setShowProfile(false);
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
    setShowCenteredProfile(false);
    setShowCenteredConnections(false);
    setShowCenteredAddPerson(false);
    setShowCenteredNotifications(false);
    setShowCenteredAchievements(false);
    setShowCenteredSaved(false);
    setShowCenteredSettings(false);
    setShowCenteredFriendProfile(false);
    setShowCenteredConnectionsModal(false);
    setConnectionsModalUserId(null);
  };

  // Helper: hide only the dropdown immediately (used when opening center modals)
  const hideMenuNow = () => {
    setOpen(false);
    setShowMenu(false);
    if (menuRef.current) {
      menuRef.current.style.display = 'none';
    }
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
    setShowConnections(false);
    setShowAddPerson(false);
    setShowProfile(false);
    
    try {
      console.log('ProfileMenu: Starting sign out...');
      
      // Clear all local state immediately
      clearAll();
      
      // Clear all storage immediately
      localStorage.clear();
      sessionStorage.clear();
      
      // Try Supabase signout but don't wait for it (non-blocking)
      supabase.auth.signOut().catch((err: any) => {
        console.log('Supabase signout error (ignoring):', err);
      });
      
      // Also try local scope signout
      if (supabase.auth) {
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      }
      
      // Immediate redirect - don't wait for anything
      console.log('ProfileMenu: Redirecting to home page immediately');
      window.location.href = '/';
      
    } catch (error) {
      console.error('ProfileMenu: Sign out error:', error);
      // Force clear everything and redirect
      clearAll();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const handleFriendClick = (friend: ConnectionUser) => {
    setSelectedFriend(friend);
    setFriendProfileUserId(friend.id);
    setShowCenteredConnections(false);
    setShowCenteredFriendProfile(true);
  };

  const handleOpenConnections = (userId: string) => {
    setConnectionsModalUserId(userId);
    setShowCenteredFriendProfile(false);
    setShowCenteredConnectionsModal(true);
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
      // CRITICAL FIX: Use the authenticated user's ID, not the potentially fallback profile ID
      const authenticatedUserId = user?.id;
      const profileId = personalProfile?.id;
      
      console.log('🚯 DELETE: Account ID analysis:', {
        authenticatedUserId,
        profileId,
        willUse: authenticatedUserId || profileId,
        mismatch: authenticatedUserId !== profileId
      });
      
      // Prioritize the authenticated user's ID over profile ID
      const accountId = authenticatedUserId || profileId;
      
      if (accountId && supabase) {
        console.log('🚯 DATABASE: Starting database cleanup for:', accountId);
        
        try {
          // UNIFIED IDENTITY: Delete accounts record directly (no account_identities table)
          console.log('🚯 DATABASE: Deleting account from accounts table...');
          
          // Delete accounts record
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
    setShowConnections(false);
    setShowAddPerson(false);
    // Keep the menu open - don't set setOpen(false)
  };

  const handleViewProfile = () => {
    hideMenuNow();
    setShowCenteredProfile(true);
  };

  const handleEditProfile = () => {
    hideMenuNow();
    setShowCenteredProfile(false);
    setEditProfileFromProfile(true);
    setShowCenteredEditLanding(true);
  };

  const handleEditProfileFromSettings = () => {
    setShowCenteredSettings(false);
    setEditProfileFromProfile(false);
    setShowCenteredEditLanding(true);
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
          className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 transition-all duration-200 hover:bg-white active:bg-white focus:outline-none relative z-50"
          style={{
            borderWidth: '0.4px',
            borderColor: open ? '#D1D5DB' : '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: open 
              ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
              : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
          }}
        >
          <Menu size={16} className="text-gray-700" />
          <Avatar 
            src={currentAccount?.avatarUrl ?? undefined} 
            name={currentAccount?.name ?? "User"} 
            size={24} 
          />
        </button>

        {/* Removed backdrop to match non-signed-in dropdown behavior (no page dimming) */}

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
                onViewProfile={handleViewProfile}
                onEditProfile={handleEditProfile}
                onAccountSettings={() => {
                  setShowSettings(false);
                  setShowCenteredAccountSettings(true);
                }}
              />
            ) : showConnections ? (
              <ConnectionsView
                onBack={() => setShowConnections(false)}
                onAddPerson={() => {
                  setShowConnections(false);
                  setShowAddPerson(true);
                }}
                onFriendClick={handleFriendClick}
              />
            ) : showAddPerson ? (
              <AddPersonView
                onBack={() => {
                  setShowAddPerson(false);
                  setShowConnections(true);
                }}
              />
            ) : showProfile ? (
              <ProfileView
                onBack={() => setShowProfile(false)}
                onEditProfile={handleEditProfile}
                onShare={() => {
                  setOpen(false);
                  setShowShareModal(true);
                }}
                onConnections={() => {
                  console.log('ProfileView: Opening connections');
                  setShowProfile(false);
                  setShowConnections(true);
                }}
                onSettings={() => {
                  console.log('ProfileView: Opening settings');
                  setShowProfile(false);
                  setShowSettings(true);
                }}
                currentAccount={currentAccount}
              />
            ) : (
              <MenuView
                onSettings={() => {
                  hideMenuNow();
                  setShowCenteredSettings(true);
                }}
                onShare={() => {
                  hideMenuNow();
                  setShowShareModal(true);
                }}
                onViewProfile={handleViewProfile}
                onConnections={() => {
                  hideMenuNow();
                  setShowCenteredConnections(true);
                }}
                onNotifications={() => {
                  hideMenuNow();
                  setShowCenteredNotifications(true);
                }}
                onGallery={() => {
                  hideMenuNow();
                  setShowCenteredMemories(true);
                }}
                onAchievements={() => {
                  hideMenuNow();
                  setShowCenteredAchievements(true);
                }}
                onSaved={() => {
                  hideMenuNow();
                  setShowCenteredSaved(true);
                }}
                onEditProfile={() => {
                  hideMenuNow();
                  setShowCenteredEditLanding(true);
                }}
                currentAccount={currentAccount}
              />
            )}
            </div>
        )}
        
        {/* Centered Profile Modal - Using mobile design with grid */}
        {showCenteredProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div 
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              }}
              onClick={() => setShowCenteredProfile(false)}
            />
            
            {/* Modal content using shared card */}
            <UnifiedProfileCard
              profile={{ id: personalProfile?.id, name: personalProfile?.name, avatarUrl: personalProfile?.avatarUrl, bio: personalProfile?.bio }}
              isOwnProfile={true}
              showBackButton={profileFromSettings}
              onClose={() => {
                setShowCenteredProfile(false);
                if (profileFromSettings) {
                  setShowCenteredSettings(true);
                  setProfileFromSettings(false);
                }
              }}
              onEdit={handleEditProfile}
              onSettings={() => { setShowCenteredProfile(false); setSettingsFromProfile(true); setShowCenteredSettings(true); }}
              onShare={() => router.push('/share-profile')}
              onOpenTimeline={() => { setShowCenteredProfile(false); router.push('/timeline'); }}
              onOpenHighlights={() => { setShowCenteredProfile(false); setShowCenteredHighlights(true); }}
              onOpenBadges={() => { setShowCenteredProfile(false); setShowCenteredAchievements(true); }}
              onOpenConnections={() => { setShowCenteredProfile(false); setConnectionsFromProfile(true); setShowCenteredConnections(true); }}
            />
          </div>
        )}

        {/* Centered Edit Profile Landing Modal */}
        {showCenteredEditLanding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
              onClick={() => setShowCenteredEditLanding(false)}
            />
            <EditProfileLanding
              name={personalProfile?.name ?? 'Your Name'}
              avatarUrl={personalProfile?.avatarUrl ?? undefined}
              onBack={() => {
                setShowCenteredEditLanding(false);
                if (editProfileFromProfile) {
                  setShowCenteredProfile(true);
                  setEditProfileFromProfile(false);
                } else {
                  setShowCenteredSettings(true);
                }
              }}
              onOpenLinks={() => { setShowCenteredEditLanding(false); router.push('/settings/edit/links'); }}
              onOpenPersonalDetails={() => { setShowCenteredEditLanding(false); setEditProfileFromProfile(true); setShowCenteredEditProfile(true); }}
              onOpenTimeline={() => { setShowCenteredEditLanding(false); router.push('/timeline'); }}
              onOpenHighlights={() => { setShowCenteredEditLanding(false); router.push('/settings/edit/highlights'); }}
            />
          </div>
        )}

        {/* Centered Connections Modal */}
        {showCenteredConnections && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
              onClick={() => setShowCenteredConnections(false)}
            />
            <CenteredConnections
              onBack={() => {
                setShowCenteredConnections(false);
                if (connectionsFromProfile) setShowCenteredProfile(true);
                setConnectionsFromProfile(false);
              }}
              onAddPerson={() => { setShowCenteredConnections(false); setShowCenteredAddPerson(true); }}
              onFriendClick={handleFriendClick}
              fromProfile={connectionsFromProfile}
              showAddPersonButton={true}
            />
          </div>
        )}

        {/* Centered Add Person Modal */}
        {showCenteredAddPerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              }}
              onClick={() => setShowCenteredAddPerson(false)}
            />

            <CenteredAddPerson
                  onBack={() => {
                    setShowCenteredAddPerson(false);
                    setShowCenteredConnections(true);
                  }}
              onOpenRequests={() => {
                // TODO: wire Friend Requests centered modal if needed
              }}
                />
          </div>
        )}

        {/* Centered Notifications Modal */}
        {showCenteredNotifications && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              }}
              onClick={() => setShowCenteredNotifications(false)}
            />

            <CenteredNotifications onBack={() => setShowCenteredNotifications(false)} />
          </div>
        )}

        {/* Centered Memories Modal */}
        {showCenteredMemories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
              onClick={() => setShowCenteredMemories(false)}
            />
            <CenteredMemories onBack={() => setShowCenteredMemories(false)} />
          </div>
        )}

        {/* Centered Highlights Modal */}
        {showCenteredHighlights && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
              onClick={() => setShowCenteredHighlights(false)}
            />
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              <div className="flex items-center justify-between p-6">
                <button onClick={() => setShowCenteredHighlights(false)} className="p-2 hover:bg-gray-100 transition-colors rounded-full">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Highlights</h2>
                <div className="w-9"></div>
              </div>
              <div className="flex-1" />
            </div>
          </div>
        )}

        {/* Centered Achievements Modal */}
        {showCenteredAchievements && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
              onClick={() => setShowCenteredAchievements(false)}
            />
            <CenteredAchievements onBack={() => setShowCenteredAchievements(false)} />
          </div>
        )}

        {/* Centered Saved Modal */}
        {showCenteredSaved && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              }}
              onClick={() => setShowCenteredSaved(false)}
            />

            {/* Modal content */}
            <div 
              className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative"
              style={{ '--saved-content-padding-top': '104px' } as React.CSSProperties}
            >
              <PageHeader
                title="Saved"
                backButton
                backIcon="close"
                onBack={() => setShowCenteredSaved(false)}
                actions={[
                  {
                    icon: <Plus size={20} className="text-gray-900" />,
                    onClick: () => console.log('Add clicked'),
                    label: "Add"
                  },
                  {
                    icon: <Share size={20} className="text-gray-900" />,
                    onClick: () => console.log('Share clicked'),
                    label: "Share"
                  }
                ]}
              />

              <Saved />
              
              {/* Bottom Blur */}
              <div className="absolute bottom-0 left-0 right-0 z-20" style={{ 
                pointerEvents: 'none'
              }}>
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

        {/* Centered Settings Modal */}
        {showCenteredSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              }}
              onClick={() => {
                setShowCenteredSettings(false);
                setShowDeleteConfirm(false);
                setShowFinalConfirm(false);
              }}
            />

            {/* Modal content */}
            <div 
              className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative"
              style={{ '--saved-content-padding-top': '104px' } as React.CSSProperties}
            >
              <PageHeader
                title="Settings"
                backButton
                backIcon="close"
                onBack={() => {
                  setShowCenteredSettings(false);
                  setShowDeleteConfirm(false);
                  setShowFinalConfirm(false);
                  if (settingsFromProfile) {
                    setShowCenteredProfile(true);
                  }
                  setSettingsFromProfile(false);
                }}
              />
              
              <div className="flex-1 overflow-y-auto scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                <SettingsContent
                  onBack={() => {
                    setShowCenteredSettings(false);
                    setShowDeleteConfirm(false);
                    setShowFinalConfirm(false);
                    if (settingsFromProfile) {
                      setShowCenteredProfile(true);
                    }
                    setSettingsFromProfile(false);
                  }}
                  onSignOut={handleSignOut}
                  onDeleteAccount={handleDeleteAccount}
                  showDeleteConfirm={showDeleteConfirm}
                  showFinalConfirm={showFinalConfirm}
                  onConfirmDelete={confirmDeleteAccount}
                  onCancelDelete={cancelDeleteAccount}
                  onProceedToFinalConfirm={proceedToFinalConfirm}
                  onBackToMenu={backToMenu}
                  isDeletingAccount={isDeletingAccount}
                  personalProfile={personalProfile}
                  showBackButton={false}
                  onViewProfile={() => {
                    setShowCenteredSettings(false);
                    setProfileFromSettings(true);
                    setShowCenteredProfile(true);
                  }}
                  onEditProfile={handleEditProfileFromSettings}
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

        {/* Centered Friend Profile Modal */}
        {showCenteredFriendProfile && selectedFriend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              }}
              onClick={() => {
                setShowCenteredFriendProfile(false);
                setSelectedFriend(null);
              }}
            />

            <UnifiedProfileCard
              profile={{ id: selectedFriend.id, name: selectedFriend.name, avatarUrl: selectedFriend.profile_pic, bio: selectedFriend.bio }}
              isOwnProfile={false}
              showBackButton={true}
              onClose={() => {
                    setShowCenteredFriendProfile(false);
                    setSelectedFriend(null);
                    setShowCenteredConnections(true);
                  }}
              onThreeDotsMenu={() => {
                // Inactive for now
              }}
              onOpenConnections={() => {
                    setShowCenteredFriendProfile(false);
                setConnectionsModalUserId(selectedFriend.id);
                setShowCenteredConnectionsModal(true);
                  }}
                />
          </div>
        )}

        {/* Centered Connections Modal */}
        {showCenteredConnectionsModal && connectionsModalUserId && (
          <ConnectionsModal
            isOpen={true}
            onClose={() => {
              setShowCenteredConnectionsModal(false);
              setConnectionsModalUserId(null);
            }}
            onBack={() => {
              setShowCenteredConnectionsModal(false);
              setConnectionsModalUserId(null);
              setShowCenteredFriendProfile(true);
            }}
            userId={connectionsModalUserId}
            onRemoveFriend={(removedUserId) => {
              // Handle friend removal if needed
            }}
          />
        )}

        {/* Centered About Me modal removed in favor of Timeline route */}

        {/* Share Profile Modal */}
        <ShareProfileModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />

        {/* Settings Modal */}
        {selectedFriend && (
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => {
              setShowSettingsModal(false);
            }}
            onBack={() => {
              setShowSettingsModal(false);
            }}
            userId={selectedFriend.id}
          />
        )}

        {/* Centered Edit Profile Modal */}
        {showCenteredEditProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              }}
              onClick={() => {
                setShowCenteredEditProfile(false);
                setEditProfileFromProfile(false);
              }}
            />

            {/* Modal content */}
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              <div className="flex flex-col h-full">
                <EditProfileModal
                  onBack={() => {
                    setShowCenteredEditProfile(false);
                    if (editProfileFromProfile) {
                      setShowCenteredProfile(true);
                    } else {
                      setShowCenteredSettings(true);
                    }
                    setEditProfileFromProfile(false);
                  }}
                  onSave={() => {
                    // Profile has been updated, no additional action needed
                    console.log('Profile updated successfully');
                  }}
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Centered Account Settings Modal */}
      {showCenteredAccountSettings && (
        <CenteredAccountSettings
          onClose={() => {
            setShowCenteredAccountSettings(false);
            setShowCenteredSettings(true);
          }}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </>
  );
}