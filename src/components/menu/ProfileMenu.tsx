"use client";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Trash2, Settings, Share2, Menu, Camera, Trophy, Calendar, Users, Bookmark, Plus, ChevronLeft, Bell, Save, X } from "lucide-react";
import { connectionsService, User as ConnectionUser, FriendRequest } from '@/lib/connectionsService';
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
    <div className={`w-[400px] h-[640px] rounded-xl border border-neutral-200 bg-white shadow-sm p-5 ${className}`}>
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
  onAddPerson
}: { 
  onBack: () => void;
  onAddPerson: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'friends' | 'following'>('friends');

  // Sample data for demonstration
  const friends = [
    { id: 1, name: 'Amelia Jones', avatar: '👩‍💼' },
    { id: 2, name: 'Duy Do', avatar: '👨‍💻' },
    { id: 3, name: 'Ellie Mcdonald', avatar: '👩‍🎨' },
    { id: 4, name: 'Megan Markle', avatar: '👩‍🦱' },
    { id: 5, name: 'Lebron James', avatar: '🏀' },
    { id: 6, name: 'Brittney Smith', avatar: '👩‍⚕️' },
  ];

  const following = [
    { id: 7, name: 'John Doe', avatar: '👨‍🚀' },
    { id: 8, name: 'Jane Smith', avatar: '👩‍🔬' },
  ];

  return (
    <SimpleCard>
      <div className="flex flex-col h-full">
        {/* Header with back button and add person */}
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
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {(activeTab === 'friends' ? friends : following).map((person) => (
              <div
                key={person.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                  {person.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{person.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </SimpleCard>
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
    if (account?.id) {
      loadSuggestedFriends();
      loadPendingRequests();
    }
  }, [account?.id]);

  // Search users with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() && account?.id) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, account?.id]);

  const loadSuggestedFriends = async () => {
    if (!account?.id) return;
    
    setLoading(true);
    const { users, error } = await connectionsService.getSuggestedFriends(account.id);
    if (!error) {
      setSuggestedFriends(users);
      // Load connection statuses for suggested friends
      loadConnectionStatuses(users);
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
    if (!account?.id || !searchQuery.trim()) return;
    
    setSearchLoading(true);
    const { users, error } = await connectionsService.searchUsers(searchQuery, account.id);
    if (!error) {
      setSearchResults(users);
      // Load connection statuses for search results
      loadConnectionStatuses(users);
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
      // Refresh suggested friends and search results
      loadSuggestedFriends();
      if (searchQuery.trim()) {
        searchUsers();
      }
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
    if (!account?.id) return;
    
    const statusPromises = users.map(async (user) => {
      const { status } = await connectionsService.getConnectionStatus(account.id, user.id);
      return { userId: user.id, status };
    });
    
    const statuses = await Promise.all(statusPromises);
    const statusMap: Record<string, 'none' | 'pending_sent' | 'pending_received' | 'connected'> = {};
    statuses.forEach(({ userId, status }) => {
      statusMap[userId] = status;
    });
    
    setUserConnectionStatuses(prev => ({ ...prev, ...statusMap }));
  };

  // Get button text and styling based on connection status
  const getButtonConfig = (userId: string) => {
    const status = userConnectionStatuses[userId] || 'none';
    
    switch (status) {
      case 'connected':
        return { text: 'Friends', className: 'px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium cursor-not-allowed' };
      case 'pending_sent':
        return { text: 'Pending', className: 'px-4 py-2 bg-gray-400 text-white rounded-lg text-sm font-medium cursor-not-allowed' };
      case 'pending_received':
        return { text: 'Accept', className: 'px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors' };
      default:
        return { text: 'Add', className: 'px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors' };
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
    <SimpleCard>
      <div className="flex flex-col h-full">
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
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {pendingRequests.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Friend Requests</h3>
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                              {request.sender?.profile_pic ? (
                                <img src={request.sender.profile_pic} alt={request.sender.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-gray-500 text-lg font-medium">
                                  {request.sender?.name?.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{request.sender?.name}</h4>
                                  <p className="text-xs text-gray-400">
                                    {new Date(request.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => rejectFriendRequest(request.id)}
                              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                            >
                              Decline
                            </button>
                            <button 
                              onClick={() => acceptFriendRequest(request.id)}
                              className="px-3 py-1 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
                            >
                              Accept
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
                            {searchResults.map((user) => (
                              <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                    {user.profile_pic ? (
                                      <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-gray-500 text-sm font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                                  </div>
                                </div>
                                {(() => {
                                  const buttonConfig = getButtonConfig(user.id);
                                  return (
                                    <button 
                                      onClick={() => {
                                        if (buttonConfig.text === 'Add') {
                                          sendFriendRequest(user.id);
                                        } else if (buttonConfig.text === 'Accept') {
                                          // Handle accept logic if needed
                                        }
                                      }}
                                      className={buttonConfig.className}
                                      disabled={buttonConfig.text === 'Friends' || buttonConfig.text === 'Pending'}
                                    >
                                      {buttonConfig.text}
                                    </button>
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
                        {suggestedFriends.slice(0, 5).map((user) => (
                          <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                {user.profile_pic ? (
                                  <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-gray-500 text-sm font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{user.name}</h4>
                              </div>
                            </div>
                            {(() => {
                              const buttonConfig = getButtonConfig(user.id);
                              return (
                                <button 
                                  onClick={() => {
                                    if (buttonConfig.text === 'Add') {
                                      sendFriendRequest(user.id);
                                    } else if (buttonConfig.text === 'Accept') {
                                      // Handle accept logic if needed
                                    }
                                  }}
                                  className={buttonConfig.className}
                                  disabled={buttonConfig.text === 'Friends' || buttonConfig.text === 'Pending'}
                                >
                                  {buttonConfig.text}
                                </button>
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
    </SimpleCard>
  );
}

// Simple menu view
function MenuView({ 
  onSettings, 
  onShare, 
  onViewProfile,
  onConnections,
  currentAccount 
}: { 
  onSettings: () => void; 
  onShare: () => void; 
  onViewProfile: () => void;
  onConnections: () => void;
  currentAccount: { name?: string; avatarUrl?: string; bio?: string } | null; 
}) {
  return (
    <SimpleCard>
      <div className="space-y-4">
        {/* Profile Card - Clickable */}
        <button
          onClick={onViewProfile}
          className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm"
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
          <button className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="font-medium">Notifications</span>
          </button>

          <button 
            onClick={onConnections}
            className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Users size={20} className="text-gray-600" />
            <span className="font-medium">Connections</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Camera size={20} className="text-gray-600" />
            <span className="font-medium">Gallery</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Trophy size={20} className="text-gray-600" />
            <span className="font-medium">Achievements</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
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
                className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
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
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
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
    setOpen(false);
    setShowMenu(false); // Immediately hide menu on navigation
    setShowSettings(false);
    setShowConnections(false);
    setShowAddPerson(false);
    setShowProfile(false);
    setShowEditProfile(false);
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
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
    setShowProfile(false);
    setShowEditProfile(false);
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
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
                currentAccount={currentAccount}
              />
            ) : (
              <MenuView
                onSettings={() => setShowSettings(true)}
                onShare={() => {
                        setOpen(false);
                  setShowShareModal(true);
                }}
                onViewProfile={handleViewProfile}
                onConnections={() => setShowConnections(true)}
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
    </>
  );
}