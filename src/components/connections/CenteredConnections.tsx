"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, X, Plus } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useAppStore } from "@/lib/store";
import { connectionsService, User as ConnectionUser } from "@/lib/connectionsService";
import Avatar from "@/components/Avatar";
import ThreeDotLoading from "@/components/ThreeDotLoading";
import ThreeDotLoadingBounce from "@/components/ThreeDotLoadingBounce";

export default function CenteredConnections({
  onBack,
  onAddPerson,
  onFriendClick,
  fromProfile = false,
  showAddPersonButton = true,
}: {
  onBack: () => void;
  onAddPerson?: () => void;
  onFriendClick?: (friend: ConnectionUser) => void;
  fromProfile?: boolean;
  showAddPersonButton?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'friends' | 'following'>('friends');
  const [peopleConnections, setPeopleConnections] = useState<any[]>([]);
  const [businessConnections, setBusinessConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { account } = useAuth();
  const { personalProfile } = useAppStore();

  useEffect(() => {
    const loadConnections = async () => {
      if (!account?.id) {
        setLoading(false);
        return;
      }
      try {
        const { connections: userConnections, error } = await connectionsService.getConnections(account.id);
        if (!error) {
          setPeopleConnections(userConnections || []);
          setBusinessConnections([]);
        } else {
          setPeopleConnections([]);
          setBusinessConnections([]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadConnections();
  }, [account?.id]);

  return (
    <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
      {/* Header */}
      <div className="flex items-center justify-center relative w-full p-6 pb-3" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <button
          onClick={onBack}
          className="absolute left-6 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Close connections"
        >
          <span className="action-btn-circle">
            {fromProfile ? (
              <ArrowLeft size={20} className="text-gray-700" />
            ) : (
              <X size={20} className="text-gray-700" />
            )}
          </span>
        </button>
        <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Connections</h2>
        {showAddPersonButton && onAddPerson ? (
          <button
            onClick={onAddPerson}
            className="absolute right-6 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Add person"
          >
            <span className="action-btn-circle">
              <Plus size={20} className="text-gray-700" />
            </span>
          </button>
        ) : (<div className="w-9 absolute right-6" />)}
      </div>

      {/* Profile summary */}
      <div 
        className="bg-white rounded-2xl p-6 mb-6 mx-6 mt-4"
        style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
      >
        <div className="flex items-center gap-4">
          <Avatar src={personalProfile?.avatarUrl} name={personalProfile?.name} size={60} />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{personalProfile?.name || 'You'}</h3>
            <p className="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
              {activeTab === 'friends' ? peopleConnections.length : businessConnections.length} {activeTab === 'friends' ? 'friends' : 'following'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 px-6 pt-2">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-2 text-sm font-medium rounded-2xl transition-all duration-200 ${
              activeTab === 'friends'
                ? 'text-gray-900 bg-white'
                : 'text-gray-500 bg-white'
            }`}
            style={
              activeTab === 'friends'
                ? {
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    transform: 'translateY(-1px)',
                  }
                : {
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }
            }
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-6 py-2 text-sm font-medium rounded-2xl transition-all duration-200 ${
              activeTab === 'following'
                ? 'text-gray-900 bg-white'
                : 'text-gray-500 bg-white'
            }`}
            style={
              activeTab === 'following'
                ? {
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    transform: 'translateY(-1px)',
                  }
                : {
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }
            }
          >
            Following
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <ThreeDotLoadingBounce />
          </div>
        ) : activeTab === 'friends' ? (
          <div className="space-y-3">
          {(peopleConnections.length > 0 ? peopleConnections : []).map((connection: any) => {
            const friend = connection.user1?.id === account?.id ? connection.user2 : connection.user1;
            if (!friend) return null;
            return (
              <div key={connection.id} className="bg-white rounded-2xl p-6 min-h-[70px] cursor-pointer transition-all duration-200 mx-auto max-w-md hover:-translate-y-[1px]" style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)', willChange: 'transform, box-shadow' }} onClick={() => onFriendClick && onFriendClick(friend)} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'; }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {friend.profile_pic ? (
                      <img src={friend.profile_pic} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 text-sm font-medium">{friend.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-center min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{friend.name}</h3>
                  </div>
                  <div className="w-10" />
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          businessConnections.length > 0 ? <div className="space-y-3">{businessConnections.map((connection: any) => {
            const business = connection.user1?.id === account?.id ? connection.user2 : connection.user1;
            if (!business) return null;
            return (
              <div key={connection.id} className="bg-white rounded-2xl p-6 py-8 relative min-h-[70px]" style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}>
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
          })}</div> : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏢</div>
              <p className="text-gray-500 text-sm">No businesses followed yet</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}


