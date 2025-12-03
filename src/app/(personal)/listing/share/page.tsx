"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { connectionsService } from '@/lib/connectionsService';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight } from 'lucide-react';
import { MobilePage, PageContent } from '@/components/layout/PageSystem';
import Avatar from '@/components/Avatar';
import { SearchIcon } from '@/components/icons';
import Image from 'next/image';

interface Contact {
  id: string;
  name: string;
  profile_pic?: string | null;
  profilePic?: string | null;
  connect_id?: string;
  connectId?: string;
  type: 'person' | 'business';
  chatId?: string; // For DMs
}

interface Group {
  id: string;
  name: string;
  photo?: string | null;
  chatId: string;
}

export default function ShareListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('id');
  const { account } = useAuth();
  const chatService = useChatService();
  const queryClient = useQueryClient();
  const [listing, setListing] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]); // Recent chats (DMs)
  const [groups, setGroups] = useState<Group[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]); // All connections
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [filteredAllContacts, setFilteredAllContacts] = useState<Contact[]>([]);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set()); // Store chat IDs for existing chats
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set()); // Store user IDs for contacts without chats
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if no listing ID
  useEffect(() => {
    if (!listingId) {
      router.push('/my-life');
    }
  }, [listingId, router]);

  // Load listing data
  useEffect(() => {
    const loadListing = async () => {
      if (!listingId) return;

      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, start_date, end_date, photo_urls')
          .eq('id', listingId)
          .single();

        if (error) {
          console.error('Error loading listing:', error);
          return;
        }

        setListing(data);
      } catch (err) {
        console.error('Error in loadListing:', err);
      }
    };

    loadListing();
  }, [listingId]);

  // Load contacts and groups
  useEffect(() => {
    const loadData = async () => {
      if (!account?.id || !chatService || !listingId) {
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

        // Separate DMs and groups
        const dmChats: Contact[] = [];
        const groupChats: Group[] = [];
        const dmChatUserIds = new Set<string>(); // Track users with existing DM chats

        for (const chat of chats) {
          if (chat.type === 'group') {
            groupChats.push({
              id: chat.id,
              name: chat.name || 'Unnamed Group',
              photo: chat.photo,
              chatId: chat.id
            });
          } else if (chat.type === 'direct' && chat.participants) {
            // For DMs, find the other participant
            const otherParticipant = chat.participants.find(p => p.user_id !== user.id);
            if (otherParticipant) {
              dmChatUserIds.add(otherParticipant.user_id);
              dmChats.push({
                id: otherParticipant.user_id,
                name: otherParticipant.user_name || 'Unknown',
                profile_pic: otherParticipant.user_profile_pic,
                type: 'person',
                chatId: chat.id
              });
            }
          }
        }

        // Load all connections (friends)
        const { connections, error: connectionsError } = await connectionsService.getConnections(user.id);
        if (connectionsError) {
          console.error('Error loading connections:', connectionsError);
        }

        // Map connections to contacts, excluding those already in recent chats
        const allConnectionContacts: Contact[] = [];
        if (connections) {
          for (const conn of connections) {
            const friendId = conn.user1_id === user.id ? conn.user2_id : conn.user1_id;
            const friendData = conn.user1_id === user.id ? conn.user2 : conn.user1;
            
            // Skip if already in recent chats
            if (dmChatUserIds.has(friendId)) {
              continue;
            }
            
            if (friendData) {
              allConnectionContacts.push({
                id: friendId,
                name: friendData.name || 'Unknown',
                profile_pic: friendData.profile_pic,
                type: 'person',
                // No chatId yet - will need to create chat when selected
              });
            }
          }
        }

        setContacts(dmChats);
        setGroups(groupChats);
        setAllContacts(allConnectionContacts);

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, [account?.id, chatService, listingId]);

  // Filter contacts, groups, and all contacts based on search and hide selected items
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    
    // Filter recent chats: exclude selected ones and apply search
    const filteredContactsList = contacts.filter(contact => {
      // Hide if selected (check both chatId and userId)
      if (contact.chatId && selectedChats.has(contact.chatId)) {
        return false;
      }
      if (selectedUsers.has(contact.id)) {
        return false;
      }
      // Apply search filter if query exists
      if (searchQuery.trim()) {
        return contact.name.toLowerCase().includes(query);
      }
      return true;
    });
    
    // Filter groups: exclude selected ones and apply search
    const filteredGroupsList = groups.filter(group => {
      // Hide if selected
      if (selectedChats.has(group.chatId)) {
        return false;
      }
      // Apply search filter if query exists
      if (searchQuery.trim()) {
        return group.name.toLowerCase().includes(query);
      }
      return true;
    });
    
    // Filter all contacts: exclude selected ones and apply search
    const filteredAllContactsList = allContacts.filter(contact => {
      // Hide if selected (check both chatId and userId)
      if (contact.chatId && selectedChats.has(contact.chatId)) {
        return false;
      }
      if (selectedUsers.has(contact.id)) {
        return false;
      }
      // Apply search filter if query exists
      if (searchQuery.trim()) {
        return contact.name.toLowerCase().includes(query);
      }
      return true;
    });
    
    setFilteredContacts(filteredContactsList);
    setFilteredGroups(filteredGroupsList);
    setFilteredAllContacts(filteredAllContactsList);
  }, [searchQuery, contacts, groups, allContacts, selectedChats, selectedUsers]);

  const handleBack = () => {
    if (listingId) {
      router.push(`/listing?id=${listingId}`);
    } else {
      router.back();
    }
  };

  const toggleChatSelection = (chatId: string | undefined, userId?: string) => {
    // If contact has a chatId (existing chat), toggle in selectedChats
    if (chatId) {
      setSelectedChats(prev => {
        const newSet = new Set(prev);
        if (newSet.has(chatId)) {
          newSet.delete(chatId);
        } else {
          newSet.add(chatId);
        }
        return newSet;
      });
    }
    // If no chatId but we have userId (new contact), toggle in selectedUsers
    else if (userId) {
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });
    }
  };

  const handleSend = async () => {
    if (!listingId || (selectedChats.size === 0 && selectedUsers.size === 0) || !chatService || sending) return;

    setSending(true);
    setError(null);

    try {
      const allSendPromises: Promise<any>[] = [];

      // Send to existing chats
      for (const chatId of Array.from(selectedChats)) {
        allSendPromises.push(
          chatService.sendListingMessage(chatId, listingId)
        );
      }

      // Create chats for new users and send
      for (const userId of Array.from(selectedUsers)) {
        allSendPromises.push(
          (async () => {
            // Create chat first
            const { chat, error: chatError } = await chatService.createDirectChat(userId);
            if (chatError || !chat) {
              console.error('Error creating chat for user:', userId, chatError);
              return { error: chatError };
            }
            // Then send listing
            return await chatService.sendListingMessage(chat.id, listingId);
          })()
        );
      }

      const results = await Promise.all(allSendPromises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        console.error('Some sends failed:', errors);
        setError(`Failed to send to ${errors.length} chat(s)`);
      } else {
        // Invalidate queries to refresh chat messages
        queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        
        // Navigate back to listing
        router.push(`/listing?id=${listingId}`);
      }
    } catch (err) {
      console.error('Error sending listing:', err);
      setError('Failed to send listing');
    } finally {
      setSending(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Date and time";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Date and time";
    }
  };

  const hasSelectedChats = selectedChats.size > 0 || selectedUsers.size > 0;

  // Custom actions for the tick button (matching create listing page)
  const customActions = (
    <button
      onClick={handleSend}
      disabled={!hasSelectedChats || sending}
      className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '100px',
        background: hasSelectedChats ? '#FF6600' : '#9CA3AF',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
        willChange: 'transform, box-shadow'
      }}
      onTouchStart={(e) => {
        if (hasSelectedChats) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onMouseEnter={(e) => {
        if (!sending && hasSelectedChats) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
      }}
    >
      <Check
        size={18}
        className="text-white"
      />
    </button>
  );

  // Calculate header height for content positioning
  // Header: max(env(safe-area-inset-top), 70px) + 16px (paddingBottom) + 44px (content height) = ~130px
  // Reduced spacing (24px) to move content up more
  const headerHeight = 'calc(max(env(safe-area-inset-top), 70px) + 60px + 24px)';
  
  // Calculate search bar height for content positioning
  // Search bar: 24px (top padding) + 46.5px (input height) + 16px (bottom padding) = ~86.5px
  const searchBarHeight = '86.5px';

  return (
    <MobilePage>
      {/* Custom Header matching create listing page 2 - transparent background with blur effects */}
      <div className="fixed top-0 left-0 right-0 z-[60]"
        style={{
          pointerEvents: 'none'
        }}
      >
        {/* Top Blur Effects - matching PageHeader */}
        {/* Compact Opacity Gradient */}
        <div className="absolute top-0 left-0 right-0" style={{
          height: '135px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.78) 20%, rgba(255,255,255,0.68) 40%, rgba(255,255,255,0.62) 60%, rgba(255,255,255,0.58) 80%, rgba(255,255,255,0.3) 100%)'
        }} />
        
        {/* Compact Progressive Blur - 5 layers (mobile: 27px each = 135px total) */}
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
          <div className="flex items-center justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '100px',
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
            <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Listing Card */}
          {listing ? (
            <div 
              className="flex-1 bg-white rounded-xl p-3 flex items-center gap-3 min-w-0"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                overflow: 'hidden'
              }}
            >
              {/* Listing Image */}
              <div
                className="bg-gray-200 rounded-lg overflow-hidden flex-shrink-0"
                style={{
                  width: '48px',
                  height: '48px',
                  borderWidth: '0.5px',
                  borderStyle: 'solid',
                  borderColor: 'rgba(0, 0, 0, 0.08)'
                }}
              >
                {listing.photo_urls && listing.photo_urls.length > 0 ? (
                  <Image
                    src={listing.photo_urls[0]}
                    alt={listing.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400 text-xs font-semibold">
                      {listing.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Title and Date */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {listing.title}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {formatDateTime(listing.start_date)}
                </div>
              </div>
            </div>
          ) : null}

          {/* Tick Button */}
          {customActions}
          </div>
        </div>
      </div>

      {/* Fixed Search Bar - stays locked at default position */}
      <div className="fixed left-0 right-0 z-40"
        style={{
          top: headerHeight,
          paddingTop: '24px',
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
          paddingBottom: '100px' 
        }}>

          {/* Selected Section */}
          {(selectedChats.size > 0 || selectedUsers.size > 0) && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-2 px-1">Selected</div>
              <div className="space-y-2">
                {/* Selected chats (existing chats) */}
                {Array.from(selectedChats).map(chatId => {
                  // Find contact or group for this chat
                  const contact = contacts.find(c => c.chatId === chatId);
                  const group = groups.find(g => g.chatId === chatId);
                  const item = contact || group;
                  
                  if (!item) return null;

                  return (
                    <div
                      key={`chat-${chatId}`}
                      onClick={() => toggleChatSelection(chatId)}
                      className="bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
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
                          src={(item as Contact).profile_pic || (item as Contact).profilePic || (group ? group.photo : null)}
                          name={item.name}
                          size={40}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {item.name}
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: '#FF6600'
                          }}
                        >
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Selected users (new contacts without chats) */}
                {Array.from(selectedUsers).map(userId => {
                  // Find contact from allContacts
                  const contact = allContacts.find(c => c.id === userId);
                  
                  if (!contact) return null;

                  return (
                    <div
                      key={`user-${userId}`}
                      onClick={() => toggleChatSelection(undefined, userId)}
                      className="bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
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
                          src={contact.profile_pic || contact.profilePic}
                          name={contact.name}
                          size={40}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {contact.name}
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: '#FF6600'
                          }}
                        >
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Chats Section */}
          {filteredContacts.length > 0 && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-2 px-1">Recent Chats</div>
              <div className="space-y-2">
                {filteredContacts.map((contact) => {
                  if (!contact.chatId) return null;
                  const isSelected = selectedChats.has(contact.chatId);
                  
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleChatSelection(contact.chatId!)}
                      className="bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
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
                          src={contact.profile_pic || contact.profilePic}
                          name={contact.name}
                          size={40}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {contact.name}
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                          style={{
                            borderColor: isSelected ? '#FF6600' : '#E5E7EB',
                            backgroundColor: isSelected ? '#FF6600' : 'transparent'
                          }}
                        >
                          {isSelected && (
                            <Check size={12} className="text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Groups Section */}
          {filteredGroups.length > 0 && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-2 px-1">Groups</div>
              <div className="space-y-2">
                {filteredGroups.map((group) => {
                  const isSelected = selectedChats.has(group.chatId);
                  
                  return (
                    <div
                      key={group.id}
                      onClick={() => toggleChatSelection(group.chatId)}
                      className="bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
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
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {group.name}
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                          style={{
                            borderColor: isSelected ? '#FF6600' : '#E5E7EB',
                            backgroundColor: isSelected ? '#FF6600' : 'transparent'
                          }}
                        >
                          {isSelected && (
                            <Check size={12} className="text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Contacts Section */}
          {filteredAllContacts.length > 0 && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-2 px-1">All Contacts</div>
              <div className="space-y-2">
                {filteredAllContacts.map((contact) => {
                  const isSelected = contact.chatId ? selectedChats.has(contact.chatId) : false;
                  
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleChatSelection(contact.chatId, contact.id)}
                      className="bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
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
                          src={contact.profile_pic || contact.profilePic}
                          name={contact.name}
                          size={40}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {contact.name}
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                          style={{
                            borderColor: isSelected ? '#FF6600' : '#E5E7EB',
                            backgroundColor: isSelected ? '#FF6600' : 'transparent'
                          }}
                        >
                          {isSelected && (
                            <Check size={12} className="text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </PageContent>

      {/* Fixed Bottom: Share Externally Card - transparent background like bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          paddingTop: '16px',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          paddingLeft: '16px',
          paddingRight: '16px',
          pointerEvents: 'none'
        }}
      >
        <div
          className="bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
          style={{
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            willChange: 'transform, box-shadow',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold text-gray-900 mb-1">
                Share Externally
              </div>
              <div className="text-sm text-gray-500">
                Airdrop, messages etc
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </div>
      </div>
    </MobilePage>
  );
}

