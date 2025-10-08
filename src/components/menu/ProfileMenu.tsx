"use client";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Trash2, Settings, Share2, Menu, Camera, Trophy, Calendar, Users, Bookmark, Plus, ChevronLeft, Bell, Save, X, MessageCircle, Share, MoreVertical, ChevronRight, ArrowLeft } from "lucide-react";
import { connectionsService, User as ConnectionUser, FriendRequest } from '@/lib/connectionsService';
import InlineProfileView from '@/components/InlineProfileView';
import ConnectionsModal from '@/components/chat/ConnectionsModal';
import SettingsModal from '@/components/chat/SettingsModal';
import AboutMeView from '@/components/AboutMeView';
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
    <div className={`w-[400px] h-[640px] rounded-xl border border-neutral-200 bg-white shadow-sm p-5 ${className}`} style={{ backgroundColor: 'white' }}>
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
    const loadConnections = async () => {
      if (!account?.id) {
        setLoading(false);
        return;
      }

      try {
        const { connections: userConnections, error } = await connectionsService.getConnections(account.id);
        if (!error) {
          // For now, all accounts are treated as personal accounts (friends)
          // TODO: Implement business accounts later
          const people = userConnections || [];
          const businesses: any[] = [];
          
          console.log('🔍 ConnectionsView: Separated connections:', {
            people: people.length,
            businesses: businesses.length,
            total: userConnections?.length || 0
          });
          
          setPeopleConnections(people);
          setBusinessConnections(businesses);
        } else {
          console.error('Error loading connections:', error);
        }
      } catch (error) {
        console.error('Error loading connections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
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
          className="absolute right-0 p-2 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Add person"
        >
          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {/* Person silhouette */}
            <circle cx="12" cy="8" r="4" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            {/* Plus sign in top right */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 5h2m0 0h2m-2 0v2m0-2V3" />
          </svg>
        </button>
      </div>

      {/* Large personal profile card (to match viewing another person's connections) */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
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
                      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 py-6 min-h-[70px] cursor-pointer hover:shadow-md hover:bg-white transition-all mx-auto max-w-md"
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
                      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 py-8 relative min-h-[70px]"
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
  const [activeTab, setActiveTab] = useState<'requests' | 'add-friends'>('add-friends');
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
            <span className="back-btn-circle">
              <ChevronLeft size={20} className="text-gray-700" />
            </span>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Find Friends</h2>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4">
          <div className="flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'requests'
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              Requests
            </button>
            <button
              onClick={() => setActiveTab('add-friends')}
              className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'add-friends'
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              Add Friends
            </button>
          </div>
        </div>
        
        {/* Add Person content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-2">
          <div className="space-y-4">
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {pendingRequests.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Friend Requests</h3>
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 py-8 relative min-h-[70px] mx-auto max-w-md">
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

            {activeTab === 'add-friends' && (
              <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for people by name..."
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
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

                    {/* Search Results */}
                    {searchQuery.trim() && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
                                {searchResults.length > 0 ? (
                          <div className="space-y-2">
                            {searchResults
                              .filter(user => userConnectionStatuses[user.id] !== 'connected')
                              .map((user) => (
                              <div key={user.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 py-8 relative min-h-[70px] mx-auto max-w-md">
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
                    <h3 className="text-lg font-semibold text-gray-900">Suggested Friends</h3>
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
                          <div key={user.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 py-8 relative min-h-[70px] mx-auto max-w-md">
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
  currentAccount: { name?: string; avatarUrl?: string; bio?: string } | null; 
}) {
  return (
    <SimpleCard>
      <div className="space-y-4">
        {/* Profile Card - Clickable */}
        <button
          onClick={onViewProfile}
          className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:shadow-md hover:bg-white rounded-lg transition-all border border-gray-200 bg-white shadow-sm"
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
          <button 
            onClick={onNotifications}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:shadow-sm hover:bg-white rounded-lg transition-all"
          >
            <Bell size={20} className="text-gray-600" />
            <span className="font-medium">Notifications</span>
          </button>

          <button 
            onClick={onConnections}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:shadow-sm hover:bg-white rounded-lg transition-all"
          >
            <Users size={20} className="text-gray-600" />
            <span className="font-medium">Connections</span>
          </button>

          <button 
            onClick={onGallery}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:shadow-sm hover:bg-white rounded-lg transition-all"
          >
            <Camera size={20} className="text-gray-600" />
            <span className="font-medium">Gallery</span>
          </button>

          <button 
            onClick={onAchievements}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:shadow-sm hover:bg-white rounded-lg transition-all"
          >
            <Trophy size={20} className="text-gray-600" />
            <span className="font-medium">Achievements</span>
          </button>

          <button 
            onClick={onSaved}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:shadow-sm hover:bg-white rounded-lg transition-all"
          >
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
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:shadow-sm hover:bg-white rounded-lg transition-all">
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
                className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:shadow-sm hover:bg-white rounded-lg transition-all"
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
  const { signOut, deleteAccount, updateProfile, uploadAvatar, supabase, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showDim, setShowDim] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  
  console.log('🔥 ProfileMenu rendering with connections view:', showConnections);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<ConnectionUser | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
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
  const [showCenteredGallery, setShowCenteredGallery] = useState(false);
  const [showCenteredAchievements, setShowCenteredAchievements] = useState(false);
  const [showCenteredSaved, setShowCenteredSaved] = useState(false);
  const [showCenteredSettings, setShowCenteredSettings] = useState(false);
  const [settingsFromProfile, setSettingsFromProfile] = useState(false);
  const [showCenteredAboutMe, setShowCenteredAboutMe] = useState(false);
  const [aboutMeFromProfile, setAboutMeFromProfile] = useState(false);
  const [showCenteredFriendProfile, setShowCenteredFriendProfile] = useState(false);
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
    setShowEditProfile(false);
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
    setShowCenteredProfile(false);
    setShowCenteredConnections(false);
    setShowCenteredAddPerson(false);
    setShowCenteredNotifications(false);
    setShowCenteredGallery(false);
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

  // Cleanup on unmount - ensure all modals are closed
  useEffect(() => {
    return () => {
      console.log('ProfileMenu: Component unmounting - cleaning up modal states');
      setShowCenteredConnections(false);
      setShowCenteredProfile(false);
      setShowCenteredAddPerson(false);
      setShowCenteredNotifications(false);
      setShowCenteredGallery(false);
      setShowCenteredAchievements(false);
      setShowCenteredSaved(false);
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
    setShowEditProfile(false);
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
    setShowCenteredProfile(false);
    setShowCenteredConnections(false);
    setShowCenteredAddPerson(false);
    setShowCenteredNotifications(false);
    setShowCenteredGallery(false);
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
    setShowConnections(false);
    setShowAddPerson(false);
    // Keep the menu open - don't set setOpen(false)
  };

  const handleViewProfile = () => {
    hideMenuNow();
    setShowCenteredProfile(true);
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
      console.log('handleSaveProfile: About to call updateProfile with:', {
        name: data.name,
        bio: data.bio,
        avatarUrl: avatarUrl,
        bioLength: data.bio?.length || 0
      });
      
      const { error } = await updateProfile({
        name: data.name,
        bio: data.bio,
        avatarUrl: avatarUrl
      });
      
      console.log('handleSaveProfile: updateProfile result:', { error: error?.message || 'SUCCESS' });
      
      if (error) {
        console.error('handleSaveProfile: Error updating profile in Supabase:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      console.log('handleSaveProfile: Profile updated successfully in Supabase');

      // Update local state
      console.log('handleSaveProfile: About to update local state with:', {
        id: updatedProfile.id,
        name: updatedProfile.name,
        bio: updatedProfile.bio,
        bioLength: updatedProfile.bio?.length || 0
      });
      
      // Coerce to PersonalProfile shape: ensure id and string avatarUrl
      setPersonalProfile({
        id: updatedProfile.id ?? (user?.id ?? ''),
        name: updatedProfile.name ?? '',
        bio: updatedProfile.bio ?? '',
        avatarUrl: updatedProfile.avatarUrl ?? null,
        email: personalProfile?.email ?? '',
        phone: personalProfile?.phone ?? '',
        dateOfBirth: personalProfile?.dateOfBirth ?? '',
        connectId: personalProfile?.connectId ?? '',
        createdAt: personalProfile?.createdAt ?? new Date().toISOString(),
        updatedAt: updatedProfile.updatedAt,
      });
      console.log('handleSaveProfile: Local state updated');
      
      // Verify local state was updated
      setTimeout(() => {
        const currentProfile = useAppStore.getState().personalProfile;
        console.log('handleSaveProfile: ✅ Local state verification:', {
          wasUpdated: !!currentProfile,
          currentBio: currentProfile?.bio,
          bioLength: currentProfile?.bio?.length || 0,
          bioMatches: currentProfile?.bio === updatedProfile.bio
        });
      }, 100);
      
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
                  setShowCenteredGallery(true);
                }}
                onAchievements={() => {
                  hideMenuNow();
                  setShowCenteredAchievements(true);
                }}
                onSaved={() => {
                  hideMenuNow();
                  setShowCenteredSaved(true);
                }}
                currentAccount={currentAccount}
              />
            )}
            </div>
        )}
        
        {/* Centered Profile Modal */}
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
            
            {/* Modal content */}
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              {/* Floating Action Buttons */}
              <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <button
                  onClick={() => setShowCenteredProfile(false)}
                  className="p-2 hover:bg-gray-100 transition-colors rounded-full pointer-events-auto"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={() => {
                    console.log('Settings button clicked in centered profile');
                    setShowCenteredProfile(false);
                    setSettingsFromProfile(true);
                    setShowCenteredSettings(true);
                  }}
                  className="p-2 hover:bg-gray-100 transition-colors rounded-full pointer-events-auto"
                  aria-label="Open settings"
                >
                  <Settings className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6" style={{ paddingTop: '80px' }}>
                {/* Profile Header */}
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-6">
                    <Avatar
                      src={personalProfile?.avatarUrl ?? undefined}
                      name={personalProfile?.name ?? "User"}
                      size={140}
                    />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">{personalProfile?.name ?? "Your Name"}</h3>
                  <p className="text-gray-600 text-lg">{personalProfile?.bio ?? "No bio available"}</p>
                </div>

                {/* About Me Card */}
                <button 
                  onClick={() => {
                    console.log('About Me button clicked in centered profile');
                    setShowCenteredProfile(false);
                    setAboutMeFromProfile(true);
                    setShowCenteredAboutMe(true);
                  }}
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm min-h-[80px] flex items-center justify-center hover:shadow-md hover:bg-white transition-all text-center cursor-pointer"
                  aria-label="Open about me"
                  style={{ pointerEvents: 'auto' }}
                >
                  <span className="text-black font-medium">About Me</span>
                </button>

                {/* Connections Card */}
                <button 
                  onClick={() => {
                    console.log('Connections button clicked in centered profile');
                    setShowCenteredProfile(false);
                    setConnectionsFromProfile(true);
                    setShowCenteredConnections(true);
                  }}
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm min-h-[80px] flex items-center justify-center hover:shadow-md hover:bg-white transition-all text-center cursor-pointer"
                  aria-label="Open connections"
                  style={{ pointerEvents: 'auto' }}
                >
                  <span className="text-black font-medium">Connections</span>
                </button>

                {/* Content Sections */}
                <div className="space-y-4">
                  <button className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl p-4 text-left font-medium hover:shadow-md hover:bg-white transition-all shadow-sm min-h-[80px] flex items-center justify-between">
                    <span>View Photos</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl p-4 text-left font-medium hover:shadow-md hover:bg-white transition-all shadow-sm min-h-[80px] flex items-center justify-between">
                    <span>View Achievements</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Centered Connections Modal */}
        {showCenteredConnections && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div 
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              }}
              onClick={() => setShowCenteredConnections(false)}
            />
            
            {/* Modal content */}
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              <div className="flex flex-col h-full">
                <ConnectionsView
                  onBack={() => {
                    setShowCenteredConnections(false);
                    if (connectionsFromProfile) {
                      setShowCenteredProfile(true);
                    }
                    setConnectionsFromProfile(false);
                  }}
                  onAddPerson={() => {
                    setShowCenteredConnections(false);
                    setShowCenteredAddPerson(true);
                  }}
                  onFriendClick={handleFriendClick}
                  fromProfile={connectionsFromProfile}
                />
              </div>
            </div>
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

            {/* Modal content */}
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              <div className="flex flex-col h-full">
                <AddPersonView
                  onBack={() => {
                    setShowCenteredAddPerson(false);
                    setShowCenteredConnections(true);
                  }}
                />
              </div>
            </div>
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

            {/* Modal content */}
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              {/* Header (no bottom border) */}
              <div className="flex items-center justify-between p-6">
                <button
                  onClick={() => setShowCenteredNotifications(false)}
                  className="p-2 hover:bg-gray-100 transition-colors rounded-full"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                <div className="w-9"></div> {/* Spacer for centering */}
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔔</div>
                  <p className="text-gray-500 text-lg">You don't have any notifications yet ;(</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Centered Gallery Modal */}
        {showCenteredGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              }}
              onClick={() => setShowCenteredGallery(false)}
            />

            {/* Modal content */}
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              {/* Header without border */}
              <div className="flex items-center justify-between p-6">
                <button
                  onClick={() => setShowCenteredGallery(false)}
                  className="p-2 hover:bg-gray-100 transition-colors rounded-full"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Gallery</h2>
                <div className="w-9"></div> {/* Spacer for centering */}
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">📸</div>
                  <p className="text-gray-500 text-lg">You don't have any photos yet ;(</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Centered Achievements Modal */}
        {showCenteredAchievements && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              }}
              onClick={() => setShowCenteredAchievements(false)}
            />

            {/* Modal content */}
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              {/* Header without border */}
              <div className="flex items-center justify-between p-6">
                <button
                  onClick={() => setShowCenteredAchievements(false)}
                  className="p-2 hover:bg-gray-100 transition-colors rounded-full"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
                <div className="w-9"></div> {/* Spacer for centering */}
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <p className="text-gray-500 text-lg">You don't have any achievements yet ;(</p>
                </div>
              </div>
            </div>
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
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              {/* Header without border */}
              <div className="flex items-center justify-between p-6">
                <button
                  onClick={() => setShowCenteredSaved(false)}
                  className="p-2 hover:bg-gray-100 transition-colors rounded-full"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Saved</h2>
                <div className="w-9"></div> {/* Spacer for centering */}
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔖</div>
                  <p className="text-gray-500 text-lg">You don't have any saved items yet ;(</p>
                </div>
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
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              {/* Header without border */}
              <div className="flex items-center justify-between p-6">
                <button
                  onClick={() => {
                    setShowCenteredSettings(false);
                    setShowDeleteConfirm(false);
                    setShowFinalConfirm(false);
                    if (settingsFromProfile) {
                      setShowCenteredProfile(true);
                    }
                    setSettingsFromProfile(false);
                  }}
                  className="p-2 hover:bg-gray-100 transition-colors rounded-full"
                >
                  {settingsFromProfile ? (
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                <div className="w-9"></div> {/* Spacer for centering */}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col p-6">
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
                            className="w-full px-6 py-4 text-base font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                          >
                            Delete Account
                          </button>
                          <button
                            onClick={backToMenu}
                            className="w-full py-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
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
                ) : (
                  <>
                    {/* Profile Card */}
                    <div className="bg-gray-100 rounded-2xl p-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          {personalProfile?.avatarUrl ? (
                            <img 
                              src={personalProfile.avatarUrl} 
                              alt={personalProfile.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-medium text-lg">
                              {personalProfile?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {personalProfile?.name || 'Your Name'}
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setShowCenteredSettings(false);
                            setShowCenteredAboutMe(true);
                            setAboutMeFromProfile(false);
                          }}
                          className="text-blue-600 underline text-sm font-medium hover:text-blue-700"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Settings content - empty space for future settings */}
                    <div className="flex-1">
                    </div>
                    
                    {/* Account actions at bottom */}
                    <div className="space-y-3 pt-6 border-t border-gray-200">
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
                  </>
                )}
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

            {/* Modal content */}
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              <div className="flex flex-col h-full">
                <InlineProfileView
                  userId={selectedFriend.id}
                  entryPoint="connections"
                  onBack={() => {
                    setShowCenteredFriendProfile(false);
                    setSelectedFriend(null);
                    setShowCenteredConnections(true);
                  }}
                  onStartChat={(chatId) => {
                    router.push(`/chat/individual?chat=${chatId}`);
                  }}
                  onSettingsClick={() => {
                    setShowSettingsModal(true);
                  }}
                  onOpenConnections={handleOpenConnections}
                />
              </div>
            </div>
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

        {/* Centered About Me Modal */}
        {showCenteredAboutMe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dimming overlay with smooth transition */}
            <div
              className="fixed inset-0 transition-opacity duration-300 ease-in-out"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              }}
              onClick={() => {
                setShowCenteredAboutMe(false);
                setAboutMeFromProfile(false);
              }}
            />

            {/* Modal content */}
            <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
              <div className="flex flex-col h-full">
                <AboutMeView
                  onBack={() => {
                    setShowCenteredAboutMe(false);
                    if (aboutMeFromProfile) {
                      setShowCenteredProfile(true);
                    }
                    setAboutMeFromProfile(false);
                  }}
                  isPersonalProfile={aboutMeFromProfile}
                />
              </div>
            </div>
          </div>
        )}

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

      </div>
    </>
  );
}