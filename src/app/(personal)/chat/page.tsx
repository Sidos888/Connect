"use client";

import React, { useEffect, useState, useMemo, Suspense, useRef } from "react";
import Avatar from "@/components/Avatar";
import { useAppStore } from "@/lib/store";
import type { Conversation } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ChatLayout from "./ChatLayout";
import PersonalChatPanel from "./PersonalChatPanel";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { useChats, useMarkInboxAsViewed } from "@/lib/chatQueries";
import { useModal } from "@/lib/modalContext";
import HappeningNowBanner from "@/components/HappeningNowBanner";
import { useHappeningNow } from "@/hooks/useHappeningNow";
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
import Loading8 from "@/components/Loading8";

function MessagesPageContent() {
  const { isHydrated } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const hasActiveEvents = useHappeningNow();
  const { account, user } = useAuth();
  const chatService = useChatService();
  const { showAddFriend } = useModal();
  const searchParams = useSearchParams();
  const selectedChatId = searchParams.get("chat");
  const openNewChat = searchParams.get("openNewChat");
  
  // Use React Query to fetch chats
  const { data: chats = [], isLoading, error, refetch: refetchChats } = useChats(chatService, user?.id || null);
  
  // Log when chats data changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔵 ChatPage: Chats data updated', {
        chatsCount: chats.length,
        unreadCounts: chats.map(c => ({ id: c.id, unread_count: c.unread_count }))
      });
    }
  }, [chats]);
  
  // Refetch chats when navigating back from individual chat page
  useEffect(() => {
    // When pathname is /chat/ and there's no selectedChatId, we're on the main chat list
    // This means we navigated back from an individual chat
    if (pathname === '/chat' && !selectedChatId && user?.id) {
      console.log('🔵 ChatPage: Navigated back to chat list, forcing refetch of chats');
      // Force refetch even if data is still fresh (bypasses staleTime)
      refetchChats().then(() => {
        console.log('🔵 ChatPage: Refetch completed after navigation');
      }).catch((error) => {
        console.error('🔵 ChatPage: Refetch error after navigation', error);
      });
    }
  }, [pathname, selectedChatId, user?.id, refetchChats]);
  
  // Mark inbox as viewed when page loads (removes badge from chats icon)
  const markInboxAsViewed = useMarkInboxAsViewed(chatService);
  useEffect(() => {
    if (user?.id && chatService) {
      markInboxAsViewed.mutate(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only run once when page loads (chatService is stable)
  
  // Typing indicator state - must be declared before useMemo that uses it
  const [typingUsersByChat, setTypingUsersByChat] = useState<Map<string, string[]>>(new Map());
  const typingUnsubscribesRef = useRef<Map<string, () => void>>(new Map());
  
  // Load user's connections (friends) to filter direct chats
  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['connections', account?.id],
    queryFn: async () => {
      if (!account?.id) return [];
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
        const fullName = chat.last_message.sender_name || 'Unknown';
        // Extract first name only
        const senderName = fullName.split(' ')[0];
        const messageText = chat.last_message.message_text || '';
        const hasText = messageText.trim().length > 0;
        const messageType = chat.last_message.message_type;
        
        // Priority 1: Listing message
        if (messageType === 'listing') {
          if (isFromCurrentUser) {
            // You sent it: "Sent a listing"
            lastMessageText = 'Sent a listing';
          } else {
            // Someone else sent it: "Name: Sent a listing"
            lastMessageText = `${senderName}: Sent a listing`;
          }
        } else if (attachmentCount > 0 || (!hasText && messageType === 'image')) {
          // Priority 2: If message has attachments, show attachment count with icon
          const count = attachmentCount > 0 ? attachmentCount : 1; // Default to 1 if message_type is image but no count
          if (isFromCurrentUser) {
            // You sent it: "3 📷 Attachments"
            lastMessageText = `${count} 📷 Attachment${count > 1 ? 's' : ''}`;
          } else {
            // Someone else sent it: "John 3 📷 Attachments"
            lastMessageText = `${senderName} ${count} 📷 Attachment${count > 1 ? 's' : ''}`;
          }
        } else if (hasText) {
          // Priority 3: Regular text message
          if (isFromCurrentUser) {
            // You sent it: just show the message
            lastMessageText = messageText;
          } else {
            // Someone else sent it: "John: Hello whats up?"
            lastMessageText = `${senderName}: ${messageText}`;
          }
        } else if (messageType === 'image') {
          // Priority 4: Legacy image message (no attachment_count)
          if (isFromCurrentUser) {
          lastMessageText = '📷 Image';
          } else {
            lastMessageText = `${senderName} 📷 Image`;
        }
        }
        // If none of the above, lastMessageText remains 'No messages yet'
      }
      
      // Check if someone is typing - override last message
      const typingUserIds = typingUsersByChat.get(chat.id) || [];
      
      let displayMessage = lastMessageText;
      if (typingUserIds.length > 0) {
        // Find typing user name from chat participants
        // Match by user_id only (this is the account ID that matches typingUserIds)
        const typingUser = chat.participants?.find((p: any) => {
          return p.user_id && typingUserIds.includes(p.user_id);
        });
        
        if (typingUser) {
          const fullName = typingUser.user_name || typingUser.name || (chat.type === 'direct' ? chat.title : 'Someone');
          // Extract first name only
          const typingUserName = fullName.split(' ')[0];
          displayMessage = `${typingUserName} is typing...`;
        } else {
          // Still show typing indicator even if we can't find the name
          displayMessage = 'Someone is typing...';
        }
      }
      
      return {
        id: chat.id,
        title,
        avatarUrl,
        isGroup: chat.type === 'group',
        isEventChat: chat.is_event_chat || false,
        unreadCount: chat.unread_count || 0,
        last_message: displayMessage,
        last_message_at: chat.last_message_at,
        messages: []
      };
    });
  }, [chats, account?.id, friendIds, typingUsersByChat]);
  
  // Event listing data for event chats - using React Query for caching
  // Optimized: Batch query all event listings at once instead of Promise.all (much faster!)
  const eventChatIds = conversations.filter(conv => conv.isEventChat).map(conv => conv.id);
  
  const { data: eventListingsArray = [], isLoading: isLoadingEventListings } = useQuery({
    queryKey: ['event-listings', eventChatIds.sort().join(',')],
    queryFn: async () => {
      const eventChats = conversations.filter(conv => conv.isEventChat);
      if (eventChats.length === 0) return [];
      
      const supabase = getSupabaseClient();
      if (!supabase) return [];
      
      // Optimized: Batch query all event listings in a single query instead of Promise.all
      // This is much faster - one database round trip instead of N round trips
      const chatIds = eventChats.map(conv => conv.id);
      
          try {
        const { data: listings, error } = await supabase
              .from('listings')
              .select('id, title, start_date, end_date, photo_urls, event_chat_id')
          .in('event_chat_id', chatIds);
        
        if (error) {
          console.error('Error fetching event listings:', error);
          return [];
        }
        
        // Map listings to chat IDs for easy lookup
        const listingMap = new Map<string, {
          chatId: string;
          listing: {
            id: string;
            title: string;
            start_date: string | null;
            end_date: string | null;
            photo_urls: string[] | null;
          };
        }>();
        
        listings?.forEach(listing => {
          if (listing.event_chat_id) {
            listingMap.set(listing.event_chat_id, {
              chatId: listing.event_chat_id,
                listing: {
                  id: listing.id,
                  title: listing.title,
                  start_date: listing.start_date,
                  end_date: listing.end_date,
                  photo_urls: listing.photo_urls || null
                }
            });
            }
        });
        
        // Return in the same order as eventChats (for consistency)
        return eventChats.map(conv => listingMap.get(conv.id)).filter(Boolean) as Array<{
        chatId: string;
        listing: {
          id: string;
          title: string;
          start_date: string | null;
          end_date: string | null;
          photo_urls: string[] | null;
        };
      }>;
      } catch (err) {
        console.error('Error fetching event listings:', err);
        return [];
      }
    },
    enabled: eventChatIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
  
  // Convert array to Map for easy lookup
  const eventListings = useMemo(() => {
    const map = new Map<string, {
      id: string;
      title: string;
      start_date: string | null;
      end_date: string | null;
      photo_urls: string[] | null;
    }>();
    
    eventListingsArray.forEach(item => {
      map.set(item.chatId, item.listing);
    });
    
    return map;
  }, [eventListingsArray]);

  // Subscribe to typing indicators for all conversations
  useEffect(() => {
    if (!chatService || !account?.id) {
      return;
    }

    // Subscribe to typing indicators for each conversation
    chats.forEach((chat) => {
      // Skip if already subscribed
      if (typingUnsubscribesRef.current.has(chat.id)) {
        return;
      }

      const unsubscribe = chatService.subscribeToTyping(chat.id, (userIds) => {
        setTypingUsersByChat((prev) => {
          const newMap = new Map(prev);
          // Filter out current user from typing users
          const filteredUserIds = userIds.filter(id => id !== account.id);
          
          if (filteredUserIds.length > 0) {
            newMap.set(chat.id, filteredUserIds);
          } else {
            newMap.delete(chat.id);
          }
          return newMap;
        });
      });

      typingUnsubscribesRef.current.set(chat.id, unsubscribe);
    });

    // Cleanup: unsubscribe from conversations that no longer exist
    const currentChatIds = new Set(chats.map((c) => c.id));
    typingUnsubscribesRef.current.forEach((unsubscribe, chatId) => {
      if (!currentChatIds.has(chatId)) {
        unsubscribe();
        typingUnsubscribesRef.current.delete(chatId);
      }
    });

    return () => {
      // Cleanup on unmount
      typingUnsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
      typingUnsubscribesRef.current.clear();
    };
  }, [chats, chatService, account?.id]);
  
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
    // On mobile, navigate to new chat page instead of modal
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (isMobile) {
      router.push('/chat/new');
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
        
        // For group chats, include sender name (first name only)
        if (conversation.isGroup && lastMessage.senderName) {
          const firstName = lastMessage.senderName.split(' ')[0];
          return `${firstName}: ${mediaIcon} ${mediaType}`;
        }
        
        return `${mediaIcon} ${mediaType}`;
      }
      
      // For text messages in group chats, include sender name (first name only)
      if (conversation.isGroup && lastMessage.senderName && lastMessage.text) {
        const firstName = lastMessage.senderName.split(' ')[0];
        return `${firstName}: ${lastMessage.text}`;
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
    ...(mobileDmCount > 0 ? [{ id: "dm", label: "DM", count: mobileDmCount }] : []),
    ...(mobileGroupCount > 0 ? [{ id: "group", label: "Groups", count: mobileGroupCount }] : []),
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
                  onClick={async () => {
                    // Trigger haptic feedback
                    try {
                      await Haptics.impact({ style: ImpactStyle.Light });
                    } catch (error) {
                      // Haptics not available (web environment), silently fail
                    }
                    setShowProfileModal(true);
                  }}
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
                // Always use larger padding initially to prevent jump, then adjust once we know
                paddingBottom: hasActiveEvents === false
                  ? 'max(env(safe-area-inset-bottom), 120px)' // Without banner: 96px nav + 24px spacing
                  : 'max(env(safe-area-inset-bottom), 194px)', // With banner or loading: 96px nav + 12px gap + 62px banner + 24px spacing
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                position: 'relative'
              }}
            >
              {/* Top Spacing */}
              <div style={{ height: '12px' }} />

                {/* Category Pills - Only show after data loads */}
              {!isLoading && (
                <div className="mb-6" style={{ marginLeft: '-16px', marginRight: '-16px' }}>
                <div className="flex items-center gap-2">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ paddingTop: '2px', paddingBottom: '2px', paddingLeft: '20px', paddingRight: '20px' }}>
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
              )}

                {/* Chat List */}
                {isLoading || isLoadingConnections ? (
                  <div className="flex items-center justify-center" style={{ 
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '100vh',
                    paddingTop: '80px',
                    zIndex: 10
                  }}>
                    <Loading8 />
                  </div>
                ) : filteredMobileConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 280px)' }}>
                      <p className="text-gray-500 text-lg">
                        {account?.id ? "No chats yet" : "Please log in to see your chats"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredMobileConversations.map((conversation) => (
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
                          {conversation.isEventChat ? (
                            // Event chat: squared image (shows immediately based on isEventChat flag)
                            <div 
                              className="w-12 h-12 bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 rounded-md"
                              style={{
                                borderWidth: '0.5px',
                                borderStyle: 'solid',
                                borderColor: 'rgba(0, 0, 0, 0.08)'
                              }}
                            >
                              {eventListings.get(conversation.id)?.photo_urls && eventListings.get(conversation.id)!.photo_urls!.length > 0 && (
                                <Image
                                  src={eventListings.get(conversation.id)!.photo_urls![0]}
                                  alt={eventListings.get(conversation.id)!.title}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
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
                                  className="text-xs text-gray-500"
                                >
                                  {getLastMessageTime(conversation)}
                                </span>
                                {conversation.unreadCount > 0 && (
                                  <div 
                                    className="absolute right-0 top-full mt-0.5 rounded-full flex items-center justify-center"
                                    style={{ 
                                      backgroundColor: '#EF4444', // red-500
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
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <span
                                style={{
                                  maxWidth: 'calc(100% - 60px)', // Cut off about 60px before right edge
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block',
                                  minWidth: 0 // Allow flex child to shrink
                                }}
                              >
                              <MessageTextWithIcon text={conversation.last_message || 'No messages yet'} />
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                  )}
              </div>
          </MobilePage>
        </div>

        {/* Happening Now Banner - Outside layout wrapper for proper fixed positioning */}
        <HappeningNowBanner />

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
          onShareProfile={() => {
            // Navigate to QR code page with current URL as 'from' parameter
            const currentUrl = typeof window !== 'undefined' 
              ? `${window.location.pathname}${window.location.search}`
              : '/chat';
            const fromParam = `?from=${encodeURIComponent(currentUrl)}`;
            router.push(`/qr-code${fromParam}`);
          }}
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
        <Loading8 />
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}
