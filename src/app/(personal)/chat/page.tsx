"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Avatar from "@/components/Avatar";
import BearEmoji from "@/components/BearEmoji";
import { useAppStore } from "@/lib/store";
import type { Conversation } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ChatLayout from "./ChatLayout";
import PersonalChatPanel from "./PersonalChatPanel";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { useChats } from "@/lib/chatQueries";
import { useModal } from "@/lib/modalContext";
import { useQuery } from "@tanstack/react-query";
import { connectionsService } from "@/lib/connectionsService";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NewMessageModal from "@/components/chat/NewMessageModal";
import GroupSetupModal from "@/components/chat/GroupSetupModal";
import GroupChatFlowContainer from "@/components/chat/GroupChatFlowContainer";
import { Plus, Image as ImageIcon } from "lucide-react";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import ProfileModal from "@/components/profile/ProfileModal";
import { SearchIcon } from "@/components/icons";
import SearchModal from "@/components/chat/SearchModal";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Image from "next/image";

function MessagesPageContent() {
  const { isHydrated } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const { account, user } = useAuth();
  const chatService = useChatService();
  const { showAddFriend } = useModal();
  const searchParams = useSearchParams();
  const selectedChatId = searchParams.get("chat");
  const openNewChat = searchParams.get("openNewChat");
  
  // Use React Query to fetch chats
  const { data: chats = [], isLoading, error } = useChats(chatService, user?.id || null);
  
  // Load user's connections (friends) to filter direct chats
  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['connections', account?.id],
    queryFn: async () => {
      if (!account?.id) return [];
      console.log('Inbox: Loading connections for filtering...');
      const { connections, error } = await connectionsService.getConnections(account.id);
      if (error) {
        console.error('Error loading connections for inbox filtering:', error);
        return [];
      }
      console.log('Inbox: Loaded connections:', connections?.length || 0);
      return connections || [];
    },
    enabled: !!account?.id,
    staleTime: 0, // Always consider stale - refetch after invalidation
    refetchOnMount: true,
  });
  
  // Create a set of friend IDs for quick lookup
  const friendIds = useMemo(() => {
    if (!account?.id) return new Set<string>();
    const ids = new Set<string>();
    connections.forEach((conn: any) => {
      if (conn.user1_id === account.id && conn.user2_id) {
        ids.add(conn.user2_id);
      } else if (conn.user2_id === account.id && conn.user1_id) {
        ids.add(conn.user1_id);
      }
    });
    console.log('Inbox: friendIds Set created with', ids.size, 'friends:', Array.from(ids));
    return ids;
  }, [connections, account?.id]);
  
  // Convert chats to conversations format
  const conversations = useMemo(() => {
    if (!account?.id) return [];
    
    return chats
      // Filter out chats with no messages (empty chats)
      .filter(chat => chat.last_message_at !== null)
      // Filter out direct chats where the other participant is not a friend
      .filter(chat => {
        if (chat.type !== 'direct') return true; // Keep all group chats
        const otherParticipant = chat.participants?.find((p: any) => p.user_id !== account.id);
        if (!otherParticipant) return false; // No other participant found
        return friendIds.has(otherParticipant.user_id); // Only show if they're a friend
      })
      .map(chat => {
      // For direct chats, find the other participant
      const otherParticipant = chat.type === 'direct' 
        ? chat.participants?.find((p: any) => p.user_id !== account.id)
        : null;
      
      // Determine title and avatar
      const title = chat.type === 'direct'
        ? (otherParticipant?.user_name || 'Unknown User')
        : (chat.name || 'Group Chat');
      
      const avatarUrl = chat.type === 'direct'
        ? (otherParticipant?.user_profile_pic || null)
        : (chat.photo || null); // Use group photo for group chats
      
      // Format last message
      let lastMessageText: string = 'No messages yet';
      if (chat.last_message) {
        const attachmentCount = chat.last_message.attachment_count ?? 0;
        const isFromCurrentUser = chat.last_message.sender_id === account.id;
        const senderName = chat.last_message.sender_name || 'Unknown';
        const messageText = chat.last_message.message_text || '';
        const hasText = messageText.trim().length > 0;
        
        // Priority 1: If message has attachments, show attachment count with icon
        if (attachmentCount > 0 || (!hasText && chat.last_message.message_type === 'image')) {
          const count = attachmentCount > 0 ? attachmentCount : 1; // Default to 1 if message_type is image but no count
          if (isFromCurrentUser) {
            // You sent it: "3 📷 Attachments"
            lastMessageText = `${count} 📷 Attachment${count > 1 ? 's' : ''}`;
          } else {
            // Someone else sent it: "John 3 📷 Attachments"
            lastMessageText = `${senderName} ${count} 📷 Attachment${count > 1 ? 's' : ''}`;
          }
        } else if (hasText) {
          // Priority 2: Regular text message
          if (isFromCurrentUser) {
            // You sent it: just show the message
            lastMessageText = messageText;
          } else {
            // Someone else sent it: "John: Hello whats up?"
            lastMessageText = `${senderName}: ${messageText}`;
          }
        } else if (chat.last_message.message_type === 'image') {
          // Priority 3: Legacy image message (no attachment_count)
          if (isFromCurrentUser) {
          lastMessageText = '📷 Image';
          } else {
            lastMessageText = `${senderName} 📷 Image`;
          }
        }
        // If none of the above, lastMessageText remains 'No messages yet'
      }
      
      return {
        id: chat.id,
        title,
        avatarUrl,
        isGroup: chat.type === 'group',
        isEventChat: chat.is_event_chat || false,
        unreadCount: chat.unread_count || 0,
        last_message: lastMessageText,
        last_message_at: chat.last_message_at,
        messages: []
      };
    });
  }, [chats, account?.id, friendIds]);
  
  // Event listing data for event chats
  const [eventListings, setEventListings] = useState<Map<string, {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    photo_urls: string[] | null;
  }>>(new Map());
  
  // Fetch event listing data for event chats
  useEffect(() => {
    const fetchEventListings = async () => {
      const eventChats = conversations.filter(conv => conv.isEventChat);
      if (eventChats.length === 0) {
        setEventListings(new Map());
        return;
      }
      
      const supabase = getSupabaseClient();
      if (!supabase) return;
      
      const newEventListings = new Map<string, {
        id: string;
        title: string;
        start_date: string | null;
        end_date: string | null;
        photo_urls: string[] | null;
      }>();
      
      await Promise.all(
        eventChats.map(async (conv) => {
          try {
            const { data: listing, error } = await supabase
              .from('listings')
              .select('id, title, start_date, end_date, photo_urls, event_chat_id')
              .eq('event_chat_id', conv.id)
              .maybeSingle();
            
            if (!error && listing) {
              newEventListings.set(conv.id, {
                id: listing.id,
                title: listing.title,
                start_date: listing.start_date,
                end_date: listing.end_date,
                photo_urls: listing.photo_urls || null
              });
            }
          } catch (err) {
            console.error('Error fetching event listing for chat:', conv.id, err);
          }
        })
      );
      
      setEventListings(newEventListings);
    };
    
    fetchEventListings();
  }, [conversations]);
  
  // Find the selected conversation
  const selectedConversation = selectedChatId ? conversations.find(c => c.id === selectedChatId) : null;
  
  // Mobile-specific state
  const [mobileActiveCategory, setMobileActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Format listing date/time helper
  const formatListingDateTime = (dateString: string | null) => {
    if (!dateString) return "Date and Time";
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
      return "Date and Time";
    }
  };

  // Lock body scroll on desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) { // lg breakpoint
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
  
  // Modal state
  const { showLogin } = useModal();
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showGroupSetupModal, setShowGroupSetupModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNewChatSlideModal, setShowNewChatSlideModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showNewGroupChatModal, setShowNewGroupChatModal] = useState(false);
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);
  const [groupChatFlowStep, setGroupChatFlowStep] = useState<'new-chat' | 'add-members' | 'new-group-chat'>('new-chat');

  // Load specific chat if requested but not in conversations list
  useEffect(() => {
    const loadSpecificChat = async () => {
      if (selectedChatId && !selectedConversation && account?.id && isHydrated && chatService) {
        try {
          const { chat, error } = await chatService.getChatById(selectedChatId);
          if (error) {
            console.error('Error loading specific chat:', error);
            // Don't crash the app, just log the error
            return;
          }
          if (chat && !error) {
            console.log('Chat loaded successfully:', chat.id);
            // React Query will handle the cache update automatically
          } else {
            console.error('Error loading specific chat:', error);
          }
        } catch (error) {
          console.error('Error in loadSpecificChat:', error);
        }
      }
    };

    loadSpecificChat();
  }, [selectedChatId, selectedConversation, account?.id, isHydrated, chatService]);

  // Note: loadConversations is called by ChatLayout, not here
  // Removed duplicate call to prevent parallel loads

  // Handle keyboard behavior on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      // Prevent the page from sliding up when keyboard appears
      const preventPageSlide = () => {
        // Lock the body in place
        document.body.style.position = 'fixed';
        document.body.style.top = '0';
        document.body.style.left = '0';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.overflow = 'hidden';
      };

      // Restore normal behavior when keyboard hides
      const restorePageSlide = () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
      };

      // Listen for focus events on input elements
      const handleInputFocus = () => {
        preventPageSlide();
      };

      const handleInputBlur = () => {
        // Delay to ensure keyboard is fully hidden
        setTimeout(restorePageSlide, 300);
      };

      // Add event listeners to all input elements
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', handleInputFocus);
        input.addEventListener('blur', handleInputBlur);
      });

      // Cleanup
      return () => {
        inputs.forEach(input => {
          input.removeEventListener('focus', handleInputFocus);
          input.removeEventListener('blur', handleInputBlur);
        });
      };
    }
  }, []);

  // Add another effect to log when chats change
  useEffect(() => {
    console.log('MessagesPage: chats changed:', chats);
  }, [chats]);


  // Modal handlers
  const handleNewMessageComplete = (chatId: string) => {
    setShowNewMessageModal(false);
    setShowGroupSetupModal(false);
    // Navigate to the main chat page (desktop layout)
    // ChatLayout will refresh chats via its own effect
    router.push(`/chat?chat=${chatId}`);
  };

  const handleNewMessageClose = () => {
    setShowNewMessageModal(false);
    setShowGroupSetupModal(false);
  };

  const handleNewMessageClick = () => {
    // On mobile, show slide-up modal instead of full page modal
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (isMobile) {
      setShowNewChatSlideModal(true);
      setGroupChatFlowStep('new-chat');
    } else {
    setShowNewMessageModal(true);
    }
  };

  // Handle contact selection from slide modal
  const handleContactSelect = async (contactId: string) => {
    if (!chatService || !account?.id) return;

    try {
      // Close modal first
      setShowNewChatSlideModal(false);
      
      // Create or find direct chat (createDirectChat now returns existing chat if found)
      const { chat, error } = await chatService.createDirectChat(contactId);
      
      if (error) {
        console.error('Error creating/finding direct chat:', error);
        console.error('Error details:', {
          message: error.message,
          code: (error as any).code,
          details: (error as any).details
        });
        alert('Failed to open chat. Please try again.');
        return;
      }
      
      if (!chat) {
        console.error('No chat returned from createDirectChat');
        alert('Failed to open chat. Please try again.');
        return;
      }
      
      // Navigate to the individual chat page
      console.log('Navigating to chat:', chat.id);
      router.push(`/chat/individual?chat=${chat.id}`);
    } catch (error) {
      console.error('Error creating/finding direct chat:', error);
      alert('Failed to open chat. Please try again.');
    }
  };


  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getLastMessage = (conversation: Conversation) => {
    // Use last_message string if available (new format)
    if (conversation.last_message && typeof conversation.last_message === 'string') {
      if (conversation.last_message.trim()) {
        return conversation.last_message;
      }
    }
    
    // Fallback to messages array (old format)
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      
      // Check if message has attachments
      if (lastMessage.attachments && lastMessage.attachments.length > 0) {
        const attachment = lastMessage.attachments[0];
        const mediaType = attachment.file_type === 'video' ? 'video' : 'photo';
        const mediaIcon = attachment.file_type === 'video' ? '🎥' : '📷';
        
        // For group chats, include sender name
        if (conversation.isGroup && lastMessage.senderName) {
          return `${lastMessage.senderName}: ${mediaIcon} ${mediaType}`;
        }
        
        return `${mediaIcon} ${mediaType}`;
      }
      
      // For text messages in group chats, include sender name
      if (conversation.isGroup && lastMessage.senderName && lastMessage.text) {
        return `${lastMessage.senderName}: ${lastMessage.text}`;
      }
      
      // If message has text, show it
      if (lastMessage.text && lastMessage.text.trim()) {
        return lastMessage.text;
      }
    }
    
    return "No messages yet";
  };

  // Helper component to render message with icon instead of emoji
  const MessageTextWithIcon = ({ text }: { text: string }) => {
    if (text.includes('📷')) {
      const parts = text.split('📷');
      return (
        <>
          {parts[0]}
          <ImageIcon size={16} strokeWidth={2.5} className="inline-block text-gray-500 align-middle" />
          {parts[1]}
        </>
      );
    }
    return <>{text}</>;
  };

  const getLastMessageTime = (conversation: Conversation) => {
    // Use last_message_at if available (new format)
    if (conversation.last_message_at) {
      return formatTime(conversation.last_message_at);
    }
    
    // Fallback to messages array (old format)
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      return lastMessage.createdAt ? formatTime(lastMessage.createdAt) : "";
    }
    
    return "";
  };

  // Mobile category filtering
  const getMobileFilteredConversations = () => {
    if (!conversations || !Array.isArray(conversations)) {
      console.warn('⚠️ getMobileFilteredConversations: conversations is not an array:', conversations);
      return [];
    }
    const filtered = conversations.filter(conv => 
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (mobileActiveCategory) {
      case "unread":
        return filtered.filter(conv => conv.unreadCount > 0);
      case "dm":
        return filtered.filter(conv => !conv.isGroup);
      case "group":
        return filtered.filter(conv => conv.isGroup && !conv.isEventChat);
      case "events":
        return filtered.filter(conv => conv.isEventChat);
      default:
        return filtered;
    }
  };

  const filteredMobileConversations = getMobileFilteredConversations();

  // Mobile category counts
  const getMobileCategoryCounts = () => {
    const unreadCount = conversations.filter(conv => conv.unreadCount > 0).length;
    const dmCount = conversations.filter(conv => !conv.isGroup).length;
    const groupCount = conversations.filter(conv => conv.isGroup && !conv.isEventChat).length;
    const eventsCount = conversations.filter(conv => conv.isEventChat).length;
    
    return { unreadCount, dmCount, groupCount, eventsCount };
  };

  const { unreadCount: mobileUnreadCount, dmCount: mobileDmCount, groupCount: mobileGroupCount, eventsCount: mobileEventsCount } = getMobileCategoryCounts();

  const mobileCategoriesTop = [
    { id: "all", label: "All", count: null },
    ...(mobileUnreadCount > 0 ? [{ id: "unread", label: "Unread", count: mobileUnreadCount }] : []),
  ];

  const mobileCategoriesBottom = [
    { id: "dm", label: "DM", count: mobileDmCount },
    { id: "group", label: "Groups", count: mobileGroupCount },
    ...(mobileEventsCount > 0 ? [{ id: "events", label: "Events", count: mobileEventsCount }] : []),
  ];

  // Force hydration immediately to prevent loading state issues
  useEffect(() => {
    if (!isHydrated) {
      useAppStore.setState({ isHydrated: true });
    }
  }, [isHydrated]);

  // Handle opening new chat modal when returning from connections
  const [skipSlideUpAnimation, setSkipSlideUpAnimation] = useState(false);
  
  useEffect(() => {
    if (openNewChat === 'true' && account && chatService) {
      // Check if we're returning from add person page (not a fresh open)
      if (typeof window !== 'undefined') {
        const returnToNewChat = sessionStorage.getItem('returnToNewChat');
        // Skip animation if we're returning (flag will be cleared by the menu page, but we check it here)
        setSkipSlideUpAnimation(returnToNewChat === 'true');
        // Clear the flag after checking
        sessionStorage.removeItem('returnToNewChat');
      }
      // Remove the query parameter from URL
      router.replace('/chat');
      // Open the new chat modal
      setShowNewChatSlideModal(true);
      setGroupChatFlowStep('new-chat');
    } else {
      // Reset skip animation flag when opening normally
      setSkipSlideUpAnimation(false);
    }
  }, [openNewChat, account, chatService, router]);



  // Show chat content if authenticated
  return (
    <ProtectedRoute title="Chats" description="Log in / sign up to view your chats and messages" buttonText="Log in">
        {/* Desktop Layout */}
        <div className="hidden sm:block h-screen overflow-hidden" style={{ maxHeight: '100vh' }}>
          <ChatLayout />
        </div>

        {/* Mobile Layout - Connect design system */}
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
          <MobilePage>
            <PageHeader
              title="Chats"
              customBackButton={
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '100px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    padding: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  aria-label="Switch account"
                >
                <div className="w-[36px] h-[36px] rounded-full overflow-hidden">
                  <Avatar 
                    src={account?.profile_pic} 
                    name={account?.name || ""} 
                    size={36} 
                  />
                </div>
                </button>
              }
              customActions={
            <div
                  className="flex items-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                    width: '88px', // Double the normal button width (44px * 2)
                    height: '44px',
                      borderRadius: '100px',
                    background: 'rgba(255, 255, 255, 0.96)',
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow',
                    overflow: 'hidden',
                    cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                >
                  {/* Search Icon - Left Side */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSearchOpen(true);
                    }}
                    className="flex items-center justify-center flex-1 h-full"
                  >
                    <SearchIcon size={20} className="text-gray-900" style={{ strokeWidth: 2.5 }} />
                  </button>
                  {/* Plus Icon - Right Side */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNewMessageClick();
                    }}
                    className="flex items-center justify-center flex-1 h-full"
                  >
                    <Plus size={20} className="text-gray-900" strokeWidth={2.5} />
                  </button>
                </div>
              }
            />

            <div
              className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide"
              style={{
                paddingTop: 'var(--saved-content-padding-top, 140px)',
                paddingBottom: 'max(env(safe-area-inset-bottom), 120px)', // Ensure cards rest above bottom nav (96px nav + 24px spacing)
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
                    }}
            >
              {/* Top Spacing */}
              <div style={{ height: '12px' }} />

                {/* Category Pills */}
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 -mx-1" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
                    {[...mobileCategoriesTop, ...mobileCategoriesBottom].map((category) => {
                      const isActive = mobileActiveCategory === category.id;
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
                            onClick={() => setMobileActiveCategory(category.id)}
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
                </div>

                {/* Chat List */}
                <div className="space-y-2">
                  {filteredMobileConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                      <p className="text-gray-500 text-lg">
                        {account?.id ? "No chats yet" : "Please log in to see your chats"}
                      </p>
                      <BearEmoji size="6xl" />
                    </div>
                  ) : (
                    filteredMobileConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/chat?chat=${conversation.id}`);
                        }}
                        className="p-4 rounded-2xl cursor-pointer transition-all duration-200 bg-white"
                        style={{
                          borderWidth: '0.4px',
                          borderColor: selectedChatId === conversation.id ? '#D1D5DB' : '#E5E7EB',
                          borderStyle: 'solid',
                          boxShadow: selectedChatId === conversation.id
                            ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                            : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          willChange: 'transform, box-shadow'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = selectedChatId === conversation.id
                            ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                            : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          {conversation.isEventChat && eventListings.has(conversation.id) ? (
                            // Event chat: squared image
                            <div 
                              className="w-12 h-12 bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 rounded-md"
                              style={{
                                borderWidth: '0.5px',
                                borderStyle: 'solid',
                                borderColor: 'rgba(0, 0, 0, 0.08)'
                              }}
                            >
                              {eventListings.get(conversation.id)?.photo_urls && eventListings.get(conversation.id)!.photo_urls!.length > 0 ? (
                                <Image
                                  src={eventListings.get(conversation.id)!.photo_urls![0]}
                                  alt={eventListings.get(conversation.id)!.title}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-gray-400 text-sm font-semibold">
                                  {eventListings.get(conversation.id)?.title.charAt(0).toUpperCase() || 'E'}
                                </div>
                              )}
                            </div>
                          ) : (
                            // Regular chat: circular avatar
                            <Avatar
                              src={conversation.avatarUrl}
                              name={conversation.title}
                              size={48}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {conversation.isEventChat && eventListings.has(conversation.id)
                                  ? eventListings.get(conversation.id)!.title
                                  : conversation.title}
                              </h3>
                              <div className="relative flex-shrink-0">
                                <span 
                                  className={`text-xs ${conversation.unreadCount > 0 ? 'text-orange-500' : 'text-gray-500'}`}
                                >
                                  {getLastMessageTime(conversation)}
                                </span>
                                {conversation.unreadCount > 0 && (
                                  <div 
                                    className="absolute right-0 top-full mt-0.5 rounded-full flex items-center justify-center"
                                    style={{ 
                                      backgroundColor: '#F97316',
                                      width: '20px',
                                      height: '20px',
                                      minWidth: '20px'
                                    }}
                                  >
                                    <span className="text-xs text-white font-medium leading-none">
                                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 truncate mt-1 flex items-center gap-1">
                              <MessageTextWithIcon text={getLastMessage(conversation) || 'No messages yet'} />
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
              </div>
            </div>
          </MobilePage>
        </div>

        {/* Modals */}
        <NewMessageModal
          isOpen={showNewMessageModal}
          onClose={handleNewMessageClose}
          onComplete={handleNewMessageComplete}
          onShowGroupSetup={() => setShowGroupSetupModal(true)}
        />
        <GroupSetupModal
          isOpen={showGroupSetupModal}
          onClose={handleNewMessageClose}
          onComplete={handleNewMessageComplete}
        />
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          name={account?.name || "User"}
          avatarUrl={account?.profile_pic}
          onViewProfile={() => router.push(`/profile?id=${account?.id}&from=${encodeURIComponent(pathname)}`)}
          onShareProfile={() => router.push(`/menu?view=share-profile&from=${encodeURIComponent(pathname)}`)}
          onAddBusiness={() => router.push('/create-business')}
        />

        {/* Search Modal */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          conversations={conversations}
        />

        {/* Group Chat Flow - Horizontal Sliding Container */}
        {showNewChatSlideModal && (
          <GroupChatFlowContainer
            currentStep={groupChatFlowStep}
            selectedMemberIds={selectedGroupMemberIds}
            onClose={() => {
              setShowNewChatSlideModal(false);
              setGroupChatFlowStep('new-chat');
              setSelectedGroupMemberIds([]);
              setSkipSlideUpAnimation(false); // Reset animation flag on close
            }}
            onSelectContact={handleContactSelect}
            onStepChange={(step) => setGroupChatFlowStep(step)}
            onSelectedMembersChange={(ids) => setSelectedGroupMemberIds(ids)}
            skipSlideUpAnimation={skipSlideUpAnimation}
          />
        )}
    </ProtectedRoute>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}
