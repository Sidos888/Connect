"use client";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useModal } from "@/lib/modalContext";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Trash2, Settings, Share2, Camera, Trophy, Calendar, Users, Bookmark, Plus, ChevronLeft, Bell, Save, X, MessageCircle, Share, MoreVertical, ChevronRight, ArrowLeft, Pencil, User, Eye } from "lucide-react";
import ProfileCard from "@/components/profile/ProfileCard";
import { connectionsService, User as ConnectionUser, FriendRequest } from '@/lib/connectionsService';
import EditProfileLanding from '@/components/settings/EditProfileLanding';
import InlineProfileView from '@/components/InlineProfileView';
import ConnectionsModal from '@/components/chat/ConnectionsModal';
import SettingsModal from '@/components/chat/SettingsModal';
import AboutMeView from '@/components/AboutMeView';
import EditProfileModal from '@/components/chat/EditProfileModal';
import Avatar from "@/components/Avatar";
import ProfilePage from "@/components/profile/ProfilePage";
import CenteredConnections from "@/components/connections/CenteredConnections";
import CenteredAddPerson from "@/components/connections/CenteredAddPerson";
import CenteredNotifications from "@/components/notifications/CenteredNotifications";
import CenteredMemories from "@/components/memories/CenteredMemories";
import CenteredAchievements from "@/components/achievements/CenteredAchievements";
import CenteredShareProfile from "@/components/profile/CenteredShareProfile";
import CenteredTimeline from "@/components/timeline/CenteredTimeline";
import { PageHeader } from "@/components/layout/PageSystem";
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
                        <div 
                          className="absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden"
                          style={{
                            borderWidth: '0.5px',
                            borderStyle: 'solid',
                            borderColor: 'rgba(0, 0, 0, 0.08)'
                          }}
                        >
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
                                <div 
                                  className="absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden"
                                  style={{
                                    borderWidth: '0.5px',
                                    borderStyle: 'solid',
                                    borderColor: 'rgba(0, 0, 0, 0.08)'
                                  }}
                                >
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
                            <div 
                              className="absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden"
                              style={{
                                borderWidth: '0.5px',
                                borderStyle: 'solid',
                                borderColor: 'rgba(0, 0, 0, 0.08)'
                              }}
                            >
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
  currentAccount,
  onClose,
  router
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
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div 
      className="w-[280px] rounded-xl bg-white p-4" 
      style={{ 
        backgroundColor: 'white',
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
      }}
    >
      <div className="space-y-3">
        {/* Profile Section */}
        <div 
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white transition-all duration-200 cursor-pointer"
          style={{
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            willChange: 'transform, box-shadow'
          }}
          onClick={() => {
            onClose();
            router.push('/menu-blank');
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Avatar 
            src={currentAccount?.avatarUrl ?? undefined} 
            name={currentAccount?.name ?? "User"} 
            size={40} 
          />
          <span className="text-base font-semibold text-gray-900">{currentAccount?.name ?? "Your Name"}</span>
        </div>

        {/* Add Business */}
        <div 
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white transition-all duration-200 cursor-pointer"
          style={{
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            willChange: 'transform, box-shadow'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Plus size={20} className="text-gray-900" />
          <span className="text-base font-semibold text-gray-900">Add Business</span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-2"></div>

        {/* Settings */}
        <div 
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer"
          style={{
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            willChange: 'transform, box-shadow'
          }}
          onClick={onSettings}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Settings size={20} className="text-gray-900" />
          <span className="text-base font-semibold text-gray-900">Settings</span>
        </div>

        {/* Log out */}
        <div 
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer"
          style={{
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            willChange: 'transform, box-shadow'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <LogOut size={20} className="text-gray-900" />
          <span className="text-base font-semibold text-gray-900">Log out</span>
        </div>
      </div>
    </div>
  );
}

export default function ProfileMenu() {
  const { personalProfile, clearAll, setPersonalProfile } = useAppStore();
  const { signOut, deleteAccount, updateProfile, uploadAvatar, supabase, user } = useAuth();
  const modal = useModal(); // Use unified modal system
  const [open, setOpen] = useState(false);
  const [showDim, setShowDim] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<ConnectionUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
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
  // BUT: Don't interfere with standalone profile route (/profile?id=xxx)
  useEffect(() => {
    // Skip if navigating to standalone profile page (not a modal)
    if (pathname === '/profile' || pathname === '/profile/') {
      // Don't reset states for standalone profile route - it's a full page, not a modal
      return;
    }
    
    console.log('ProfileMenu: Pathname changed to', pathname, '- Resetting all modal states');
    setOpen(false);
    setShowMenu(false); // Immediately hide menu on navigation
    setShowConnections(false);
    setShowAddPerson(false);
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
    setShowCenteredConnectionsModal(false);
    setConnectionsModalUserId(null);
    // Don't call modal.hideModals() here - let the ModalProvider manage its own state
  }, [pathname, modal]);

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

  // Prevent background scroll when any modal is open (local modals only, central modals handled by provider)
  useEffect(() => {
    const isAnyLocalModalOpen =
      showCenteredConnectionsModal;

    if (isAnyLocalModalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showCenteredConnectionsModal]);

  // Cleanup on unmount - ensure all modals are closed
  useEffect(() => {
    return () => {
      console.log('ProfileMenu: Component unmounting - cleaning up modal states');
      setShowCenteredConnectionsModal(false);
      setConnectionsModalUserId(null);
      // Don't call modal.hideModals() on unmount - modals should persist across navigation
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
    setShowConnections(false);
    setShowAddPerson(false);
    setSelectedFriend(null);
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
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
    console.log('ProfileMenu: Starting sign out...');
    
    // CRITICAL: Navigate FIRST before any state changes
    // This prevents React from re-rendering and blocking navigation
    console.log('🧭 ProfileMenu: IMMEDIATELY navigating to /signing-out');
    if (typeof window !== 'undefined') {
      // Navigate FIRST - this must happen before any state changes
      window.location.replace('/signing-out');
      // Stop execution immediately - navigation will happen
      return;
    }
    
    // State changes (this won't execute if navigation happens)
    setOpen(false);
    setShowConnections(false);
    setShowAddPerson(false);
  };

  const handleFriendClick = (friend: ConnectionUser) => {
    setSelectedFriend(friend);
    setFriendProfileUserId(friend.id);
    setShowCenteredConnections(false);
    // TODO: Friend profile view needs to be implemented with unified modal system
    // setShowCenteredFriendProfile(true);
  };

  const handleOpenConnections = (userId: string) => {
    setConnectionsModalUserId(userId);
    // setShowCenteredFriendProfile(false);
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
    setShowConnections(false);
    setShowAddPerson(false);
  };

  const handleViewProfile = () => {
    hideMenuNow();
    setTimeout(() => modal.showProfile(), 0);
  };

  const handleEditProfile = () => {
    hideMenuNow();
    setTimeout(() => modal.showEditProfile('menu'), 0);
  };

  const handleEditProfileFromSettings = () => {
    modal.closeProfileModal('settings');
    modal.showEditProfile();
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
          className="flex items-center justify-center rounded-full bg-white transition-all duration-200 hover:-translate-y-[1px] focus:outline-none relative z-50 overflow-hidden"
          style={{
            width: '40px',
            height: '40px',
            borderWidth: '0.4px',
            borderColor: open ? '#D1D5DB' : '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: open 
              ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
              : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            willChange: 'transform, box-shadow'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
          onMouseLeave={(e) => {
            if (!open) {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            } else {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }
          }}
        >
          <Avatar 
            src={currentAccount?.avatarUrl ?? undefined} 
            name={currentAccount?.name ?? "User"} 
            size={40} 
          />
        </button>

        {/* Removed backdrop to match non-signed-in dropdown behavior (no page dimming) */}

        {/* Dropdown menu */}
      {showMenu && (
        <div ref={menuRef} role="menu" className="profile-menu-card absolute right-0 z-50 mt-2">
            {showConnections ? (
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
            ) : (
              <MenuView
                onSettings={() => {
                  hideMenuNow();
                  setTimeout(() => modal.showSettings(), 0);
                }}
                onShare={() => {
                  hideMenuNow();
                  setTimeout(() => modal.showShareProfile('menu'), 0);
                }}
                onViewProfile={handleViewProfile}
                onConnections={() => {
                  hideMenuNow();
                  setTimeout(() => modal.showConnections(), 0);
                }}
                onNotifications={() => {
                  hideMenuNow();
                  setTimeout(() => modal.showNotifications(), 0);
                }}
                onGallery={() => {
                  hideMenuNow();
                  setTimeout(() => modal.showMemories(), 0);
                }}
                onAchievements={() => {
                  hideMenuNow();
                  setTimeout(() => modal.showAchievements(), 0);
                }}
                onSaved={() => {
                  hideMenuNow();
                  setTimeout(() => modal.showSaved(), 0);
                }}
                onEditProfile={() => {
                  hideMenuNow();
                  setTimeout(() => modal.showEditProfile('menu'), 0);
                }}
                currentAccount={currentAccount}
                onClose={hideMenuNow}
                router={router}
              />
            )}
            </div>
        )}
      </div>
        
        {/* Centered Connections Modal (for friend profiles only - not part of unified system) */}
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
              // TODO: Friend profile view needs to be implemented with unified modal system
              // setShowCenteredFriendProfile(true);
            }}
            userId={connectionsModalUserId}
            onRemoveFriend={(removedUserId) => {
              // Handle friend removal if needed
            }}
          />
        )}

        {/* Settings Modal (local to ProfileMenu) */}
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
    </>
  );
}