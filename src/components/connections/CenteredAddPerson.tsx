"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { connectionsService, User as ConnectionUser, FriendRequest } from "@/lib/connectionsService";

export default function CenteredAddPerson({
  onBack,
  onOpenRequests,
}: {
  onBack: () => void;
  onOpenRequests?: () => void;
}) {
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
      loadConnectionStatuses(users);
    }
    setLoading(false);
  };

  const loadPendingRequests = async () => {
    if (!account?.id) return;
    const { requests, error } = await connectionsService.getPendingRequests(account.id);
    if (!error) setPendingRequests(requests);
  };

  const searchUsers = async () => {
    if (!account?.id || !searchQuery.trim()) return;
    setSearchLoading(true);
    const { users, error } = await connectionsService.searchUsers(searchQuery, account.id);
    if (!error) {
      setSearchResults(users);
      loadConnectionStatuses(users);
    }
    setSearchLoading(false);
  };

  const sendFriendRequest = async (userId: string) => {
    if (!account?.id) return;
    const { error } = await connectionsService.sendFriendRequest(account.id, userId);
    if (!error) {
      setUserConnectionStatuses(prev => ({ ...prev, [userId]: 'pending_sent' }));
    }
  };

  const cancelFriendRequest = async (userId: string) => {
    if (!account?.id) return;
    const { error } = await connectionsService.cancelFriendRequest(account.id, userId);
    if (!error) {
      setUserConnectionStatuses(prev => ({ ...prev, [userId]: 'none' }));
    }
  };

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

  const getButtonConfig = (userId: string) => {
    const status = userConnectionStatuses[userId] || 'none';
    switch (status) {
      case 'connected':
        return { text: 'Friends', className: 'px-4 py-2 bg-white text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed border border-gray-200' };
      case 'pending_sent':
        return { text: 'Added ✓', className: 'px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5 border border-gray-200' };
      case 'pending_received':
        return { text: 'Accept', className: 'px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200' };
      default:
        return { text: 'Add +', className: 'px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200' };
    }
  };

  return (
    <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
      {/* Header */}
      <div className="flex items-center justify-center relative w-full p-6 pb-6">
        <button
          onClick={onBack}
          className="absolute left-6 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Back to connections"
        >
          <span className="action-btn-circle">
            <ChevronLeft size={20} className="text-gray-900" />
          </span>
        </button>
        <h2 className="text-xl font-semibold text-gray-900 text-center">Find Friends</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 pt-2">
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

          {/* Friend Requests card (only when not searching) */}
          {!searchQuery.trim() && onOpenRequests && (
            <button
              onClick={onOpenRequests}
              className="w-full bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] p-5 text-left transition-all duration-200 hover:-translate-y-[1px]"
              style={{ 
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27,27,27,0.25)',
                willChange: 'transform, box-shadow'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              aria-label="Open friend requests"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Friend Requests</h3>
                <span className="text-sm font-medium text-gray-700">{pendingRequests.length}</span>
              </div>
            </button>
          )}

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.filter(user => userConnectionStatuses[user.id] !== 'connected').map((user) => (
                    <div key={user.id} className="bg-white rounded-2xl p-6 py-8 relative min-h-[70px] mx-auto max-w-md transition-all duration-200 hover:-translate-y-[1px]" style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)', willChange: 'transform, box-shadow' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'; }}>
                      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {user.profile_pic ? (
                          <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500 text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="w-full text-center flex items-center justify-center h-full min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{user.name}</h3>
                      </div>
                      {(() => {
                        const status = userConnectionStatuses[user.id] || 'none';
                        if (status === 'connected') return null;
                        const buttonConfig = getButtonConfig(user.id);
                        return (
                          <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                            <button onClick={() => {
                              if (buttonConfig.text === 'Add +') sendFriendRequest(user.id);
                              else if (buttonConfig.text === 'Added ✓') cancelFriendRequest(user.id);
                            }} className={buttonConfig.className}>
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

          {/* Suggested Friends */}
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
                  {suggestedFriends.filter(user => userConnectionStatuses[user.id] !== 'connected').slice(0, 5).map((user) => (
                    <div key={user.id} className="bg-white rounded-2xl p-6 py-8 relative min-h-[70px] mx-auto max-w-md transition-all duration-200 hover:-translate-y-[1px]" style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)', willChange: 'transform, box-shadow' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'; }}>
                      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {user.profile_pic ? (
                          <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500 text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="w-full text-center flex items-center justify-center h-full min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{user.name}</h3>
                      </div>
                      {(() => {
                        const status = userConnectionStatuses[user.id] || 'none';
                        if (status === 'connected') return null;
                        const buttonConfig = getButtonConfig(user.id);
                        return (
                          <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                            <button onClick={() => {
                              if (buttonConfig.text === 'Add +') sendFriendRequest(user.id);
                              else if (buttonConfig.text === 'Added ✓') cancelFriendRequest(user.id);
                            }} className={buttonConfig.className}>
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
      </div>
    </div>
  );
}

