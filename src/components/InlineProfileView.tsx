"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, Images, Settings, Users, ArrowLeft, X, MoreVertical, Trash2, ChevronLeft, ChevronRight, Bell, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
// import { simpleChatService } from '@/lib/simpleChatService'; // OLD - removed
import Avatar from '@/components/Avatar';
import ConnectionsModal from './chat/ConnectionsModal';
import AboutMeView from './AboutMeView';
import { formatNameForDisplay } from '@/lib/utils';
import QRCode from 'qrcode';

interface InlineProfileViewProps {
  userId: string;
  onBack: () => void;
  onStartChat?: (chatId: string) => void;
  onOpenConnections?: (userId: string) => void;
  onSettingsClick?: () => void;
  entryPoint?: 'chat' | 'connections' | 'menu'; // Context for different back behaviors
}

interface UserProfile {
  id: string;
  name: string;
  profile_pic?: string;
  bio?: string;
  phone?: string;
  email?: string;
  dob?: string;
}

export default function InlineProfileView({ 
  userId, 
  onBack,
  onStartChat,
  onOpenConnections,
  onSettingsClick,
  entryPoint = 'connections'
}: InlineProfileViewProps) {
  const router = useRouter();
  const { account } = useAuth();
  const chatService = useChatService();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [currentView, setCurrentView] = useState<'profile' | 'settings' | 'connections' | 'about'>('profile');
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [mutualConnections, setMutualConnections] = useState<any[]>([]);
  const [mutualCount, setMutualCount] = useState(0);
  const [selfConnections, setSelfConnections] = useState<any[]>([]);
  const [selfConnectionsCount, setSelfConnectionsCount] = useState(0);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Reset profile when userId changes to ensure proper loading behavior
  useEffect(() => {
    setProfile(null);
    setConnectionStatus('none');
    setMutualConnections([]);
    setMutualCount(0);
    setLoading(false);
    setError(null);
  }, [userId]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;

      try {
        // Only show loading on initial load, not when navigating between modals
        if (!profile) {
          setLoading(true);
        }
        setError(null);

        // Get user profile from contacts or accounts table
        const { contacts } = await chatService?.getContacts(account?.id || '') || { contacts: [], error: null };
        const userProfile = contacts.find(contact => contact.id === userId) || (account?.id === userId ? {
          id: account?.id,
          name: account?.name || 'You',
          profile_pic: account?.profile_pic,
          bio: account?.bio,
          dob: account?.dob
        } as any : null);

        if (userProfile) {
          setProfile({
            id: userProfile.id,
            name: userProfile.name,
            profile_pic: userProfile.profile_pic,
            bio: userProfile.bio || 'Bio not available',
            dob: userProfile.dob
          });

          // Load connections data
          if (account?.id) {
            try {
              if (account.id === userId) {
                // Viewing own profile: show top connections
                setSelfConnections(contacts.slice(0, 3));
                setSelfConnectionsCount(contacts.length);
                setConnectionStatus('self');
              } else {
                // Viewing someone else: show mutuals/relationship
                // For now, set default connection status since simpleChatService is removed
                const statusRes = { status: 'none' };
                const mutualCountRes = { count: 0 };
                const mutualsRes = { connections: [] };
                setConnectionStatus(statusRes.status);
                setMutualCount(mutualCountRes.count);
                setMutualConnections(mutualsRes.connections);
              }
            } catch (connError) {
              console.error('InlineProfileView: Error loading connection data:', connError);
              if (userProfile && account.id !== userId) {
                setConnectionStatus('accepted');
              }
            }
          }
        } else {
          setError('User profile not found');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, account?.id]);

  // Generate QR when opening links modal
  useEffect(() => {
    const generateQr = async () => {
      if (!showLinksModal) return;
      try {
        const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile/${userId}` : `/profile/${userId}`;
        const dataUrl = await QRCode.toDataURL(profileUrl, { width: 240, margin: 1 });
        setQrDataUrl(dataUrl);
      } catch (_e) {
        setQrDataUrl(null);
      }
    };
    generateQr();
  }, [showLinksModal, userId]);

  // Freeze background when links modal is open
  useEffect(() => {
    if (showLinksModal) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [showLinksModal]);

  const handleStartChat = async () => {
    if (!userId || !account?.id) return;

    try {
      // For now, just navigate to chat without creating/finding existing chats
      // This will be implemented when chatService methods are available
      if (onStartChat) {
        // Generate a temporary chat ID for now
        const tempChatId = `temp-${account.id}-${userId}`;
        onStartChat(tempChatId);
        onBack();
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };


  const handleConnectionsClick = () => {
    if (onOpenConnections) {
      onOpenConnections(userId);
    } else {
      setCurrentView('connections');
      setShowConnectionsModal(true);
    }
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    }
  };

  const handleBackFromSubView = () => {
    if (currentView === 'connections') {
      setShowConnectionsModal(false);
      setCurrentView('profile');
    } else if (currentView === 'about') {
      setCurrentView('profile');
    } else {
      // If we're already at the profile view, go back to the parent
      onBack();
    }
  };


  if (loading) {
    // Avoid showing a loading spinner; render nothing while data is fetched
    return null;
  }

  if (error || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  // Always show the detailed view (universal profile section)
  return (
    <div className="flex flex-col h-full">
      {/* Floating Action Buttons */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <button
          onClick={handleBackFromSubView}
          className="p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand pointer-events-auto"
          aria-label="Back to previous view"
        >
          <span className="action-btn-circle">
            <ArrowLeft size={20} className="text-gray-900" />
          </span>
        </button>
        <button 
          onClick={handleSettingsClick}
          className="p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand pointer-events-auto"
        >
          <span className="back-btn-circle">
            <Settings size={20} className="text-gray-700" />
          </span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6" style={{ paddingTop: '50px' }}>
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <Avatar
              src={profile.profile_pic}
              name={profile.name}
              size={140}
            />
          </div>
          <button
            onClick={() => router.push('/share-profile')}
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
            <span className="text-3xl font-bold text-gray-900">{formatNameForDisplay(profile.name)}</span>
          </button>
          <p className="text-gray-600 text-lg">{profile.bio}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-6 justify-center mb-6">
          <button
            onClick={handleStartChat}
            className="flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <MessageCircle className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-medium text-black">Message</span>
          </button>

          <button 
            onClick={() => setCurrentView('about')}
            className="flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <User className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-medium text-black">About</span>
          </button>

          <button 
            onClick={() => {
              if (onSettingsClick) {
                onSettingsClick();
              } else {
                router.push('/settings');
              }
            }}
            className="flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <Settings className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-medium text-black">Settings</span>
          </button>
        </div>

        {/* Connection Status */}
        <button 
          type="button"
          aria-label="Open my connections"
          className="w-full bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] hover:bg-white transition-shadow min-h-[80px] flex flex-col justify-center text-left"
          onClick={handleConnectionsClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleConnectionsClick(); } }}
        >
          {account?.id === userId ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                  <Users className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm font-medium text-black">Connections</span>
              </div>
              <div className="flex items-center gap-1">
                {selfConnections.slice(0,3).map((c:any) => (
                  <div key={c.id} className="w-5 h-5 bg-white border border-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
                    <Avatar src={c.profile_pic} name={c.name} size={20} />
                  </div>
                ))}
                {selfConnectionsCount > 3 && (
                  <span className="text-xs text-black">+{selfConnectionsCount - 3}</span>
                )}
              </div>
            </div>
          ) : connectionStatus === 'accepted' ? (
            <div className="flex items-center justify-center">
              <span className="text-sm font-medium text-black">Friends</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                  <Users className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm font-medium text-black">
                  {connectionStatus === 'pending' ? 'Friend Request Sent' : 'Add Friend'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {mutualConnections.length > 0 && (
                  <div className="flex -space-x-1">
                    {mutualConnections.slice(0, 3).map((mutual: any) => (
                      <div key={mutual.id} className="w-5 h-5 bg-white border border-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
                        <Avatar src={mutual.profile_pic} name={mutual.name} size={20} />
                      </div>
                    ))}
                  </div>
                )}
                {mutualCount > 3 && (
                  <span className="text-xs text-black">+{mutualCount - 3}</span>
                )}
              </div>
            </div>
          )}
        </button>

        {/* Content Sections */}
        <div className="space-y-3 mb-4">
          <button 
            onClick={() => router.push('/timeline')}
            className="w-full bg-white border border-gray-200 text-gray-700 rounded-2xl p-4 text-center font-medium hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] hover:bg-white transition-shadow shadow-sm min-h-[80px] flex items-center justify-center"
          >
            🧭 Timeline
          </button>
          <button className="w-full bg-white border border-gray-200 text-gray-700 rounded-2xl p-4 text-left font-medium hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] hover:bg-white transition-shadow shadow-sm min-h-[80px] flex items-center">
            View Photos
          </button>
          <button className="w-full bg-white border border-gray-200 text-gray-700 rounded-2xl p-4 text-left font-medium hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] hover:bg-white transition-shadow shadow-sm min-h-[80px] flex items-center">
            View Achievements
          </button>
        </div>
      </div>

      {/* Connections Modal */}
      <ConnectionsModal
        isOpen={showConnectionsModal}
        onClose={() => {
          setShowConnectionsModal(false);
          setCurrentView('profile');
        }}
        onBack={() => {
          setShowConnectionsModal(false);
          setCurrentView('profile');
        }}
        userId={userId}
      />

      {/* About Me View */}
      {currentView === 'about' && (
        <div className="absolute inset-0 bg-white z-20">
          <AboutMeView
            onBack={() => setCurrentView('profile')}
            isPersonalProfile={account?.id === userId}
            profileName={profile?.name}
            profileDob={profile?.dob}
          />
        </div>
      )}

      {/* Links/QR Modal */}
      {showLinksModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLinksModal(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-[420px] h-[520px] shadow-2xl overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
              <button
                onClick={() => setShowLinksModal(false)}
                className="p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand pointer-events-auto"
                aria-label="Back"
              >
                <span className="back-btn-circle">
                  <ArrowLeft size={20} className="text-gray-700" />
                </span>
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Share Profile</h2>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Profile QR" className="w-60 h-60" />
              ) : (
                <div className="w-60 h-60 bg-gray-100 rounded-lg animate-pulse" />
              )}
              <p className="text-sm text-gray-500 mt-4 text-center">Scan to view links and connect</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
