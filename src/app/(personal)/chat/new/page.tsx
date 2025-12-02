"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Avatar from "@/components/Avatar";
import { Users, UserPlus, X } from "lucide-react";
import { MobilePage, PageContent } from "@/components/layout/PageSystem";
import { SearchIcon } from "@/components/icons";

interface Contact {
  id: string;
  name: string;
  profile_pic?: string;
  connect_id?: string;
  type: 'person';
  chatId?: string;
}

interface Group {
  id: string;
  name: string;
  photo?: string | null;
  chatId: string;
}

interface Group {
  id: string;
  name: string;
  photo?: string | null;
  chatId: string;
}

export default function NewChatPage() {
  const router = useRouter();
  const { account } = useAuth();
  const chatService = useChatService();
  const [recentChats, setRecentChats] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [filteredRecentChats, setFilteredRecentChats] = useState<Contact[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);
  const [isSlidingUp, setIsSlidingUp] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Slide up animation on mount
  useEffect(() => {
    setIsSlidingUp(true);
    return () => {
      setIsSlidingUp(false);
    };
  }, []);

  // Load data: recent chats, groups, and all contacts
  useEffect(() => {
    const loadData = async () => {
      if (!account?.id || !chatService) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const supabase = getSupabaseClient();
        if (!supabase) {
          setError('Database connection failed');
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('User not authenticated');
      return;
    }
    
        // Load user's chats (both DMs and groups)
        const { chats, error: chatsError } = await chatService.getUserChats(user.id);
        if (chatsError) {
          setError('Failed to load chats');
        return;
      }

        // Sort chats by last_message_at (most recent first)
        const sortedChats = [...chats].sort((a, b) => {
          const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return bTime - aTime;
        });

        // Get last 5 most recent chats (recent chats section)
        const recentChatsList: Contact[] = [];
        const allGroupChats: Group[] = [];
        const allDmChats: Contact[] = [];
        const recentChatUserIds = new Set<string>();

        for (const chat of sortedChats) {
          if (chat.type === 'group') {
            allGroupChats.push({
              id: chat.id,
              name: chat.name || 'Unnamed Group',
              photo: chat.photo,
              chatId: chat.id
            });
          } else if (chat.type === 'direct' && chat.participants) {
            // For DMs, find the other participant
            const otherParticipant = chat.participants.find(p => p.user_id !== user.id);
            if (otherParticipant) {
              const contact: Contact = {
                id: otherParticipant.user_id,
                name: otherParticipant.user_name || 'Unknown',
                profile_pic: otherParticipant.user_profile_pic,
                type: 'person',
                chatId: chat.id
              };
              allDmChats.push(contact);
              
              // Add to recent chats if we haven't reached 5 yet
              if (recentChatsList.length < 5) {
                recentChatsList.push(contact);
                recentChatUserIds.add(otherParticipant.user_id);
              }
            }
          }
        }

        setRecentChats(recentChatsList);
        setGroups(allGroupChats);

        // Load all user connections
        const { contacts: allUserContacts, error: contactsError } = await chatService.getContacts(user.id);
        if (contactsError) {
          console.error('Error loading contacts:', contactsError);
        }

        // Filter out contacts that are already in recent chats
        const contactsList: Contact[] = (allUserContacts || [])
          .filter((conn: any) => {
            // Exclude if already in recent chats
            if (recentChatUserIds.has(conn.id)) {
              return false;
            }
            // Exclude if already in groups (check by name match - groups might have same users)
            // Actually, groups are separate, so we don't need to filter them out
            return true;
          })
          .map((conn: any) => ({
            id: conn.id,
            name: conn.name,
            profile_pic: conn.profile_pic,
            type: 'person' as const,
            connect_id: conn.connect_id
          }));

        setAllContacts(contactsList);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      setLoading(false);
      }
    };

    loadData();
  }, [account?.id, chatService]);

  // Filter all sections based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRecentChats(recentChats);
      setFilteredGroups(groups);
      setFilteredContacts(allContacts);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredRecentChats(
      recentChats.filter(contact =>
        contact.name.toLowerCase().includes(query) ||
        contact.connect_id?.toLowerCase().includes(query)
      )
    );
    setFilteredGroups(
      groups.filter(group =>
        group.name.toLowerCase().includes(query)
      )
    );
    setFilteredContacts(
      allContacts.filter(contact =>
        contact.name.toLowerCase().includes(query) ||
        contact.connect_id?.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, recentChats, groups, allContacts]);

  const handleCreateChat = async (contact: Contact) => {
    if (!account?.id || creatingChat || !chatService) return;
    
    setCreatingChat(contact.id);
    try {
      console.log('Creating/opening chat with contact:', contact.name);
      
      // If chatId exists, navigate to existing chat
      if (contact.chatId) {
        router.push(`/chat/individual?chat=${contact.chatId}`);
        return;
      }
      
      // Otherwise, create a new chat
      const { chat, error } = await chatService.createDirectChat(contact.id);
      
      if (error) {
        console.error('Failed to create chat:', error);
        return;
      }
      
      if (chat) {
        // Navigate to the new chat
        router.push(`/chat/individual?chat=${chat.id}`);
      } else {
        console.error('Failed to create chat: no chat returned');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setCreatingChat(null);
    }
  };

  const handleOpenGroup = (group: Group) => {
    router.push(`/chat/individual?chat=${group.chatId}`);
  };

  // Handle close with slide down animation
  const handleClose = () => {
    setIsClosing(true);
    setIsSlidingUp(false);
    setTimeout(() => {
      router.push('/chat');
    }, 300);
  };

  const handleBack = () => {
    handleClose();
  };

  const handleNewGroupChat = () => {
    router.push('/chat/add-members');
  };

  const handleAddConnection = () => {
    router.push('/menu?view=add-person&from=/chat/new');
  };

  // Calculate header height for content positioning
  const headerHeight = 'calc(max(env(safe-area-inset-top), 70px) + 60px + 24px)';
  
  // Calculate search bar height for content positioning (no top padding, positioned right after header)
  const searchBarHeight = '62.5px'; // 0px top padding + 46.5px input height + 16px bottom padding

  // Show loading or redirect if not authenticated
  if (!account?.id) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden lg:hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 transition-opacity duration-300 ease-out"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            opacity: isClosing ? 0 : 1
          }}
        />
        
        {/* Content Container with Slide Animation */}
        <div 
          className="relative w-full bg-white transition-transform duration-300 ease-out overflow-hidden"
          style={{
            height: '100%',
            transform: isSlidingUp ? 'translateY(0)' : 'translateY(100%)',
          }}
        >
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
          <p className="text-sm text-gray-400 mt-2">Please make sure you&apos;re logged in</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isClosing ? 0 : 1
        }}
        onClick={handleClose}
      />
      
      {/* Content Container with Slide Animation */}
      <div 
        className="relative w-full bg-white transition-transform duration-300 ease-out overflow-hidden"
        style={{
          height: '100%',
          transform: isSlidingUp ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <MobilePage>
          {/* Custom Header matching share page - transparent background with blur effects */}
          <div className="fixed top-0 left-0 right-0 z-[60]"
            style={{
              pointerEvents: 'none'
            }}
          >
        {/* Top Blur Effects - matching PageHeader */}
        <div className="absolute top-0 left-0 right-0" style={{
          height: '135px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.78) 20%, rgba(255,255,255,0.68) 40%, rgba(255,255,255,0.62) 60%, rgba(255,255,255,0.58) 80%, rgba(255,255,255,0.3) 100%)'
        }} />
        
        {/* Compact Progressive Blur - 5 layers */}
        <div className="absolute top-0 left-0 right-0" style={{
          height: '27px',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)'
        }} />
        <div className="absolute left-0 right-0" style={{
          top: '27px',
          height: '27px',
          backdropFilter: 'blur(1.5px)',
          WebkitBackdropFilter: 'blur(1.5px)'
        }} />
        <div className="absolute left-0 right-0" style={{
          top: '54px',
          height: '27px',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)'
        }} />
        <div className="absolute left-0 right-0" style={{
          top: '81px',
          height: '27px',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)'
        }} />
        <div className="absolute left-0 right-0" style={{
          top: '108px',
          height: '27px',
          backdropFilter: 'blur(0.6px)',
          WebkitBackdropFilter: 'blur(0.6px)'
        }} />

        {/* Header Content */}
        <div
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 70px)',
            paddingBottom: '16px',
            paddingLeft: '16px',
            paddingRight: '16px',
            position: 'relative',
            pointerEvents: 'auto'
          }}
        >
          <div className="flex items-center justify-between gap-4" style={{ position: 'relative' }}>
            {/* Spacer for left side to balance the X button */}
            <div style={{ width: '40px', flexShrink: 0 }} />

            {/* Title - Centered (absolute positioning to ensure true center) */}
            <h1 
              className="font-semibold text-gray-900"
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '22px',
                lineHeight: '28px',
                textAlign: 'center'
              }}
            >
              New
            </h1>

            {/* X Button - Right */}
            <button
              onClick={handleBack}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
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
              <X size={18} className="text-gray-900" strokeWidth={2.5} />
        </button>
          </div>
        </div>
      </div>

      {/* Fixed Search Bar - positioned just underneath the blur effects */}
      <div className="fixed left-0 right-0 z-40"
        style={{
          top: `calc(${headerHeight} - 16px)`, // Position right after header content (subtract paddingBottom)
          paddingTop: '0px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
          pointerEvents: 'none'
        }}
      >
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full focus:outline-none"
            style={{
              borderRadius: "100px",
              height: "46.5px",
              background: "rgba(255, 255, 255, 0.9)",
              borderWidth: "0.4px",
              borderColor: "#E5E7EB",
              borderStyle: "solid",
              boxShadow:
                "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)",
              willChange: "transform, box-shadow",
              paddingLeft: "48px",
              paddingRight: "24px",
              fontSize: "16px",
              WebkitAppearance: "none",
              WebkitTapHighlightColor: "transparent",
              color: "#111827",
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)";
            }}
          />
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none"
            style={{ width: "48px" }}
          >
            <SearchIcon
              size={20}
              className="text-gray-900"
              style={{ strokeWidth: 2.5 }}
            />
          </div>
        </div>
      </div>

      <PageContent>
        <div className="px-4" style={{ 
          paddingTop: `calc(${headerHeight} + ${searchBarHeight})`, 
          paddingBottom: '100px' // Space for scrolling
        }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Users className="w-16 h-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading contacts</h3>
              <p className="text-sm text-center max-w-sm text-gray-500">{error}</p>
            </div>
          ) : filteredRecentChats.length === 0 && filteredGroups.length === 0 && filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No contacts found' : 'No contacts to chat with yet'}
            </h3>
            <p className="text-sm text-center max-w-sm">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                  : 'Start a conversation to see contacts here'
              }
            </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* New Group Chat and Add Connection Cards */}
              <div className="space-y-3">
                {/* New Group Chat Card */}
              <button
                  onClick={handleNewGroupChat}
                  className="w-full bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
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
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: '40px',
                        height: '40px'
                      }}
                    >
                      <Users size={20} className="text-gray-900" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-base font-semibold text-gray-900">
                        New Group Chat
                      </div>
                    </div>
                  </div>
              </button>

                {/* Add Connection Card */}
                <button
                  onClick={handleAddConnection}
                  className="w-full bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
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
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: '40px',
                        height: '40px'
                      }}
                    >
                      <UserPlus size={20} className="text-gray-900" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-base font-semibold text-gray-900">
                        Add Connection
                      </div>
                    </div>
          </div>
                </button>
            </div>

              {/* Recent Chats Section */}
              {filteredRecentChats.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 px-1">Recent Chats</div>
                  <div className="space-y-2">
                    {filteredRecentChats.map((contact) => (
              <button
                        key={contact.id}
                        onClick={() => handleCreateChat(contact)}
                        disabled={creatingChat === contact.id}
                        className="w-full bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          borderWidth: '0.4px',
                          borderColor: '#E5E7EB',
                          borderStyle: 'solid',
                          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          willChange: 'transform, box-shadow'
                        }}
                        onMouseEnter={(e) => {
                          if (!creatingChat) {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                        }}
                      >
                        <div className="flex items-center gap-3">
                <Avatar
                            src={contact.profile_pic}
                            name={contact.name}
                            size={40}
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {contact.name}
                            </div>
                            {contact.connect_id && (
                              <div className="text-xs text-gray-500 truncate">
                                @{contact.connect_id}
                              </div>
                            )}
                          </div>
                          {creatingChat === contact.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Groups Section */}
              {filteredGroups.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 px-1">Groups</div>
                  <div className="space-y-2">
                    {filteredGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleOpenGroup(group)}
                        className="w-full bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
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
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={group.photo}
                            name={group.name}
                            size={40}
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {group.name}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contacts Section */}
              {filteredContacts.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 px-1">Contacts</div>
                  <div className="space-y-2">
                    {filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleCreateChat(contact)}
                        disabled={creatingChat === contact.id}
                        className="w-full bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          borderWidth: '0.4px',
                          borderColor: '#E5E7EB',
                          borderStyle: 'solid',
                          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          willChange: 'transform, box-shadow'
                        }}
                        onMouseEnter={(e) => {
                          if (!creatingChat) {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={contact.profile_pic}
                            name={contact.name}
                            size={40}
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {contact.name}
                            </div>
                            {contact.connect_id && (
                              <div className="text-xs text-gray-500 truncate">
                                @{contact.connect_id}
                  </div>
                )}
                          </div>
                          {creatingChat === contact.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                          ) : null}
                        </div>
              </button>
            ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
      </PageContent>
        </MobilePage>
      </div>
    </div>
  );
}
