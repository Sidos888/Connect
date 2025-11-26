"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/authContext";
import { connectionsService, User as ConnectionUser } from "@/lib/connectionsService";
import ThreeDotLoadingBounce from "@/components/ThreeDotLoadingBounce";

export default function Connections({
  onFriendClick,
}: {
  onFriendClick?: (friend: ConnectionUser) => void;
}) {
  const [activeTab, setActiveTab] = useState<'friends' | 'following'>('friends');
  const { account, loading: authLoading } = useAuth();

  // Use React Query for caching and deduplication
  const { data, isLoading, isError } = useQuery({
    queryKey: ['connections', account?.id],
    queryFn: async () => {
      if (!account?.id) return [];

      // Small delay to let Supabase client stabilize after auth refresh
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const { connections, error } = await connectionsService.getConnections(account.id);
      
      if (error) throw error;
      return connections || [];
    },
    enabled: !authLoading && !!account?.id,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const peopleConnections = data || [];
  const businessConnections: any[] = [];
  const loading = isLoading;

  // Count friends and following
  const friendsCount = peopleConnections.length;
  const followingCount = 0; // Placeholder - implement following functionality later

  // Categories for pills - matching chat page structure
  const categories = [
    { id: 'friends', label: 'Friends', count: friendsCount },
    { id: 'following', label: 'Following', count: followingCount },
  ];

  return (
    <>
      {/* Category Pills - Matching chat page styling */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 -mx-1" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
          {categories.map((category) => {
            const isActive = activeTab === category.id;
            return (
              <div
                key={category.id}
                className="flex-shrink-0"
        style={{ 
                  paddingLeft: isActive ? '2px' : '0',
                  paddingRight: isActive ? '2px' : '0',
                  paddingTop: isActive ? '2px' : '0',
                  paddingBottom: isActive ? '2px' : '0',
                }}
              >
          <button
                  onClick={() => setActiveTab(category.id as 'friends' | 'following')}
                  className="inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                  style={{
                    minHeight: isActive ? '44px' : '40px',
                    paddingLeft: isActive ? '18px' : '16px',
                    paddingRight: isActive ? '18px' : '16px',
                    paddingTop: isActive ? '12px' : '10px',
                    paddingBottom: isActive ? '12px' : '10px',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    color: isActive ? '#111827' : '#6B7280',
                    willChange: 'transform, box-shadow',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    e.currentTarget.style.transform = isActive ? 'scale(1.05) translateY(-1px)' : 'scale(1) translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    e.currentTarget.style.transform = isActive ? 'scale(1.05)' : 'scale(1)';
                  }}
                >
                  <span className="text-sm font-medium leading-none">{category.label}</span>
                  {category.count !== null && (
                    <span
                      className={`ml-2 text-xs leading-none ${
                        isActive ? 'text-neutral-700' : 'text-neutral-500'
                      }`}
          >
                      {category.count}
                    </span>
                  )}
          </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full py-20">
            <ThreeDotLoadingBounce />
          </div>
        ) : activeTab === 'friends' ? (
          peopleConnections.length > 0 ? peopleConnections.map((connection: any) => {
            const friend = connection.user1?.id === account?.id ? connection.user2 : connection.user1;
            if (!friend) return null;
            return (
              <div 
                key={connection.id} 
                className="bg-white rounded-2xl p-4 min-h-[70px] cursor-pointer transition-all duration-200 hover:-translate-y-[1px] w-full" 
                style={{ 
                  borderWidth: '0.4px', 
                  borderColor: '#E5E7EB', 
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)', 
                  willChange: 'transform, box-shadow' 
                }} 
                onClick={() => onFriendClick && onFriendClick(friend)} 
                onMouseEnter={(e) => { 
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'; 
                }} 
                onMouseLeave={(e) => { 
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'; 
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {friend.profile_pic ? (
                      <img src={friend.profile_pic} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 text-sm font-medium">{friend.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{friend.name}</h3>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-gray-500 text-sm">No friends yet</p>
            </div>
          )
        ) : (
          businessConnections.length > 0 ? businessConnections.map((connection: any) => {
            const business = connection.user1?.id === account?.id ? connection.user2 : connection.user1;
            if (!business) return null;
            return (
              <div 
                key={connection.id} 
                className="bg-white rounded-2xl p-6 py-8 relative min-h-[70px] transition-all duration-200 hover:-translate-y-[1px]" 
                style={{ 
                  borderWidth: '0.4px', 
                  borderColor: '#E5E7EB', 
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
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  {business.profile_pic ? (
                    <img src={business.profile_pic} alt={business.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-sm font-medium">{business.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="w-full text-center flex items-center justify-center h-full min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{business.name}</h3>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏢</div>
              <p className="text-gray-500 text-sm">No businesses followed yet</p>
            </div>
          )
        )}
      </div>
    </>
  );
}

