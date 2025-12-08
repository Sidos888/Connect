"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { useAppStore } from "@/lib/store";
import { useChatById, useMarkMessagesAsRead } from "@/lib/chatQueries";
import { ArrowLeft, X } from "lucide-react";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageActionModal from "@/components/chat/MessageActionModal";
import MediaUploadButton, { UploadedMedia } from "@/components/chat/MediaUploadButton";
import MediaPreview from "@/components/chat/MediaPreview";
import ChatPhotoViewer from "@/components/chat/ChatPhotoViewer";
import ChatPhotosGridModal from "@/components/chat/ChatPhotosGridModal";
import ProfileModal from "@/components/chat/ProfileModal";
import LoadingMessageCard from "@/components/chat/LoadingMessageCard";
import MessageReactionCard from "@/components/chat/MessageReactionCard";
import MessageActionCard from "@/components/chat/MessageActionCard";
import ReactionsModal from "@/components/chat/ReactionsModal";
import type { SimpleMessage, MediaAttachment } from "@/lib/types";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Avatar from "@/components/Avatar";
import Loading8 from "@/components/Loading8";

export default function IndividualChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chat');
  const { account } = useAuth();
  const chatService = useChatService();
  // Use React Query hook to fetch chat data (with caching)
  const { data: chat, isLoading: isLoadingChat, error: chatError } = useChatById(chatService, chatId);
  // Removed old store methods - using chatService directly
  type Participant = { id: string; name: string; profile_pic?: string | null };
  type ConversationLite = { id: string; title: string; avatarUrl: string | null; isGroup: boolean };
  type ChatMessage = { id: string; text: string; sender_id: string };

  const [conversation, setConversation] = useState<ConversationLite | null>(null);
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const hasMarkedAsRead = useRef(false);
  const [selectedMessage, setSelectedMessage] = useState<SimpleMessage | null>(null);
  const [selectedMessageElement, setSelectedMessageElement] = useState<HTMLElement | null>(null);
  const [longPressedMessage, setLongPressedMessage] = useState<SimpleMessage | null>(null);
  const [longPressedElement, setLongPressedElement] = useState<HTMLElement | null>(null);
  const [longPressedPosition, setLongPressedPosition] = useState<{ top: number; left: number; right: number; bottom: number; width: number; isOwnMessage: boolean } | null>(null);
  const longPressContainerRef = useRef<HTMLDivElement>(null);
  const actionCardRef = useRef<HTMLDivElement>(null);
  const emojiCardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const chatInputRef = useRef<HTMLDivElement | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<SimpleMessage | null>(null);
  const [replyingMessageElement, setReplyingMessageElement] = useState<HTMLElement | null>(null);
  const [pendingMedia, setPendingMedia] = useState<UploadedMedia[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, { status: 'uploading' | 'uploaded' | 'failed'; fileCount: number }>>(new Map());
  const isSendingRef = useRef(false);
  const unsubscribeReactionsRef = useRef<(() => void) | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIndicatorRef = useRef<HTMLDivElement>(null);
  const [typingAnimationPhase, setTypingAnimationPhase] = useState(0);
  const [deleteConfirmationMessageId, setDeleteConfirmationMessageId] = useState<string | null>(null);
  const isUpdatingReactionsRef = useRef(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [reactionsModalMessageId, setReactionsModalMessageId] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Get current auth user ID
  useEffect(() => {
    const getCurrentUserId = async () => {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      }
    };
    getCurrentUserId();
  }, []);

  // FIX: Set body background to transparent to prevent white overlay
  useEffect(() => {
    // Store original background
    const originalBackground = document.body.style.background;
    const originalBackgroundColor = document.body.style.backgroundColor;
    
    // Set body background to transparent
    document.body.style.background = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    
    // Cleanup: restore original background on unmount
    return () => {
      document.body.style.background = originalBackground;
      document.body.style.backgroundColor = originalBackgroundColor;
    };
  }, []);
  
  // Media viewer states
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [viewerMedia, setViewerMedia] = useState<MediaAttachment[]>([]); // Only media from clicked message
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(0); // Index of selected media in viewer
  const [allChatMedia, setAllChatMedia] = useState<MediaAttachment[]>([]); // All chat media (for future use)
  
  // Grid modal state
  const [showGridModal, setShowGridModal] = useState(false);
  const [gridModalAttachments, setGridModalAttachments] = useState<MediaAttachment[]>([]);
  
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null);
  const [eventListing, setEventListing] = useState<{
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    photo_urls: string[] | null;
  } | null>(null);
  const [isEventChatFromDB, setIsEventChatFromDB] = useState(false);

  const isEventChat = !!eventListing || isEventChatFromDB;

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

  // Simple mobile optimization - prevent body scroll
  useEffect(() => {
    // Prevent body scroll on mobile chat but allow chat container to scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    };
  }, []);

  // Load conversation and messages when chat data is available
  useEffect(() => {
    const loadData = async () => {
      if (!account?.id || !chatId) {
        setError('User not authenticated or chat ID missing');
        setLoading(false);
        return;
      }

      // Wait for chat data from React Query hook
      if (isLoadingChat) {
        return; // Still loading, wait
      }

      if (chatError || !chat) {
        setError('Conversation not found');
        setLoading(false);
        return;
      }

      if (!chatService) {
        console.error('IndividualChatPage: ChatService not available');
        setError('Chat service not available');
        setLoading(false);
        return;
      }

      try {
        // Store whether this is an event chat from the database
        setIsEventChatFromDB(chat.is_event_chat || false);

        // Store participants for profile modal
        setParticipants(chat.participants || []);

        // Convert to conversation format
        const otherParticipant = chat.participants.find((p: Participant) => p.id !== account.id);
        const conversation = {
          id: chat.id,
          title: chat.type === 'direct' 
            ? (otherParticipant?.name || 'Unknown User')
            : (chat.name || 'Group Chat'),
          avatarUrl: chat.type === 'direct' 
            ? (otherParticipant?.profile_pic || null)
            : (chat.photo || null),
          isGroup: chat.type === 'group'
        };

        console.log('Individual chat page: Chat data loaded (from cache or DB):', chat);
        console.log('Individual chat page: Conversation avatarUrl:', conversation.avatarUrl);
        console.log('Individual chat page: Conversation isGroup:', conversation.isGroup);
        setConversation(conversation);

        // Load messages
        if (chatService) {
          const { messages: chatMessages, error: messagesError } = await chatService.getChatMessages(chatId, 50, 0);
          if (!messagesError && chatMessages) {
            setMessages(chatMessages);
          } else if (messagesError) {
            console.error('Error loading messages:', messagesError);
          }
        }

        // Load event listing linked to this chat (event-specific chats)
        try {
          const supabase = getSupabaseClient();
          if (!supabase) {
            console.error('Supabase client not available when loading event listing');
          } else {
            const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('id, title, start_date, end_date, photo_urls, event_chat_id')
            .eq('event_chat_id', chatId)
            .maybeSingle();

            if (listingError) {
              console.error('Error loading event listing for chat:', listingError);
            } else {
              if (listing) {
                console.log('Individual chat page: Event listing loaded for chat:', listing);
                setEventListing({
                  id: listing.id,
                  title: listing.title,
                  start_date: listing.start_date,
                  end_date: listing.end_date,
                  photo_urls: listing.photo_urls || null
                });
              } else {
                setEventListing(null);
              }
            }
          }
        } catch (listingErr) {
          console.error('Unexpected error loading event listing for chat:', listingErr);
        }

        // Load all chat media for the viewer
        if (chatService) {
          try {
            const { media, error: mediaError } = await chatService.getChatMedia(chatId);
            if (!mediaError && media) {
              setAllChatMedia(media);
            }
          } catch (error) {
            console.error('Failed to load chat media:', error);
            // Don't fail the entire chat load if media loading fails
          }
        }

        setLoading(false);

        // Subscribe to real-time reactions for this chat
        if (chatId && chatService && chat?.id) {
          const supabase = getSupabaseClient();
          if (supabase) {
            // Subscribe to all reactions - we'll filter by refreshing messages
            // This is simpler than trying to filter by message_id upfront
            const reactionsChannel = supabase
              .channel(`chat-reactions-${chatId}`)
              .on(
                'postgres_changes',
                {
                  event: '*', // Listen to INSERT, UPDATE, DELETE
                  schema: 'public',
                  table: 'message_reactions'
                },
                async (payload) => {
                  console.log('Reaction change received:', payload);
                  
                  // Set flag to prevent auto-scroll
                  isUpdatingReactionsRef.current = true;
                  
                  // Preserve scroll position before updating messages
                  const container = messagesContainerRef.current;
                  let scrollPosition: { top: number; height: number; wasAtBottom: boolean } | null = null;
                  
                  if (container) {
                    const maxScroll = container.scrollHeight - container.clientHeight;
                    const currentScroll = container.scrollTop;
                    const threshold = 100;
                    const wasAtBottom = (maxScroll - currentScroll) <= threshold;
                    
                    scrollPosition = {
                      top: container.scrollTop,
                      height: container.scrollHeight,
                      wasAtBottom
                    };
                  }
                  
                  // Refresh messages to get updated reactions
                  // We refresh all messages to ensure we have the latest reactions
                  const { messages: updatedMessages } = await chatService.getChatMessages(conversation.id);
                  if (updatedMessages) {
                    setMessages(updatedMessages);
                    
                    // Restore scroll position after messages update
                    if (scrollPosition && container) {
                      // Use requestAnimationFrame to wait for DOM update
                      requestAnimationFrame(() => {
                        if (scrollPosition!.wasAtBottom) {
                          // If user was at bottom, scroll to new bottom
                          const maxScroll = container.scrollHeight - container.clientHeight;
                          container.scrollTop = maxScroll;
                        } else {
                          // Otherwise, restore previous position
                          // Account for any change in scroll height
                          const heightDiff = container.scrollHeight - scrollPosition!.height;
                          container.scrollTop = scrollPosition!.top + heightDiff;
                        }
                      });
                    }
                  }
                }
              )
              .subscribe();

            // Store cleanup function in ref
            unsubscribeReactionsRef.current = () => {
              reactionsChannel.unsubscribe();
            };
          }
        }

        // Subscribe to real-time messages for this chat
        if (chatId && account?.id && chatService) {
          console.log('Individual chat page: Subscribing to real-time messages for chat:', chatId);
          const unsubscribeMessages = chatService.subscribeToChat(
            chatId,
            (newMessage: SimpleMessage) => {
              console.log('Individual chat page: New message received:', newMessage);
              console.log('Individual chat page: Message attachments:', newMessage.attachments);
              setMessages(prev => {
                // Check if message already exists to avoid duplicates
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) {
                  console.log('Individual chat page: Message already exists, skipping');
                  return prev;
                }
                
                // Also filter out any optimistic messages with the same content/timestamp
                // to prevent showing both optimistic and real message
                const withoutOptimistic = prev.filter(msg => {
                  if (msg.id.startsWith('optimistic_')) {
                    // Remove optimistic message if real message is arriving
                    return false;
                  }
                  return true;
                });
                
                console.log('Individual chat page: Adding new message to list');
                return [...withoutOptimistic, newMessage];
              });
            }
          );
          
          // Store the unsubscribe function in ref for cleanup
          unsubscribeMessagesRef.current = unsubscribeMessages;
        }

        // Subscribe to typing indicators
        if (chatService && conversation.id) {
          const unsubscribeTyping = chatService.subscribeToTyping(conversation.id, (userIds) => {
            setTypingUsers(userIds);
          });
          
          // Store cleanup function (will be called in useEffect cleanup)
          return () => {
            unsubscribeTyping();
          };
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load conversation');
        setLoading(false);
      }
    };

    loadData();

    // Cleanup function
    return () => {
      if (unsubscribeReactionsRef.current) {
        unsubscribeReactionsRef.current();
        unsubscribeReactionsRef.current = null;
      }
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
        unsubscribeMessagesRef.current = null;
      }
    };
  }, [account?.id, chatId, chatService, chat, isLoadingChat, chatError]);

  // Track if we've scrolled to bottom on initial load
  const hasScrolledToBottomRef = useRef(false);

  // Scroll to bottom when messages change or when loading completes
  useEffect(() => {
    // Skip auto-scroll if we're just updating reactions (preserve scroll position)
    if (isUpdatingReactionsRef.current) {
      isUpdatingReactionsRef.current = false; // Reset flag
      return;
    }
    
    if (messages.length > 0 && !loading) {
      // Use multiple attempts to ensure scroll happens after DOM is fully rendered
      const scrollToBottom = (force = false) => {
          if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          // Force scroll to absolute bottom
          const maxScroll = container.scrollHeight - container.clientHeight;
          container.scrollTop = maxScroll;
          
          // Verify we're at the bottom (with small tolerance for rounding)
          const isAtBottom = Math.abs(container.scrollTop - maxScroll) < 1;
          if (isAtBottom || force) {
            hasScrolledToBottomRef.current = true;
          }
          } else if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end', inline: 'nearest' });
          hasScrolledToBottomRef.current = true;
          }
      };

      // First attempt - immediate
      scrollToBottom();
      
      // Second attempt - after a short delay (for initial load)
      requestAnimationFrame(() => {
        setTimeout(() => scrollToBottom(true), 50);
      });
      
      // Third attempt - after longer delay (for slow renders)
      setTimeout(() => scrollToBottom(true), 200);
      
      // Fourth attempt - after even longer delay (for very slow renders/images)
      setTimeout(() => scrollToBottom(true), 500);
    }
  }, [messages, loading]);

  // Helper function to check if user is at/near the bottom of the chat
  const isAtBottom = useCallback((threshold: number = 100): boolean => {
    if (!messagesContainerRef.current) return false;
    const container = messagesContainerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const currentScroll = container.scrollTop;
    // Check if within threshold pixels of the bottom
    return (maxScroll - currentScroll) <= threshold;
  }, []);

  // Scroll to show typing indicator when it appears - only if user is already at bottom
  useEffect(() => {
    if (typingUsers.length > 0 && messagesContainerRef.current) {
      // Check if user is at the bottom before scrolling
      if (!isAtBottom(100)) {
        // User has scrolled up - don't auto-scroll
        return;
      }

      const scrollToShowTypingIndicator = () => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          // Only scroll if user is still at bottom (they might have scrolled while this effect runs)
          if (!isAtBottom(100)) {
            return;
          }
          // Scroll to bottom to show typing indicator above the chat input
          // The paddingBottom on the container already accounts for the input height
          const maxScroll = container.scrollHeight - container.clientHeight;
          container.scrollTo({
            top: maxScroll,
            behavior: 'smooth'
          });
        }
      };

      // Only attempt to scroll if user is at bottom
      requestAnimationFrame(() => {
        setTimeout(() => scrollToShowTypingIndicator(), 50);
      });
      setTimeout(() => scrollToShowTypingIndicator(), 100);
      setTimeout(() => scrollToShowTypingIndicator(), 200);
    }
  }, [typingUsers, pendingMedia.length, isAtBottom]);

  // Animate typing dots - similar to PersonalChatPanel
  useEffect(() => {
    if (typingUsers.length === 0) return;
    
    const interval = setInterval(() => {
      setTypingAnimationPhase((prev) => (prev + 1) % 3);
    }, 500); // 500ms per dot phase
    
    return () => clearInterval(interval);
  }, [typingUsers.length]);

  // Ensure textarea autocapitalize is removed on mount and when conversation changes
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      // Remove autocapitalize immediately
      textarea.removeAttribute('autocapitalize');
      // Try to prevent React from re-applying it
      try {
        Object.defineProperty(textarea, 'autocapitalize', {
          value: undefined,
          writable: false,
          configurable: true
        });
      } catch (err) {
        // Ignore if already defined
      }
      console.log('💬 Chat textarea: Removed autocapitalize on mount/conversation change', {
        autocapitalize: textarea.getAttribute('autocapitalize'),
        hasAttribute: textarea.hasAttribute('autocapitalize')
      });
    }
  }, [conversation?.id]);

  // Force scroll to bottom when conversation changes (initial load)
  useEffect(() => {
    if (conversation?.id && !loading) {
      // Reset the flag when conversation changes
      hasScrolledToBottomRef.current = false;
      
      // Wait for messages to load, then scroll
      const scrollToBottom = () => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          // Calculate maximum scroll position
          const maxScroll = container.scrollHeight - container.clientHeight;
          // Set scroll to absolute maximum
          container.scrollTop = maxScroll;
          hasScrolledToBottomRef.current = true;
        } else if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end', inline: 'nearest' });
          hasScrolledToBottomRef.current = true;
        }
      };

      // Multiple attempts with increasing delays to ensure it works
      // Even if messages are already loaded
      if (messages.length > 0) {
        scrollToBottom();
      }
      
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottom();
          // Additional attempts for slow image loading
          setTimeout(scrollToBottom, 200);
          setTimeout(scrollToBottom, 500);
        }, 100);
      });
    }
  }, [conversation?.id, loading, messages.length]);

  // Mark messages as read when chat is loaded - using React Query mutation to invalidate cache
  const markMessagesAsRead = useMarkMessagesAsRead(chatService);
  useEffect(() => {
    console.log('🔵 IndividualChatPage: useEffect for markMessagesAsRead', {
      hasMarkedAsRead: hasMarkedAsRead.current,
      hasAccount: !!account?.id,
      hasChatId: !!chatId,
      hasConversation: !!conversation,
      hasChatService: !!chatService
    });
    
    if (!hasMarkedAsRead.current && account?.id && chatId && conversation && chatService) {
      console.log('🔵 IndividualChatPage: Calling markMessagesAsRead mutation', { chatId, userId: account.id });
      markMessagesAsRead.mutate(
        { chatId, userId: account.id },
        {
          onSuccess: () => {
            console.log('🔵 IndividualChatPage: markMessagesAsRead mutation succeeded');
          },
          onError: (error) => {
            console.error('🔵 IndividualChatPage: markMessagesAsRead mutation failed', error);
          },
        }
      );
      hasMarkedAsRead.current = true;
    } else {
      console.log('🔵 IndividualChatPage: Skipping markMessagesAsRead', {
        reason: !hasMarkedAsRead.current ? 'already marked' : 
                !account?.id ? 'no account' :
                !chatId ? 'no chatId' :
                !conversation ? 'no conversation' :
                !chatService ? 'no chatService' : 'unknown'
      });
    }
  }, [conversation, chatId, account?.id, chatService, markMessagesAsRead]);



  // Convert base64 data URL to Blob (same reliable method as listing system)
  const dataURLtoBlob = (dataurl: string): Blob => {
    try {
      if (!dataurl || typeof dataurl !== 'string') {
        throw new Error('Invalid data URL: not a string');
      }
      if (!dataurl.includes(',')) {
        throw new Error('Invalid data URL format: missing comma separator');
      }
      const arr = dataurl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = arr[1];
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Empty base64 data');
      }
      let bstr: string;
      try {
        bstr = atob(base64Data);
      } catch (e) {
        throw new Error(`Invalid base64 encoding: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
      const n = bstr.length;
      const u8arr = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }
      return new Blob([u8arr], { type: mime });
    } catch (error) {
      console.error('Error converting data URL to Blob:', error);
      throw new Error(`Failed to convert data URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to upload file to Supabase Storage (iOS-compatible)
  // Now accepts media object to use base64 dataUrl for images (reliable like listing system)
  const uploadFileToStorage = async (media: UploadedMedia, chatId: string, index: number): Promise<{ file_url: string; thumbnail_url?: string; width?: number; height?: number }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Check authentication session (matches listing upload system)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }
    
    // Get file reference (needed for filename and fallback)
    const file = media.file;
    if (!file) {
      throw new Error(`File object missing for media ${index + 1}`);
    }

    // Verify the bucket exists and is accessible (matches listing upload system)
    // Note: This is a non-blocking check - if it fails, we continue anyway since
    // the upload itself will provide clearer error messages if the bucket doesn't exist
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        // Permission issue with listBuckets() is not critical - upload will work if bucket exists
        console.warn('⚠️ Could not list buckets (non-critical):', bucketError.message);
      } else if (buckets && buckets.length > 0) {
        const chatMediaBucket = buckets.find(b => b.id === 'chat-media');
        if (chatMediaBucket) {
          console.log('✅ chat-media bucket verified');
        } else {
          // Bucket not in list, but upload might still work (permissions issue with listBuckets)
          console.warn('⚠️ chat-media bucket not found in buckets list (upload will verify)');
        }
      }
      // If buckets is empty, it's likely a permissions issue - upload will verify bucket existence
    } catch (error) {
      // Non-critical - upload will show the real error if bucket doesn't exist
      console.warn('⚠️ Bucket verification skipped (non-critical):', error instanceof Error ? error.message : String(error));
    }

    // Generate unique filename with chatId prefix
    const fileExt = file.name.split('.').pop();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();
    const baseFileName = `${timestamp}_${index}_${randomSuffix}.${fileExt}`;
    const fileName = `${chatId}/${baseFileName}`;

    // Convert to Blob - use base64 data URL if available (reliable like listing system)
    // Otherwise fall back to File object (for videos)
    let blob: Blob;
    
    // Check if we have a base64 data URL (images) - this is more reliable
    if (media.dataUrl && typeof media.dataUrl === 'string') {
      console.log(`  📦 Converting base64 data URL to Blob (reliable method, like listing system)...`);
      try {
        blob = dataURLtoBlob(media.dataUrl);
        console.log(`  ✅ Base64 converted to Blob (${Math.round(blob.size / 1024)}KB, type: ${blob.type})`);
      } catch (conversionError) {
        console.error(`Failed to convert data URL to blob:`, conversionError);
        throw new Error(`Photo ${index + 1} is corrupted or invalid: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
      }
    } else {
      // Fallback to File object (for videos or backward compatibility)
      console.log(`  📦 Converting File to Blob for upload...`);
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(reader.result);
          } else {
            reject(new Error('FileReader did not return ArrayBuffer'));
          }
        };
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsArrayBuffer(file);
      });
      blob = new Blob([arrayBuffer], { type: file.type });
      console.log(`  ✅ File converted to Blob (${Math.round(blob.size / 1024)}KB, type: ${blob.type})`);
    }
    
    console.log(`  📤 Uploading file ${index + 1}: ${file?.name || 'media'}`, {
      fileName,
      fileSize: blob.size,
      fileType: blob.type,
      usingDataUrl: !!media.dataUrl
    });
    
    // Validate blob (EXACT same validation as listing system)
    if (!blob || blob.size === 0) {
      throw new Error(`File is empty (size: ${blob?.size || 0} bytes)`);
    }

    // Check blob size (10MB limit) - EXACT same as listing system
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (blob.size > maxSize) {
      throw new Error(`File is too large (${Math.round(blob.size / 1024)}KB). Maximum size is 10MB.`);
    }
    
    console.log(`  📤 Uploading file: ${fileName} (${Math.round(blob.size / 1024)}KB, type: ${blob.type})`);
    
    // Upload to Supabase Storage using Blob (EXACT same as listing system)
    // Add timeout and retry logic for network issues
    let uploadData;
    let uploadError;
    const maxRetries = 3;
    let retryCount = 0;
    
        while (retryCount < maxRetries) {
          try {
            const uploadPromise = supabase.storage
              .from('chat-media')
              .upload(fileName, blob, {
                cacheControl: '3600',
                upsert: false,
                contentType: blob.type
              });
            
        // Add timeout (30 seconds per upload) - EXACT same as listing system
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
            );
            
            const result = await Promise.race([uploadPromise, timeoutPromise]) as any;
            uploadData = result.data;
            uploadError = result.error;
            
            if (!uploadError) {
          break; // Success, exit retry loop
            }
            
        // If error is retryable, try again (EXACT same logic as listing system)
            if (retryCount < maxRetries - 1 && (
              uploadError.message?.includes('network') || 
              uploadError.message?.includes('timeout') ||
              uploadError.message?.includes('Load failed')
            )) {
              retryCount++;
          console.warn(`  ⚠️ Upload attempt ${retryCount} failed, retrying... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              continue;
            }
            
        break; // Non-retryable error or max retries reached
          } catch (timeoutError: any) {
            if (retryCount < maxRetries - 1) {
              retryCount++;
          console.warn(`  ⚠️ Upload timeout, retrying... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
            uploadError = timeoutError;
            break;
          }
        }

    if (uploadError) {
      console.error(`  ❌ Upload error after ${retryCount + 1} attempts:`, uploadError);
      console.error(`  ❌ Upload error details:`, {
        name: uploadError.name,
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError,
        blobSize: blob.size,
        blobType: blob.type,
        fileName: fileName
      });
      
      // Provide more helpful error message (EXACT same as listing system)
      let errorMessage = `Failed to upload ${file.name}`;
      if (uploadError.message) {
        errorMessage += `: ${uploadError.message}`;
      } else if (uploadError.name === 'StorageUnknownError') {
        errorMessage += ': Storage bucket may not exist or may not have proper permissions. Please check your Supabase storage configuration.';
      } else if (uploadError.message?.includes('timeout') || uploadError.message?.includes('Load failed')) {
        errorMessage += ': Network timeout. Please check your internet connection and try again.';
      } else {
        errorMessage += ': Unknown error occurred';
      }
      
      throw new Error(errorMessage);
    }

    if (!uploadData || !uploadData.path) {
      throw new Error(`Upload succeeded but no path returned`);
    }

    // Get public URL (after successful upload via any method)
    const { data: { publicUrl } } = supabase.storage
      .from('chat-media')
      .getPublicUrl(fileName);

    console.log(`  ✅ Upload completed:`, {
      fileName,
      publicUrl: publicUrl?.substring(0, 60) + '...'
    });

    // Get metadata (dimensions, thumbnail)
    const file_type: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';
    let thumbnail_url: string | undefined;
    let width: number | undefined;
    let height: number | undefined;

    try {
      if (file_type === 'video') {
        // Generate video thumbnail
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });
        width = video.videoWidth;
        height = video.videoHeight;
        // TODO: Generate actual thumbnail for videos
      } else {
        // Get image dimensions
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        width = img.naturalWidth;
        height = img.naturalHeight;
      }
    } catch (metadataError) {
      console.warn('Failed to extract metadata:', metadataError);
    }

    return {
      file_url: publicUrl,
      thumbnail_url,
      width,
      height
    };
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    // Prevent double submission
    if (isSendingRef.current) {
      console.log('⚠️ handleSendMessage: Already sending, ignoring duplicate call');
      return;
    }

    console.log('📤 handleSendMessage called', {
      hasText: !!messageText.trim(),
      pendingMediaCount: pendingMedia.length,
      accountId: account?.id,
      conversationId: conversation?.id,
      hasChatService: !!chatService
    });

    if ((messageText.trim() || pendingMedia.length > 0) && account?.id && conversation?.id && chatService) {
      isSendingRef.current = true;
      
      // Store pending media BEFORE clearing (we need it for uploads)
      const mediaToUpload = [...pendingMedia];
      const pendingMediaCount = mediaToUpload.length;
      const hasPendingMedia = pendingMediaCount > 0;
      
      // Step 1: Create optimistic message IMMEDIATELY (before uploads start)
      // This makes the loading card appear instantly and clears the chat box
      let optimisticMessageId: string | null = null;
      if (hasPendingMedia) {
        optimisticMessageId = `optimistic_${Date.now()}`;
        setOptimisticMessages(prev => {
          const newMap = new Map(prev);
          newMap.set(optimisticMessageId!, { status: 'uploading', fileCount: pendingMediaCount });
          return newMap;
        });
        
        // Add optimistic message to UI immediately
        const optimisticMsg: SimpleMessage = {
          id: optimisticMessageId,
          chat_id: conversation.id,
          sender_id: account.id,
          sender_name: account.name || 'You',
          sender_profile_pic: account.profile_pic || undefined,
          text: messageText.trim() || '',
          created_at: new Date().toISOString(),
          reply_to_message_id: replyToMessage?.id || null,
          attachments: [], // Will be updated when upload completes
          deleted_at: null
        };
        setMessages(prev => [...prev, optimisticMsg]);
        
        // Clear pending media immediately so it disappears from chat box
        setPendingMedia([]);
        
        // Scroll to bottom to show the loading card
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            container.scrollTop = container.scrollHeight;
          }
        }, 50);
      }
      
      try {
        // Step 2: Upload files if any are pending (after showing loading card)
        let attachments: MediaAttachment[] = [];
        
        if (hasPendingMedia) {
          console.log('📤 Uploading files after showing loading card...', {
            count: pendingMediaCount,
            hasFiles: mediaToUpload.some(m => !!m.file)
          });

          // Check if we have File objects (new flow) or URLs (old flow for backward compatibility)
          const hasFiles = mediaToUpload.some(m => !!m.file);
          
          if (hasFiles) {
            // New flow: Upload files sequentially (one at a time) - matches listing system for reliability
            // Sequential uploads prevent network congestion, rate limiting, and memory pressure
            attachments = [];
            
            for (let i = 0; i < mediaToUpload.length; i++) {
              const media = mediaToUpload[i];
              
              if (!media.file && !media.dataUrl) {
                throw new Error(`File object or dataUrl missing for media ${i + 1}`);
              }

              try {
                const uploadResult = await uploadFileToStorage(media, conversation.id, i);
                
                attachments.push({
                  id: `temp_${Date.now()}_${i}`,
                  file_url: uploadResult.file_url,
                  file_type: media.file_type,
                  thumbnail_url: uploadResult.thumbnail_url ?? media.thumbnail_url ?? undefined,
                  width: uploadResult.width || media.width,
                  height: uploadResult.height || media.height
                } as MediaAttachment);
                
                console.log(`✅ Uploaded file ${i + 1}/${mediaToUpload.length} successfully`);
              } catch (error) {
                console.error(`❌ Error uploading file ${i + 1}/${mediaToUpload.length}:`, error);
                throw error; // Stop on first error (matches listing system behavior)
              }
            }
            console.log('✅ All files uploaded sequentially:', {
              count: attachments.length,
              attachments: attachments.map(a => ({
                id: a.id,
                file_type: a.file_type,
                file_url: a.file_url?.substring(0, 50) + '...'
              }))
            });
          } else {
            // Old flow: Files already uploaded (backward compatibility)
            console.log('⚠️ Using old flow - files should already be uploaded');
            attachments = mediaToUpload
              .filter(m => m.file_url && (m.file_url.startsWith('http://') || m.file_url.startsWith('https://')))
              .map((media, index) => ({
                id: `temp_${Date.now()}_${index}`,
                file_url: media.file_url!,
                file_type: media.file_type,
                thumbnail_url: media.thumbnail_url
              } as MediaAttachment));
          }
        }

        console.log('📎 Final attachments array:', {
          count: attachments.length,
          attachments: attachments.map(a => ({
            id: a.id,
            file_type: a.file_type,
            file_url_preview: a.file_url?.substring(0, 50) + '...'
          }))
        });

        // Send message with attachments
        console.log('🚀 Calling chatService.sendMessage', {
          chatId: conversation.id,
          content: messageText.trim() || '(empty text)',
          attachmentsCount: attachments.length
        });

        const { message: newMessage, error: messageError } = await chatService.sendMessage(
          conversation.id,
          messageText.trim() || '',
          attachments.length > 0 ? attachments : undefined,
          replyToMessage?.id || null
        );

        console.log('📬 sendMessage response:', {
          hasMessage: !!newMessage,
          messageId: newMessage?.id,
          hasError: !!messageError,
          replyToMessageId: replyToMessage?.id,
          newMessageReplyToId: newMessage?.reply_to_message_id,
          newMessageReplyToMessage: newMessage?.reply_to_message,
          error: messageError?.message
        });

        if (messageError || !newMessage) {
          console.error('❌ Failed to send message:', messageError);
          
          // Update optimistic message to failed state
          if (optimisticMessageId) {
            setOptimisticMessages(prev => {
              const newMap = new Map(prev);
              newMap.set(optimisticMessageId, { status: 'failed', fileCount: attachments.length });
              return newMap;
            });
          }
          isSendingRef.current = false; // Reset flag on error
          return;
        }

        console.log('✅ Message sent successfully:', {
          messageId: newMessage.id,
          hasAttachments: !!(newMessage.attachments && newMessage.attachments.length > 0),
          attachmentCount: newMessage.attachments?.length || 0
        });

        // Stop typing indicator when message is sent
        if (chatService && conversation?.id) {
          chatService.sendTypingIndicator(conversation.id, false);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        }

        // Remove optimistic message
        if (optimisticMessageId) {
          setOptimisticMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(optimisticMessageId!);
            return newMap;
          });
          
          // Remove optimistic message from list
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessageId));
        }

        // Clear the form immediately (pendingMedia already cleared above)
        setMessageText("");
        setReplyToMessage(null);
        setReplyingMessageElement(null);

        // Optimized: Append the new message directly instead of refetching all messages
        // The newMessage returned from sendMessage already includes all data (attachments, reply info, etc.)
        console.log('✅ Appending new message directly to state:', {
          messageId: newMessage.id,
          hasAttachments: !!(newMessage.attachments && newMessage.attachments.length > 0),
          attachmentCount: newMessage.attachments?.length || 0
        });
        
        // Use functional update to append the new message
        setMessages(prev => {
          // Remove any optimistic messages that might still be there
          const withoutOptimistic = prev.filter(msg => !msg.id.startsWith('optimistic_'));
          
          // Check if message already exists (shouldn't happen, but safety check)
          const messageExists = withoutOptimistic.some(msg => msg.id === newMessage.id);
          if (messageExists) {
            console.warn('⚠️ Message already exists in state, skipping append');
            return withoutOptimistic;
          }
          
          // Append the new message
          return [...withoutOptimistic, newMessage];
        });
        
        // Reset sending flag after successful completion
        isSendingRef.current = false;
      } catch (error) {
        console.error('❌ Error sending message:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        isSendingRef.current = false; // Reset flag on error
      }
    } else {
      console.warn('⚠️ handleSendMessage: Conditions not met', {
        hasText: !!messageText.trim(),
        pendingMediaCount: pendingMedia.length,
        hasAccount: !!account?.id,
        hasConversation: !!conversation?.id,
        hasChatService: !!chatService
      });
      isSendingRef.current = false;
    }
  };

  // Message action handlers
  const handleMessageLongPress = (message: SimpleMessage) => {
    setSelectedMessage(message);
  };

  const handleReply = (message: SimpleMessage) => {
    // Store the message element for blurring
    const messageElement = longPressedElement || document.querySelector(`[data-message-id="${message.id}"]`) as HTMLElement;
    setReplyingMessageElement(messageElement);
    setReplyToMessage(message);
    setSelectedMessage(null);
    setLongPressedMessage(null);
    setLongPressedElement(null);
    setLongPressedPosition(null);
    
    // Focus the textarea to open keyboard
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // Long press handler
  const handleLongPress = (message: SimpleMessage, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const isMe = message.sender_id === account?.id;
    
    // DIAGNOSTIC: Log computed styles of the element
    const computedStyle = window.getComputedStyle(element);
    console.log('🔍 Long Press Diagnostic - Element Styles:', {
      element: element.tagName,
      className: element.className,
      opacity: computedStyle.opacity,
      filter: computedStyle.filter,
      transform: computedStyle.transform,
      backgroundColor: computedStyle.backgroundColor,
      zIndex: computedStyle.zIndex,
      position: computedStyle.position,
      isolation: computedStyle.isolation,
      willChange: computedStyle.willChange,
      parentOpacity: element.parentElement ? window.getComputedStyle(element.parentElement).opacity : 'N/A',
      parentFilter: element.parentElement ? window.getComputedStyle(element.parentElement).filter : 'N/A',
      rect: {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      }
    });
    
    setLongPressedMessage(message);
    setLongPressedElement(element);
    setLongPressedPosition({
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width, // Preserve original width
      isOwnMessage: isMe
    });
  };

  // Close long press state
  const handleCloseLongPress = () => {
    setLongPressedMessage(null);
    setLongPressedElement(null);
    setLongPressedPosition(null);
    setDeleteConfirmationMessageId(null); // Clear delete confirmation when closing
  };

  // Calculate boundaries and constrained positions for cards
  const calculateConstrainedPositions = () => {
    if (!longPressedPosition || typeof window === 'undefined') return null;

    // Calculate top boundary (bottom of PageHeader/profile card)
    // Try to find the PageHeader element to get its actual bottom position
    const headerElements = document.querySelectorAll('[class*="absolute top-0"][class*="z-20"]');
    let topBoundary = 130; // Default fallback
    
    if (headerElements.length > 0) {
      const headerElement = headerElements[0] as HTMLElement;
      const headerRect = headerElement.getBoundingClientRect();
      topBoundary = headerRect.bottom;
    } else {
      // Fallback calculation
      const isMobile = window.innerWidth < 1024;
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0');
      const headerPaddingTop = Math.max(safeAreaTop, 70);
      const headerContentHeight = isMobile ? 44 : 40;
      const headerPaddingBottom = 16;
      topBoundary = headerPaddingTop + headerContentHeight + headerPaddingBottom;
    }

    // Calculate bottom boundary (top of chat input)
    // Use the chat input ref if available, otherwise query DOM
    let bottomBoundary = window.innerHeight - 100; // Default fallback
    
    const chatInputElement = chatInputRef.current || 
      document.querySelector('[style*="fixed z-20"][style*="bottom"]') as HTMLElement;
    
    if (chatInputElement) {
      const inputRect = chatInputElement.getBoundingClientRect();
      bottomBoundary = inputRect.top;
    } else {
      // Fallback calculation
      const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0');
      const bottomOffset = Math.max(safeAreaBottom, 20);
      const chatInputHeight = pendingMedia.length > 0 ? 180 : 100;
      bottomBoundary = window.innerHeight - bottomOffset - chatInputHeight;
    }

    // Estimate card heights (approximate - measured from components)
    const emojiCardHeight = 60; // MessageReactionCard: px-4 py-3 = ~60px total
    // MessageActionCard: vertical card with 3 buttons (Reply, Copy, Delete)
    // Each button ~44px (py-3 = 12px top + 12px bottom + ~20px content) = ~132px for 3 buttons
    // Delete confirmation mode: 2 sections (Cancel + Delete button) = ~100px
    const isDeleteConfirmation = longPressedMessage && deleteConfirmationMessageId === longPressedMessage.id;
    const actionCardHeight = isDeleteConfirmation ? 100 : 140; // Shorter when in confirmation mode

    // Detect if message contains a profile card (check for /p/{connectId} pattern in message text)
    const isProfileCardMessage = longPressedMessage?.text && /\/p\/([A-Z0-9]+)/i.test(longPressedMessage.text);
    
    // Profile cards have mb-2 (8px margin-bottom) on their wrapper div, which creates a gap
    // We need to account for this margin when calculating the actual card bottom position
    const PROFILE_CARD_MARGIN_BOTTOM = 8; // mb-2 = 8px

    // Message dimensions
    // For profile cards, subtract the margin-bottom to get the actual card bottom
    const messageHeight = longPressedPosition.bottom - longPressedPosition.top;
    const actualMessageBottom = isProfileCardMessage 
      ? longPressedPosition.bottom - PROFILE_CARD_MARGIN_BOTTOM 
      : longPressedPosition.bottom;
    
    // Use tighter spacing for profile cards to attach reaction card (like images/listings)
    // For profile cards: 0px spacing (attached), for others: 8px spacing
    const SPACING = isProfileCardMessage ? 0 : 8;

    // Step 1: Check if cards need to be constrained based on original message position
    // For profile cards, use the actual card bottom (without margin) for positioning
    const desiredEmojiBottom = isProfileCardMessage 
      ? actualMessageBottom - SPACING 
      : longPressedPosition.top - SPACING;
    const minEmojiBottom = topBoundary + emojiCardHeight;
    const emojiNeedsConstraint = desiredEmojiBottom < minEmojiBottom;

    const desiredActionTop = (isProfileCardMessage ? actualMessageBottom : longPressedPosition.bottom) + SPACING;
    const maxActionTop = bottomBoundary - actionCardHeight;
    const actionNeedsConstraint = desiredActionTop > maxActionTop;

    // Step 2: Calculate constrained message position
    let constrainedMessageTop: number;
    
    if (emojiNeedsConstraint && actionNeedsConstraint) {
      // Both cards need constraint - find message position that fits both
      // Message top must allow emoji card to fit above (messageTop >= topBoundary + emojiCardHeight + SPACING)
      // Message bottom must allow action card to fit below (messageTop <= bottomBoundary - actionCardHeight - SPACING - messageHeight)
      const minMessageTop = topBoundary + emojiCardHeight + SPACING;
      const maxMessageTop = bottomBoundary - actionCardHeight - SPACING - messageHeight;
      constrainedMessageTop = Math.max(minMessageTop, Math.min(maxMessageTop, longPressedPosition.top));
    } else if (emojiNeedsConstraint) {
      // Only emoji card needs constraint - shift message down
      constrainedMessageTop = topBoundary + emojiCardHeight + SPACING;
    } else if (actionNeedsConstraint) {
      // Only action card needs constraint - shift message up
      constrainedMessageTop = bottomBoundary - actionCardHeight - SPACING - messageHeight;
    } else {
      // No constraints needed - use original position
      constrainedMessageTop = longPressedPosition.top;
    }

    // Step 3: Ensure message doesn't go outside boundaries
    constrainedMessageTop = Math.max(topBoundary, Math.min(constrainedMessageTop, bottomBoundary - messageHeight));

    // Step 4: Recalculate card positions based on constrained message position to maintain exact spacing
    // We'll calculate ideal positions first, then adjust message if cards get constrained
    
    const constrainedMessageBottom = constrainedMessageTop + messageHeight;
    // For profile cards, account for the margin when calculating actual bottom
    const constrainedActualBottom = isProfileCardMessage 
      ? constrainedMessageBottom - PROFILE_CARD_MARGIN_BOTTOM 
      : constrainedMessageBottom;
    
    // Ideal positions: exactly SPACING pixels from message
    // For profile cards, position relative to actual card bottom (without margin)
    const idealEmojiBottom = isProfileCardMessage 
      ? constrainedActualBottom - SPACING 
      : constrainedMessageTop - SPACING;
    const idealActionTop = (isProfileCardMessage ? constrainedActualBottom : constrainedMessageBottom) + SPACING;
    
    // Check if cards can fit at ideal positions
    const emojiFits = idealEmojiBottom >= minEmojiBottom;
    const actionFits = idealActionTop <= maxActionTop;
    
    let finalMessageTop = constrainedMessageTop;
    let finalEmojiBottom: number;
    let finalActionTop: number;
    
    if (!emojiFits && !actionFits) {
      // Both cards need constraint - position message to fit both with exact spacing
      // Emoji card needs: messageTop >= topBoundary + emojiCardHeight + SPACING
      // Action card needs: messageTop <= bottomBoundary - actionCardHeight - SPACING - messageHeight
      const minTop = topBoundary + emojiCardHeight + SPACING;
      const maxTop = bottomBoundary - actionCardHeight - SPACING - messageHeight;
      finalMessageTop = Math.max(minTop, Math.min(maxTop, constrainedMessageTop));
      
      // Calculate card positions with exact spacing from adjusted message
      finalEmojiBottom = finalMessageTop - SPACING;
      const adjustedMessageBottom = finalMessageTop + messageHeight;
      finalActionTop = adjustedMessageBottom + SPACING;
    } else if (!emojiFits) {
      // Only emoji card needs constraint - shift message down, action card maintains spacing
      finalMessageTop = topBoundary + emojiCardHeight + SPACING;
      // For profile cards, calculate actual bottom and position relative to it
      const adjustedMessageBottom = finalMessageTop + messageHeight;
      const adjustedActualBottom = isProfileCardMessage 
        ? adjustedMessageBottom - PROFILE_CARD_MARGIN_BOTTOM 
        : adjustedMessageBottom;
      finalEmojiBottom = isProfileCardMessage 
        ? adjustedActualBottom - SPACING 
        : finalMessageTop - SPACING;
      finalActionTop = adjustedActualBottom + SPACING;
    } else if (!actionFits) {
      // Only action card needs constraint - shift message up, emoji card maintains spacing
      finalMessageTop = bottomBoundary - actionCardHeight - SPACING - messageHeight;
      const adjustedMessageBottom = finalMessageTop + messageHeight;
      const adjustedActualBottom = isProfileCardMessage 
        ? adjustedMessageBottom - PROFILE_CARD_MARGIN_BOTTOM 
        : adjustedMessageBottom;
      finalEmojiBottom = isProfileCardMessage 
        ? adjustedActualBottom - SPACING 
        : finalMessageTop - SPACING;
      finalActionTop = adjustedActualBottom + SPACING;
    } else {
      // Both cards fit - use ideal positions with exact spacing
      finalEmojiBottom = idealEmojiBottom;
      finalActionTop = idealActionTop;
    }
    
    // For profile cards, ensure we're using the actual card bottom (without margin) for final calculations
    if (isProfileCardMessage) {
      const finalMessageBottom = finalMessageTop + messageHeight;
      const finalActualBottom = finalMessageBottom - PROFILE_CARD_MARGIN_BOTTOM;
      // Recalculate if needed to ensure reaction card is attached to actual card
      finalEmojiBottom = finalActualBottom - SPACING;
    }
    
    // Ensure final positions respect boundaries (should already, but double-check)
    const finalEmojiBottomConstrained = Math.max(minEmojiBottom, finalEmojiBottom);
    const finalActionTopConstrained = Math.min(maxActionTop, finalActionTop);
    
    // The emoji card uses translateY(-100%), so 'top' represents where the bottom of the card will be
    const emojiTop = finalEmojiBottomConstrained;

    return {
      emojiTop,
      actionTop: finalActionTopConstrained,
      messageTop: constrainedMessageTop,
      topBoundary,
      bottomBoundary
    };
  };

  // DIAGNOSTIC: Log all computed styles when long press state changes
  useEffect(() => {
    if (longPressedMessage && longPressedElement && longPressedPosition) {
      // Wait for DOM to update
      setTimeout(() => {
        console.log('🔍 ========== COMPREHENSIVE LONG PRESS DIAGNOSTIC ==========');
        
        // Check overlay
        const overlay = document.querySelector('[style*="rgba(0, 0, 0, 0.3)"]') as HTMLElement;
        if (overlay) {
          const overlayComputed = window.getComputedStyle(overlay);
          console.log('🔍 Overlay:', {
            opacity: overlayComputed.opacity,
            backgroundColor: overlayComputed.backgroundColor,
            zIndex: overlayComputed.zIndex,
            position: overlayComputed.position
          });
        }
        
        // Check reaction card wrapper
        const reactionWrapper = document.querySelector('[style*="translateY(-100%)"]') as HTMLElement;
        if (reactionWrapper) {
          const reactionComputed = window.getComputedStyle(reactionWrapper);
          console.log('🔍 Reaction Card Wrapper:', {
            opacity: reactionComputed.opacity,
            filter: reactionComputed.filter,
            transform: reactionComputed.transform,
            backgroundColor: reactionComputed.backgroundColor,
            zIndex: reactionComputed.zIndex,
            position: reactionComputed.position,
            isolation: reactionComputed.isolation,
            parentOpacity: reactionWrapper.parentElement ? window.getComputedStyle(reactionWrapper.parentElement).opacity : 'N/A',
            parentFilter: reactionWrapper.parentElement ? window.getComputedStyle(reactionWrapper.parentElement).filter : 'N/A',
            actualElement: reactionWrapper
          });
          
          // Check reaction card component inside
          const reactionCard = reactionWrapper.querySelector('div[class*="bg-white"]') as HTMLElement;
          if (reactionCard) {
            const cardComputed = window.getComputedStyle(reactionCard);
            console.log('🔍 Reaction Card Component:', {
              opacity: cardComputed.opacity,
              filter: cardComputed.filter,
              transform: cardComputed.transform,
              backgroundColor: cardComputed.backgroundColor
            });
          }
        }
        
        // Check message bubble wrapper
        const messageWrapper = document.querySelector('[style*="zIndex: 102"]') as HTMLElement;
        if (messageWrapper) {
          const messageComputed = window.getComputedStyle(messageWrapper);
          console.log('🔍 Message Bubble Wrapper:', {
            opacity: messageComputed.opacity,
            filter: messageComputed.filter,
            transform: messageComputed.transform,
            backgroundColor: messageComputed.backgroundColor,
            zIndex: messageComputed.zIndex,
            position: messageComputed.position,
            isolation: messageComputed.isolation,
            parentOpacity: messageWrapper.parentElement ? window.getComputedStyle(messageWrapper.parentElement).opacity : 'N/A',
            parentFilter: messageWrapper.parentElement ? window.getComputedStyle(messageWrapper.parentElement).filter : 'N/A'
          });
        }
        
        // Check action card wrapper
        const actionWrapper = document.querySelector('[style*="zIndex: 103"]') as HTMLElement;
        if (actionWrapper && actionWrapper !== reactionWrapper) {
          const actionComputed = window.getComputedStyle(actionWrapper);
          console.log('🔍 Action Card Wrapper:', {
            opacity: actionComputed.opacity,
            filter: actionComputed.filter,
            transform: actionComputed.transform,
            backgroundColor: actionComputed.backgroundColor,
            zIndex: actionComputed.zIndex,
            position: actionComputed.position,
            isolation: actionComputed.isolation,
            parentOpacity: actionWrapper.parentElement ? window.getComputedStyle(actionWrapper.parentElement).opacity : 'N/A',
            parentFilter: actionWrapper.parentElement ? window.getComputedStyle(actionWrapper.parentElement).filter : 'N/A'
          });
          
          // Check action card component inside
          const actionCard = actionWrapper.querySelector('div[class*="bg-white"]') as HTMLElement;
          if (actionCard) {
            const cardComputed = window.getComputedStyle(actionCard);
            console.log('🔍 Action Card Component:', {
              opacity: cardComputed.opacity,
              filter: cardComputed.filter,
              transform: cardComputed.transform,
              backgroundColor: cardComputed.backgroundColor
            });
          }
        }
        
        // Check parent container
        const parentContainer = longPressedElement.parentElement;
        if (parentContainer) {
          const parentComputed = window.getComputedStyle(parentContainer);
          console.log('🔍 Parent Container:', {
            opacity: parentComputed.opacity,
            filter: parentComputed.filter,
            transform: parentComputed.transform,
            isolation: parentComputed.isolation,
            zIndex: parentComputed.zIndex
          });
        }
        
        // Check messages container
        if (messagesContainerRef.current) {
          const containerComputed = window.getComputedStyle(messagesContainerRef.current);
          console.log('🔍 Messages Container:', {
            opacity: containerComputed.opacity,
            filter: containerComputed.filter,
            transform: containerComputed.transform,
            contain: containerComputed.contain
          });
        }
        
        console.log('🔍 ========== END DIAGNOSTIC ==========');
      }, 100);
    }
  }, [longPressedMessage, longPressedElement, longPressedPosition]);
  
  // Click outside to close long press state
  useEffect(() => {
    if (!longPressedMessage) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the cards or the message itself
      if (
        longPressContainerRef.current?.contains(target) ||
        longPressedElement?.contains(target) ||
        actionCardRef.current?.contains(target) ||
        emojiCardRef.current?.contains(target)
      ) {
        return;
      }
      
      handleCloseLongPress();
    };

    // Add listeners for both mouse and touch events
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [longPressedMessage, longPressedElement]);

  const handleCopy = (message: SimpleMessage) => {
    const textToCopy = message.text || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('Message copied to clipboard');
        // TODO: Show success toast/notification
      }).catch((err) => {
        console.error('Failed to copy message:', err);
        // TODO: Show error toast/notification
      });
    }
  };

  const handleDelete = async (messageId: string) => {
    // Show delete confirmation instead of deleting immediately
    setDeleteConfirmationMessageId(messageId);
  };

  const handleDeleteConfirm = async (messageId: string) => {
    if (!chatService) {
      console.error('ChatService not available');
      return;
    }

    try {
      const { error } = await chatService.deleteMessage(messageId);
      if (error) {
        console.error('Error deleting message:', error);
        // TODO: Show error toast/notification
      } else {
        // Remove message from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        // Close long press state
        handleCloseLongPress();
        // Clear confirmation state
        setDeleteConfirmationMessageId(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      // TODO: Show error toast/notification
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmationMessageId(null);
  };

  const handleDeleteFromModal = async (message: SimpleMessage) => {
    // Wrapper for MessageActionModal which expects SimpleMessage
    await handleDelete(message.id);
  };

  const handleReact = async (message: SimpleMessage, emoji: string) => {
    if (!chatService) {
      console.error('ChatService not available');
      return;
    }

    // Get current auth user ID to check if user already reacted
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Check if user already reacted with this emoji
    const userHasReacted = message.reactions?.some(
      r => r.user_id === user.id && r.emoji === emoji
    );

    if (userHasReacted) {
      // Remove reaction
      const { error } = await chatService.removeReaction(message.id, emoji);
      if (error) {
        console.error('Error removing reaction:', error);
        return;
      }
    } else {
      // Add reaction
      const { error } = await chatService.addReaction(message.id, emoji);
      if (error) {
        console.error('Error adding reaction:', error);
        return;
      }
    }

    // Don't manually refresh - the real-time subscription will handle updates
    // This prevents race conditions and duplicate refreshes
  };

  const handleMediaSelected = (media: UploadedMedia[]) => {
    console.log('📥 handleMediaSelected called in IndividualChatPage:', {
      count: media.length,
      media: media.map((m, i) => ({
        index: i + 1,
        file_type: m.file_type,
        has_file: !!m.file,
        previewUrl: m.previewUrl?.substring(0, 60) + '...',
        file_url: m.file_url?.substring(0, 60) + '...',
        has_thumbnail: !!m.thumbnail_url,
        file_size: m.file_size,
        is_blob_url: m.previewUrl?.startsWith('blob:') || m.file_url?.startsWith('blob:'),
        is_http_url: m.file_url?.startsWith('http')
      }))
    });
    setPendingMedia(media);
  };

  const handleRemoveMedia = (index: number) => {
    setPendingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentClick = (message: SimpleMessage, index?: number) => {
    if (message.attachments && message.attachments.length > 0) {
      if (index !== undefined) {
        // Direct image click - open viewer at that index
        setViewerMedia(message.attachments);
        setSelectedMediaIndex(index);
        setShowMediaViewer(true);
      } else {
        // Grid/badge click - show grid modal (no navigation needed!)
        setGridModalAttachments(message.attachments);
        setShowGridModal(true);
    }
    }
  };

  const handleProfileClick = (userId: string) => {
    setProfileModalUserId(userId);
    setShowProfileModal(true);
  };


  const cancelReply = () => {
    setReplyToMessage(null);
    setReplyingMessageElement(null);
  };

  const handleReplyCardClick = (replyToMessageId: string) => {
    // Find the message element by its ID
    const messageElement = document.querySelector(`[data-message-id="${replyToMessageId}"]`) as HTMLElement;
    
    if (messageElement && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const messageRect = messageElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate the scroll position needed to center the message in the viewport
      const scrollTop = container.scrollTop;
      const messageTop = messageElement.offsetTop;
      const containerHeight = container.clientHeight;
      const messageHeight = messageElement.offsetHeight;
      
      // Center the message in the viewport
      const targetScrollTop = messageTop - (containerHeight / 2) + (messageHeight / 2);
      
      // Smooth scroll to the message
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
      
      // Find the message content div (excludes reaction badges which are rendered below)
      const messageContent = messageElement.querySelector('[data-message-content="true"]') as HTMLElement;
      const targetElement = messageContent || messageElement;
      
      // Highlight the message content (excluding reactions) with soft yellow
      targetElement.style.transition = 'background-color 0.3s ease';
      targetElement.style.backgroundColor = 'rgba(252, 211, 77, 0.3)'; // Soft yellow highlight
      setTimeout(() => {
        targetElement.style.backgroundColor = '';
        setTimeout(() => {
          targetElement.style.transition = '';
        }, 300);
      }, 1000);
    }
  };

  const cancelMedia = () => {
    setPendingMedia([]);
  };

  // Handle swipe gestures - RIGHT swipe (drag from left to right)
  const minSwipeDistance = 100;
  const edgeThreshold = 50; // Only trigger on edges

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    const startX = touch.clientX;
    const screenWidth = window.innerWidth;
    
    // Only start swipe if touch is near the left edge
    if (startX <= edgeThreshold) {
      setStartX(startX);
      setTouchStart(startX);
      setTouchEnd(null);
      setIsDragging(true);
      setDragOffset(0);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !startX) return;
    
    const touch = e.targetTouches[0];
    const currentX = touch.clientX;
    const deltaX = currentX - startX;
    const screenWidth = window.innerWidth;
    
    // Only allow rightward movement (positive deltaX) - dragging from left to right
    if (deltaX > 0) {
      setDragOffset(Math.min(deltaX, screenWidth * 0.3)); // Limit to 30% of screen width
      setTouchEnd(currentX);
    }
  };

  const onTouchEnd = () => {
    if (!isDragging || !touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    
    const distance = touchEnd - touchStart;
    const isRightSwipe = distance > minSwipeDistance;

    if (isRightSwipe) {
      // Complete the swipe animation and navigate back
      setDragOffset(window.innerWidth);
      setTimeout(async () => {
        // If chat has no messages and is not an event chat, delete it before navigating back
        if (chatId && messages.length === 0 && chatService && !isEventChat) {
          console.log('Chat has no messages, deleting before navigating back (swipe)');
          await chatService.deleteChat(chatId);
        }
        router.push('/chat');
      }, 200);
    } else {
      // Snap back to original position
      setDragOffset(0);
    }
    
    setIsDragging(false);
    setTouchStart(null);
    setTouchEnd(null);
    setStartX(null);
  };

  if (loading) {
    return (
      <MobilePage>
        <PageHeader
          title=""
          backButton={true}
          onBack={async () => {
            // Check for 'from' parameter to return to previous page
            const from = searchParams.get('from');
            if (from) {
              router.push(from);
            } else {
              router.push('/chat');
            }
          }}
          disableBlur={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loading8 />
        </div>
      </MobilePage>
    );
  }

  if (error || !conversation) {
    return (
      <div className="h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error</div>
          <div className="text-gray-500 mb-4">{error || 'Conversation not found'}</div>
          <button
            onClick={() => router.push('/chat')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:opacity-90"
          >
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  // Handle navigation to chat details/listing
  const handleHeaderClick = () => {
    if (!chatId) return;

    // For event-specific chats, open listing page instead of chat details
    if (isEventChat && eventListing) {
      const from = `/chat/individual?chat=${chatId}`;
      router.push(
        `/listing?id=${eventListing.id}&from=${encodeURIComponent(from)}`
      );
      return;
    }

    // Regular chats: open chat details
    if (conversation.isGroup) {
      router.push(`/chat/group-details?chat=${chatId}`);
    } else {
      router.push(`/chat/dm-details?chat=${chatId}`);
    }
  };

  // Profile card component - Image top center, info card below
  const profileCard = (
    <div
      className="absolute left-0 right-0"
      style={{
        top: "0", // Align with top of leftSection (same as back button)
        height: "44px", // Match leftSection height
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start", // Align items to top
      }}
    >
      {/* Image Component - Top Center - Positioned independently, aligned with back button top */}
      <button
        onClick={handleHeaderClick}
        className="absolute z-10"
        style={{
          cursor: "pointer",
          top: "0", // Align top with back button top (container is now at top: 0)
          left: "50%", // Center horizontally
          transform: "translateX(-50%)", // Center horizontally only
        }}
      >
        {isEventChat && eventListing ? (
          // Event chat: squared image - 48px to visually match back button and chat box (accounting for shadows)
          <div 
            className="bg-gray-200 flex items-center justify-center overflow-hidden rounded-lg"
            style={{
              width: '48px',
              height: '48px',
              borderWidth: '0.5px',
              borderStyle: 'solid',
              borderColor: 'rgba(0, 0, 0, 0.08)'
            }}
          >
            {eventListing.photo_urls && eventListing.photo_urls.length > 0 ? (
              <Image
                src={eventListing.photo_urls[0]}
                alt={eventListing.title}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-base font-semibold">
                {eventListing.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ) : (
          // Regular chat: circular avatar - 48px to visually match back button and chat box (accounting for shadows)
          <div className="rounded-full overflow-hidden" style={{ width: '48px', height: '48px' }}>
            <Avatar
              src={conversation.avatarUrl}
              name={conversation.title}
              size={48}
            />
          </div>
        )}
      </button>

      {/* Info Card - Below Image, overlapping behind profile pic - Positioned independently */}
      <button 
        onClick={handleHeaderClick}
        className="absolute z-0"
        style={{
          height: "44px", // Match back button and chat box height
          borderRadius: "100px", // Match chat input box at bottom of page
          background: "rgba(255, 255, 255, 0.96)",
          borderWidth: "0.4px",
          borderColor: "#E5E7EB",
          borderStyle: "solid",
          boxShadow:
            "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)",
          willChange: "transform, box-shadow",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between", // Space between text and chevron
          maxWidth: "calc(100% - 32px)", // Account for page padding
          paddingLeft: "16px", // Left padding for text
          paddingRight: "8px", // Tighter right padding for chevron
          top: isEventChat ? "42px" : "40px", // 6px lower for event chats, 4px lower for groups/DMs (was 36px)
          left: "50%", // Center horizontally
          transform: "translateX(-50%)", // Center horizontally only
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)";
        }}
      >
        {/* Title - left aligned with ellipsis truncation */}
        <div 
          className="font-semibold text-gray-900 text-base flex-1 text-left"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0 // Required for flex truncation to work
          }}
        >
              {conversation.title}
            </div>
        {/* Right chevron icon */}
        <svg 
          className="w-5 h-5 text-gray-500 flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          style={{ marginLeft: "4px" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );

  return (
    <div 
      className="relative h-screen" 
      style={{ 
        transform: `translateX(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        background: 'transparent',
        zIndex: 1
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe indicator */}
      {isDragging && (
        <div 
          className="absolute top-1/2 left-0 w-1 bg-orange-500 rounded-r-full z-30"
          style={{ 
            height: '60px',
            transform: 'translateY(-50%)',
            opacity: Math.min(dragOffset / 50, 1)
          }}
        />
      )}
      
      {/* PageHeader - Now safe to add back since we're using paddingTop instead of top offset */}
      <PageHeader
        title=""
        backButton={true}
        onBack={async () => {
          // If chat has no messages and is not an event chat, delete it before navigating back
          if (chatId && messages.length === 0 && chatService && !isEventChat) {
            console.log('Chat has no messages, deleting before navigating back');
            await chatService.deleteChat(chatId);
          }
          
          // Check for 'from' parameter to return to previous page (e.g., listing page)
          const from = searchParams.get('from');
          if (from) {
            router.push(from);
          } else {
            router.push('/chat');
          }
        }}
        leftSection={profileCard}
        disableBlur={true}
      />

      {/* Blur overlay when replying */}
      {replyToMessage && (() => {
        // Find the message element if we don't have it stored
        const messageElement = replyingMessageElement || 
          (replyToMessage ? document.querySelector(`[data-message-id="${replyToMessage.id}"]`) as HTMLElement : null);
        
        if (!messageElement) return null;
        
        const messageRect = messageElement.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        
        // Get chat input position
        const chatInputElement = chatInputRef.current;
        const inputRect = chatInputElement ? chatInputElement.getBoundingClientRect() : null;
        
        // Get reply preview position (it's positioned above the input)
        // The reply preview shows the actual message, so we need to estimate its height
        const replyPreviewBottom = pendingMedia.length > 0 ? 180 : 100;
        const replyPreviewHeight = 80; // Approximate height of message with avatar (if other user) or just bubble
        const replyPreviewTop = window.innerHeight - replyPreviewBottom - replyPreviewHeight;
        
        return (
          <div 
            className="fixed inset-0 z-40"
            onClick={cancelReply}
          style={{ 
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              pointerEvents: 'auto',
              cursor: 'pointer'
          }}
        >
            {/* Keep the replying message element visible - create a cutout */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: messageRect.top + scrollY,
                left: messageRect.left + scrollX,
                width: messageRect.width,
                height: messageRect.height,
                pointerEvents: 'auto',
                zIndex: 50,
                backgroundColor: 'transparent'
              }}
            />
            
            {/* Keep the chat input visible - create a cutout */}
            {inputRect && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: inputRect.top + scrollY,
                  left: inputRect.left + scrollX,
                  width: inputRect.width,
                  height: inputRect.height,
                  pointerEvents: 'auto',
                  zIndex: 50,
                  backgroundColor: 'transparent'
                }}
              />
            )}
            
            {/* Keep the reply preview visible - create a cutout */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: replyPreviewTop + scrollY,
                left: 0,
                right: 0,
                height: replyPreviewHeight,
                pointerEvents: 'auto',
                zIndex: 50,
                backgroundColor: 'transparent'
              }}
            />
              </div>
        );
      })()}

      {/* X Button - Top Right when replying */}
      {replyToMessage && (
            <button
              onClick={cancelReply}
          className="fixed flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] z-[60]"
          style={{
            top: 'max(env(safe-area-inset-top), 70px)',
            right: '16px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
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
          aria-label="Cancel reply"
        >
          <X size={18} className="text-gray-900" strokeWidth={2.5} />
            </button>
      )}

      {/* Reply Preview - Only show when actually replying */}
      {replyToMessage && (
        <div 
          className="fixed left-0 right-0 z-50 px-6"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            bottom: pendingMedia.length > 0 ? '180px' : '100px',
            paddingBottom: '8px'
          }}
        >
          <div className="relative">
            {/* Render the message exactly as it appears in chat */}
            <div style={{ 
              opacity: 0.95, // Slightly transparent to indicate it's a preview
              transform: 'scale(0.98)' // Slightly smaller
            }}>
              <MessageBubble
                message={replyToMessage}
                currentUserId={currentUserId}
                showOptions={false}
                onReactionToggle={undefined}
                onReactionClick={undefined}
                onAttachmentClick={undefined}
                onReply={undefined}
                onDelete={undefined}
                onLongPress={undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Input Card - Expands when photos are selected */}
      <div 
        ref={chatInputRef}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-50"
        style={{ 
          left: '22px',
          right: '22px',
          bottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
          paddingTop: pendingMedia.length > 0 ? '12px' : '6px',
          paddingBottom: '6px',
          paddingLeft: '6px',
          paddingRight: '6px',
          borderRadius: pendingMedia.length > 0 ? '20px' : '100px',
          backgroundColor: 'white',
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          transition: 'border-radius 0.2s ease-out, padding-top 0.2s ease-out'
        }}
      >
        {/* Photos Preview - Inside the chat box, horizontally scrollable when more than 3 */}
      {pendingMedia.length > 0 && (
        <div 
            className="mb-3 overflow-x-auto no-scrollbar"
          style={{ 
              WebkitOverflowScrolling: 'touch',
          }}
        >
            <div 
              className="flex gap-3"
              style={{ 
                width: pendingMedia.length > 3 ? 'max-content' : '100%',
                paddingLeft: '2px',
                paddingRight: '2px'
              }}
            >
            {pendingMedia.map((media, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 rounded-xl overflow-hidden bg-gray-100"
                style={{
                  width: '80px',
                  height: '80px',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                }}
              >
                {media.file_type === 'video' ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                    {media.thumbnail_url ? (
                      <>
                        <img
                          src={media.thumbnail_url}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-5 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                      src={media.previewUrl || media.file_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={() => handleRemoveMedia(index)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all z-10"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

        {/* Input Controls Row - + button, text input, and send button */}
        <div className="flex items-center">
        {/* + Button - Same size as send button, equal spacing from left edge */}
        <div style={{ width: '32px', height: '32px', flexShrink: 0 }}>
          <MediaUploadButton 
              chatId={conversation?.id} 
            onMediaSelected={handleMediaSelected}
            disabled={false}
          />
        </div>
        
        {/* Text Input */}
        <textarea
            ref={textareaRef}
            data-no-global-input-fix="true"
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
            // Send typing indicator
            if (chatService && conversation?.id && account?.id) {
              chatService.sendTypingIndicator(conversation.id, true);
              // Clear existing timeout
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              // Set timeout to stop typing indicator after 3 seconds
              typingTimeoutRef.current = setTimeout(() => {
                if (chatService && conversation?.id) {
                  chatService.sendTypingIndicator(conversation.id, false);
                }
              }, 3000);
            }
          }}
          placeholder=""
            autoCorrect="off"
            spellCheck={false}
            onFocus={(e) => {
              const textarea = e.currentTarget;
              console.log('💬 Chat textarea focused (BEFORE)', {
                autocapitalize: textarea.getAttribute('autocapitalize'),
                autoCapitalize: (textarea as any).autocapitalize,
                hasAttribute: textarea.hasAttribute('autocapitalize'),
                tagName: textarea.tagName
              });
              // Force remove autocapitalize using direct DOM manipulation
              // Use Object.defineProperty to prevent React from re-applying it
              try {
                textarea.removeAttribute('autocapitalize');
                // Override the property descriptor to prevent React from setting it
                Object.defineProperty(textarea, 'autocapitalize', {
                  value: undefined,
                  writable: false,
                  configurable: true
                });
                // Also try setting it to empty string (some iOS versions prefer this)
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.removeAttribute('autocapitalize');
                    console.log('💬 Chat textarea: Re-checked after timeout');
                  }
                }, 0);
                console.log('💬 Chat textarea: Removed autocapitalize and locked property');
              } catch (err) {
                console.warn('💬 Chat textarea: Error removing autocapitalize', err);
              }
              console.log('💬 Chat textarea focused (AFTER)', {
                autocapitalize: textarea.getAttribute('autocapitalize'),
                autoCapitalize: (textarea as any).autocapitalize,
                hasAttribute: textarea.hasAttribute('autocapitalize'),
                tagName: textarea.tagName
              });
              
              // Note: The iOS caps lock inversion is handled by GlobalInputFix
              // The keyboard may appear in caps lock mode, but GlobalInputFix will
              // correct the characters as you type
            }}
          className="focus:outline-none resize-none text-sm text-black caret-black"
          style={{
            margin: 0,
            marginLeft: '8px', // Gap between + button and text input
            marginRight: '8px', // Gap between text input and send button
            padding: '8px',
            lineHeight: '1.2',
            boxSizing: 'border-box',
            minHeight: '32px',
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none'
          }}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && (messageText.trim() || pendingMedia.length > 0)) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
          
        {/* Send Button - Same size as + button */}
        <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (messageText.trim() || pendingMedia.length > 0) {
                handleSendMessage();
              }
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Don't call handleSendMessage here - let onClick handle it
              // This prevents double submission on iOS
            }}
          disabled={!messageText.trim() && pendingMedia.length === 0}
          className={`flex-shrink-0 flex items-center justify-center transition-all ${
            messageText.trim() || pendingMedia.length > 0
              ? "cursor-pointer" 
              : "cursor-not-allowed opacity-50"
          }`}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'white',
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
          }}
          onMouseEnter={(e) => {
            if (messageText.trim() || pendingMedia.length > 0) {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
        >
          <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20" style={{ strokeWidth: 2.5 }}>
            <path fillRule="evenodd" d="M10 17a1 1 0 01-1-1V6.414l-2.293 2.293a1 1 0 11-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 01-1 1z" clipRule="evenodd" />
          </svg>
        </button>
        </div>
      </div>

      {/* Chat Section - Scrollable messages area - Use paddingTop instead of top offset to avoid white gap */}
      <div 
        className="px-4 overflow-y-auto chat-messages-container"
        style={{
          height: '100vh', // Full viewport height - input overlays on top
          paddingTop: '160px', // Space for header (110px) + nice spacing before first message (50px)
          paddingBottom: pendingMedia.length > 0 ? '180px' : '100px', // More space when photos are shown (expanded input box)
          position: 'relative',
          overflowY: 'scroll',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: 'transparent',
          zIndex: 1, // Normal z-index, individual messages control their own z-index
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          // NO top offset - use paddingTop instead to avoid creating white gap
          // Full height with paddingBottom ensures no gap at bottom
        }}
        data-messages-container="true"
        onScroll={() => {
          if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            const maxScroll = container.scrollHeight - container.clientHeight;
            const currentScroll = container.scrollTop;
            const threshold = 100;
            const isAtBottom = (maxScroll - currentScroll) <= threshold;
            setShowScrollToBottom(!isAtBottom);
          }
        }}
        ref={(el) => {
          messagesContainerRef.current = el;
          if (el) {
            console.log('🔍 Chat container height calculation:', {
              viewportHeight: window.innerHeight,
              dvh: window.innerHeight,
              calculatedHeight: window.innerHeight - 200,
              actualHeight: el.offsetHeight,
              style: el.style.height,
              computedStyle: window.getComputedStyle(el).height,
              top: el.style.top,
              paddingTop: el.style.paddingTop,
              paddingBottom: el.style.paddingBottom
            });
          }
        }}
      >
        {messages.map((message, index) => {
          // Check if this is an optimistic message with loading state
          const optimisticState = optimisticMessages.get(message.id);
          const isOptimistic = message.id.startsWith('optimistic_');
          
          // Show loading card for optimistic messages
          if (isOptimistic && optimisticState) {
            const isOwnMessage = message.sender_id === account?.id;
            return (
              <div 
                key={message.id}
                className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <LoadingMessageCard 
                  fileCount={optimisticState.fileCount}
                  status={optimisticState.status}
                />
              </div>
            );
          }
          
          // Regular message
          const isMe = message.sender_id === account?.id;
          const isLongPressed = longPressedMessage?.id === message.id;
          
          // Check if this message is being replied to
          const isBeingRepliedTo = replyToMessage?.id === message.id;
          
          return (
            <div 
              key={message.id} 
              data-message-id={message.id}
              style={{ 
                marginBottom: index < messages.length - 1 ? '12px' : '12px',
                position: 'relative',
                zIndex: isLongPressed ? 101 : (isBeingRepliedTo ? 51 : 1), // Message being replied to above blur overlay (40), selected message above overlay (98), others below
                opacity: 1, // No dimming - all messages remain at full brightness
                pointerEvents: 'auto', // All messages remain interactive
                isolation: (isLongPressed || isBeingRepliedTo) ? 'isolate' : 'auto' // Create new stacking context for selected/replied-to message to prevent opacity inheritance
              }}
            >
              {/* Regular message display - selected message will be rendered outside container */}
              <div style={{ 
                position: 'relative', 
                zIndex: 1, 
                opacity: 1 // No dimming - all messages remain at full brightness
              }}>
                <MessageBubble
                  message={message}
                  currentUserId={currentUserId}
                  onReactionToggle={(emoji: string, msgId: string) => {
                    if (msgId === message.id) {
                      handleReact(message, emoji);
                    }
                  }}
                  onReactionClick={(msgId: string) => {
                    setReactionsModalMessageId(msgId);
                  }}
                  onAttachmentClick={handleAttachmentClick}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  onLongPress={handleLongPress}
                  onReplyCardClick={handleReplyCardClick}
                  onProfileClick={handleProfileClick}
                />
              </div>
            </div>
          );
        })}
        
        {/* Typing Indicator - shows as a message-like card */}
        {typingUsers.length > 0 && typingUsers.map((typingUserId, index) => {
          const typingUser = participants.find(p => p.id === typingUserId);
          if (!typingUser || typingUser.id === account?.id) return null;
          
          return (
            <div 
              key={typingUserId}
              ref={index === typingUsers.length - 1 ? typingIndicatorRef : null}
              className="flex items-center gap-2 justify-start"
              style={{ marginBottom: '12px' }}
            >
              {/* Avatar */}
              <div className="flex-shrink-0" style={{ width: '32px', height: '32px' }}>
                <Avatar
                  src={typingUser.profile_pic || undefined}
                  name={typingUser.name || 'User'}
                  size={32}
                />
              </div>
              
              {/* Typing message card - matches message bubble styling exactly */}
              <div
                className="bg-white text-gray-900 rounded-2xl px-4 py-3 max-w-[70%]"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  minHeight: '47.9px', // Exact height: 0.4px (top border) + 12px (top padding) + 23.1px (14px * 1.65 line-height) + 12px (bottom padding) + 0.4px (bottom border) = 47.9px
                  height: '47.9px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {/* Match the same text styling as message bubbles for consistent height */}
                <div className="text-sm leading-relaxed" style={{ lineHeight: '1.65' }}>
                  <div className="flex space-x-1.5" data-typing-dots="true">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      data-typing-dot="true"
                      style={{
                        transform: typingAnimationPhase === 0 ? 'translateY(-8px)' : 'translateY(0)',
                        opacity: typingAnimationPhase === 0 ? 1 : 0.7,
                        transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                      } as React.CSSProperties}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      data-typing-dot="true"
                      style={{
                        transform: typingAnimationPhase === 1 ? 'translateY(-8px)' : 'translateY(0)',
                        opacity: typingAnimationPhase === 1 ? 1 : 0.7,
                        transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                      } as React.CSSProperties}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      data-typing-dot="true"
                      style={{
                        transform: typingAnimationPhase === 2 ? 'translateY(-8px)' : 'translateY(0)',
                        opacity: typingAnimationPhase === 2 ? 1 : 0.7,
                        transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                      } as React.CSSProperties}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Scroll anchor - placed after typing indicator */}
        <div ref={messagesEndRef} style={{ height: '0px', margin: '0px', padding: '0px' }} />
      </div>

      {/* Scroll to Bottom Button - Only show when scrolled up from bottom */}
      {showScrollToBottom && chatInputRef.current && (
        <button
          onClick={() => {
            if (messagesContainerRef.current) {
              const container = messagesContainerRef.current;
              const maxScroll = container.scrollHeight - container.clientHeight;
              container.scrollTo({
                top: maxScroll,
                behavior: 'smooth'
              });
              setShowScrollToBottom(false);
            }
          }}
          className="fixed z-40 flex items-center justify-center transition-all duration-200"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            bottom: chatInputRef.current ? `${chatInputRef.current.getBoundingClientRect().height + 40}px` : '140px',
            right: '16px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
        >
          <svg 
            className="w-5 h-5 text-gray-900" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ transform: 'rotate(270deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Blur overlay for long press - blurs entire page except selected message and cards */}
      {longPressedMessage && (
        <div
          ref={(el) => {
            if (el) {
              // DIAGNOSTIC: Log overlay styles
              setTimeout(() => {
                const computed = window.getComputedStyle(el);
                console.log('🔍 Overlay - Computed Styles:', {
                  opacity: computed.opacity,
                  backgroundColor: computed.backgroundColor,
                  backdropFilter: computed.backdropFilter,
                  webkitBackdropFilter: (computed as any).webkitBackdropFilter,
                  zIndex: computed.zIndex,
                  position: computed.position
                });
              }, 0);
            }
          }}
          onClick={handleCloseLongPress}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)', // Slight darkening
            backdropFilter: 'blur(8px)', // Blur effect
            // @ts-ignore - WebkitBackdropFilter is valid CSS but not in TypeScript types
            WebkitBackdropFilter: 'blur(8px)', // Safari support
            zIndex: 98,
            pointerEvents: 'auto'
          }}
        />
      )}

      {/* Selected message and cards - rendered OUTSIDE messages container to avoid blur */}
      {longPressedMessage && longPressedPosition && (() => {
        const constrained = calculateConstrainedPositions();
        if (!constrained) return null;

        return (
        <>
          {/* Reaction card - above message */}
          <div
            ref={emojiCardRef}
            style={{
              position: 'fixed',
              top: constrained.emojiTop,
              left: longPressedPosition.isOwnMessage ? 'auto' : longPressedPosition.left,
              right: longPressedPosition.isOwnMessage ? window.innerWidth - longPressedPosition.right : 'auto',
              zIndex: 200, // High z-index to be above blur overlay (98)
              opacity: 1,
              pointerEvents: 'auto',
              transform: 'translateY(-100%) translateZ(0)',
              filter: 'none',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none' as any,
              willChange: 'transform',
              isolation: 'isolate',
              display: 'flex',
              justifyContent: longPressedPosition.isOwnMessage ? 'flex-end' : 'flex-start'
            }}
          >
            <MessageReactionCard
              messageId={longPressedMessage.id}
              onReactionSelect={(emoji) => {
                handleReact(longPressedMessage, emoji);
                handleCloseLongPress();
              }}
            />
          </div>

          {/* Message bubble - selected message */}
          <div
            style={{
              position: 'fixed',
              top: constrained.messageTop,
              left: longPressedPosition.isOwnMessage ? 'auto' : longPressedPosition.left,
              right: longPressedPosition.isOwnMessage ? window.innerWidth - longPressedPosition.right : 'auto',
              zIndex: 199, // High z-index to be above blur overlay (98), below cards (200)
              opacity: 1,
              pointerEvents: 'auto',
              transform: 'translateZ(0)',
              filter: 'none',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none' as any,
              willChange: 'transform',
              isolation: 'isolate',
              width: `${longPressedPosition.width}px`, // Preserve original width to prevent shrinking
              maxWidth: '100%' // Still respect viewport limits
            }}
          >
            <MessageBubble
              message={longPressedMessage}
              currentUserId={currentUserId}
              onReactionToggle={(emoji: string, msgId: string) => {
                if (msgId === longPressedMessage.id) {
                  handleReact(longPressedMessage, emoji);
                }
              }}
              onAttachmentClick={handleAttachmentClick}
              onReply={handleReply}
              onDelete={handleDelete}
              onLongPress={handleLongPress}
            />
          </div>

          {/* Action card - below message */}
          <div
            ref={actionCardRef}
            style={{
              position: 'fixed',
              top: constrained.actionTop,
              left: longPressedPosition.isOwnMessage ? 'auto' : longPressedPosition.left,
              right: longPressedPosition.isOwnMessage ? window.innerWidth - longPressedPosition.right : 'auto',
              zIndex: 200, // High z-index to be above blur overlay (98)
              opacity: 1,
              pointerEvents: 'auto',
              transform: 'translateZ(0)',
              filter: 'none',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none' as any,
              willChange: 'transform',
              isolation: 'isolate',
              display: 'flex',
              justifyContent: longPressedPosition.isOwnMessage ? 'flex-end' : 'flex-start'
            }}
          >
            <MessageActionCard
              messageId={longPressedMessage.id}
              isOwnMessage={longPressedPosition.isOwnMessage}
              showDeleteConfirmation={deleteConfirmationMessageId === longPressedMessage.id}
              onReply={() => {
                handleReply(longPressedMessage);
                handleCloseLongPress();
              }}
              onCopy={() => {
                handleCopy(longPressedMessage);
                handleCloseLongPress();
              }}
              onDelete={() => {
                handleDelete(longPressedMessage.id);
              }}
              onDeleteConfirm={() => {
                handleDeleteConfirm(longPressedMessage.id);
              }}
              onCancel={handleDeleteCancel}
            />
          </div>
        </>
        );
      })()}

      {/* Message Action Modal */}
      <MessageActionModal
        selectedMessage={selectedMessage}
        messageElement={selectedMessageElement}
        onClose={() => {
          setSelectedMessage(null);
          setSelectedMessageElement(null);
        }}
        onReply={handleReply}
        onCopy={handleCopy}
        onDelete={handleDeleteFromModal}
        onReact={handleReact}
        isMe={selectedMessage?.sender_id === account?.id}
      />

      {/* Chat Photos Grid Modal */}
      {showGridModal && gridModalAttachments.length > 0 && (
        <ChatPhotosGridModal
          isOpen={showGridModal}
          attachments={gridModalAttachments}
          onClose={() => {
            setShowGridModal(false);
            setGridModalAttachments([]);
          }}
        />
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        userId={profileModalUserId}
        onClose={() => {
          // Simply close the modal - chat page remains visible underneath
          // No navigation needed - modal is just an overlay
          setShowProfileModal(false);
          setProfileModalUserId(null);
        }}
      />

      {/* Chat Photo Viewer - For direct image clicks */}
      {showMediaViewer && viewerMedia.length > 0 && (
        <ChatPhotoViewer
        isOpen={showMediaViewer}
          attachments={viewerMedia}
          initialIndex={selectedMediaIndex}
          onClose={() => {
            setShowMediaViewer(false);
            setViewerMedia([]);
          }}
      />
      )}

      {/* Reactions Modal */}
      {reactionsModalMessageId && (() => {
        const message = messages.find(m => m.id === reactionsModalMessageId);
        if (!message || !message.reactions) return null;
        
        return (
          <ReactionsModal
            isOpen={!!reactionsModalMessageId}
            onClose={() => setReactionsModalMessageId(null)}
            messageId={reactionsModalMessageId}
            reactions={message.reactions}
            onReactionRemoved={async () => {
              // Refresh messages to get updated reactions
              if (conversation?.id && chatService) {
                const { messages: updatedMessages } = await chatService.getChatMessages(conversation.id);
                if (updatedMessages) {
                  setMessages(updatedMessages);
                }
              }
            }}
          />
        );
      })()}
    </div>
  );
}
