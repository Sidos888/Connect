"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { useAppStore } from "@/lib/store";
import { ArrowLeft, X } from "lucide-react";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageActionModal from "@/components/chat/MessageActionModal";
import MediaUploadButton, { UploadedMedia } from "@/components/chat/MediaUploadButton";
import MediaPreview from "@/components/chat/MediaPreview";
import MediaViewer from "@/components/chat/MediaViewer";
import LoadingMessageCard from "@/components/chat/LoadingMessageCard";
import MessageReactionCard from "@/components/chat/MessageReactionCard";
import MessageActionCard from "@/components/chat/MessageActionCard";
import type { SimpleMessage, MediaAttachment } from "@/lib/types";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Avatar from "@/components/Avatar";

export default function IndividualChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chat');
  const { account } = useAuth();
  const chatService = useChatService();
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
  const [longPressedPosition, setLongPressedPosition] = useState<{ top: number; left: number; right: number; bottom: number; isOwnMessage: boolean } | null>(null);
  const longPressContainerRef = useRef<HTMLDivElement>(null);
  const [replyToMessage, setReplyToMessage] = useState<SimpleMessage | null>(null);
  const [pendingMedia, setPendingMedia] = useState<UploadedMedia[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, { status: 'uploading' | 'uploaded' | 'failed'; fileCount: number }>>(new Map());
  const isSendingRef = useRef(false);
  const unsubscribeReactionsRef = useRef<(() => void) | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);

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
  
  // Media viewer states (kept for potential future use)
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [viewerMedia, setViewerMedia] = useState<MediaAttachment[]>([]); // Only media from clicked message
  const [allChatMedia, setAllChatMedia] = useState<MediaAttachment[]>([]); // All chat media (for future use)
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

  // Load conversation and messages
  useEffect(() => {
    const loadData = async () => {
      if (!account?.id || !chatId) {
        setError('User not authenticated or chat ID missing');
        setLoading(false);
        return;
      }

      try {
        // Load conversation from database
        if (!chatService) {
          console.error('IndividualChatPage: ChatService not available');
          setError('Chat service not available');
          setLoading(false);
          return;
        }
        
        const { chat, error: chatError } = await chatService.getChatById(chatId);
        if (chatError || !chat) {
          setError('Conversation not found');
          setLoading(false);
          return;
        }

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

        console.log('Individual chat page: Chat data loaded from database:', chat);
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

        // TODO: Add reaction subscriptions when implemented
        // Reactions feature not yet implemented in ChatService

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
  }, [account?.id, chatId]);

  // Track if we've scrolled to bottom on initial load
  const hasScrolledToBottomRef = useRef(false);

  // Scroll to bottom when messages change or when loading completes
  useEffect(() => {
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

  // Mark messages as read when chat is loaded
  useEffect(() => {
    if (!hasMarkedAsRead.current && account?.id && chatId && conversation && chatService) {
      chatService.markMessagesAsRead(chatId, account.id);
      hasMarkedAsRead.current = true;
    }
  }, [conversation, chatId, account?.id, chatService]);


  // Helper function to upload file to Supabase Storage (iOS-compatible)
  const uploadFileToStorage = async (file: File, chatId: string, index: number): Promise<{ file_url: string; thumbnail_url?: string; width?: number; height?: number }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Generate unique filename with chatId prefix
    const fileExt = file.name.split('.').pop();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();
    const baseFileName = `${timestamp}_${index}_${randomSuffix}.${fileExt}`;
    const fileName = `${chatId}/${baseFileName}`;

    console.log(`  📤 Uploading file ${index + 1}: ${file.name}`, {
      fileName,
      fileSize: file.size,
      fileType: file.type
    });

    // Check if we're on Capacitor (iOS/Android)
    const isCapacitor = !!(window as any).Capacitor;
    
    if (isCapacitor) {
      // Use Capacitor HTTP to bypass WebKit limitations
      console.log(`  🔄 Using Capacitor HTTP for native upload...`);
      
      try {
        // Get auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('No auth session available');
        }

        // Get Supabase URL and keys
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase configuration missing');
        }

        // Read file as ArrayBuffer and create Blob for upload
        console.log(`  📖 Reading file as ArrayBuffer...`);
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

        console.log(`  ✅ File converted to ArrayBuffer (${Math.round(arrayBuffer.byteLength / 1024)}KB)`);

        // Create Blob from ArrayBuffer
        const blob = new Blob([arrayBuffer], { type: file.type });

        // Use Capacitor HTTP plugin - Supabase Storage API expects binary data
        const { CapacitorHttp } = await import('@capacitor/core');
        
        const uploadUrl = `${supabaseUrl}/storage/v1/object/chat-media/${fileName}`;
        console.log(`  ⬆️ Uploading via Capacitor HTTP to: ${uploadUrl.substring(0, 80)}...`);

        // Convert ArrayBuffer to base64 for Capacitor HTTP
        // Supabase Storage API can accept base64, but we need to send it correctly
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        );

        // Use Capacitor HTTP with base64 data
        // Note: Supabase Storage API expects the raw file bytes
        const response = await CapacitorHttp.post({
          url: uploadUrl,
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseAnonKey,
            'Content-Type': file.type,
            'x-upsert': 'false',
            'cache-control': '3600'
          },
          data: base64,
          responseType: 'text' // Expect text response, not JSON
        });

        if (response.status < 200 || response.status >= 300) {
          console.error(`  ❌ Upload failed:`, {
            status: response.status,
            data: response.data
          });
          throw new Error(`Upload failed: ${response.status} (${typeof response.data === 'string' ? response.data.substring(0, 100) : 'Unknown error'})`);
        }

        console.log(`  ✅ Capacitor HTTP upload completed successfully`);
      } catch (capacitorError: any) {
        console.error(`  ❌ Capacitor HTTP upload failed:`, capacitorError);
        console.log(`  ⚠️ Falling back to Supabase JS client...`);
        
        // Fallback to Supabase JS client
        const { data, error } = await supabase.storage
          .from('chat-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error(`  ❌ Fallback upload also failed:`, error);
          throw new Error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
        }
      }
    } else {
      // Use standard Supabase JS client for web
      console.log(`  ⬆️ Uploading to Supabase Storage (web)...`);
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error(`  ❌ Upload error:`, {
          error,
          errorName: error.name,
          errorMessage: error.message,
          fileName,
          fileSize: file.size,
          fileType: file.type
        });
        throw new Error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
      }
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
            // New flow: Upload files now (using stored mediaToUpload array)
            const uploadPromises = mediaToUpload.map(async (media, index) => {
              if (!media.file) {
                throw new Error(`File object missing for media ${index + 1}`);
              }

              const uploadResult = await uploadFileToStorage(media.file, conversation.id, index);
              
              return {
                id: `temp_${Date.now()}_${index}`,
                file_url: uploadResult.file_url,
                file_type: media.file_type,
                thumbnail_url: uploadResult.thumbnail_url ?? media.thumbnail_url ?? undefined,
                width: uploadResult.width || media.width,
                height: uploadResult.height || media.height
              } as MediaAttachment;
            });

            attachments = await Promise.all(uploadPromises);
            console.log('✅ All files uploaded:', {
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
          attachments.length > 0 ? attachments : undefined
        );

        console.log('📬 sendMessage response:', {
          hasMessage: !!newMessage,
          messageId: newMessage?.id,
          hasError: !!messageError,
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

        // Wait a brief moment for the database to be fully updated
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log('🔄 Refreshing messages to show attachments...');
        // Refresh messages to show the new message with attachments
        // This replaces all messages, so we don't need to manually add newMessage
        const { messages: updatedMessages } = await chatService?.getChatMessages(conversation.id);
        if (updatedMessages) {
          console.log('✅ Messages refreshed, count:', updatedMessages.length);
          // Use functional update to ensure we're working with latest state
          setMessages(prev => {
            // Remove any optimistic messages that might still be there
            const withoutOptimistic = prev.filter(msg => !msg.id.startsWith('optimistic_'));
            // Merge with fresh messages from database, avoiding duplicates
            const existingIds = new Set(withoutOptimistic.map(m => m.id));
            const newMessages = updatedMessages.filter(m => !existingIds.has(m.id));
            return [...withoutOptimistic, ...newMessages];
          });
        } else {
          console.warn('⚠️ No messages returned from refresh');
        }
        
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
    setReplyToMessage(message);
    setSelectedMessage(null);
    setLongPressedMessage(null);
    setLongPressedElement(null);
    setLongPressedPosition(null);
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
      isOwnMessage: isMe
    });
  };

  // Close long press state
  const handleCloseLongPress = () => {
    setLongPressedMessage(null);
    setLongPressedElement(null);
    setLongPressedPosition(null);
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
        longPressedElement?.contains(target)
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
    navigator.clipboard.writeText(message.text || '');
  };

  const handleDelete = async (messageId: string) => {
    // TODO: Implement deleteMessage in ChatService
    console.log('Delete message not yet implemented:', messageId);
  };

  const handleDeleteFromModal = async (message: SimpleMessage) => {
    // Wrapper for MessageActionModal which expects SimpleMessage
    await handleDelete(message.id);
  };

  const handleReact = async (message: SimpleMessage, emoji: string) => {
    // TODO: Implement addReaction in ChatService
    console.log('Add reaction not yet implemented:', message.id, emoji);
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
    console.log('✅ pendingMedia state updated - files ready for upload on send');
  };

  const handleRemoveMedia = (index: number) => {
    setPendingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentClick = (message: SimpleMessage) => {
    // Navigate to chat photos page instead of opening modal
    if (message.attachments && message.attachments.length > 0) {
      router.push(`/chat/photos?messageId=${message.id}`);
    }
  };


  const cancelReply = () => {
    setReplyToMessage(null);
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
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
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

  // Profile card component - Full width with page padding
  const profileCard = (
    <div
      className="absolute left-0 right-0 flex items-center justify-center"
      style={{
        top: "50%",
        transform: "translateY(-50%)",
        paddingLeft: "72px", // Back button (44px) + spacing (12px) + page padding (16px)
        paddingRight: "16px",
        height: "100%",
      }}
    >
      <button 
        onClick={() => {
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
        }}
        className="w-full flex items-center"
        style={{
          padding: "10px 18px",
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.96)",
          borderWidth: "0.4px",
          borderColor: "#E5E7EB",
          borderStyle: "solid",
          boxShadow:
            "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)",
          willChange: "transform, box-shadow",
          height: "60px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
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
        {isEventChat && eventListing ? (
          // Event chat: squared image
          <div 
            className="w-10 h-10 bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 rounded-md"
            style={{
              borderWidth: '0.5px',
              borderStyle: 'solid',
              borderColor: 'rgba(0, 0, 0, 0.08)'
            }}
          >
            {eventListing.photo_urls && eventListing.photo_urls.length > 0 ? (
            <Image
                src={eventListing.photo_urls[0]}
                alt={eventListing.title}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-sm font-semibold">
                {eventListing.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        ) : (
          // Regular chat: circular avatar
          <Avatar
            src={conversation.avatarUrl}
            name={conversation.title}
            size={40}
          />
        )}
        <div className="text-left min-w-0 flex-1">
          <div className="font-semibold text-gray-900 text-base truncate">
            {isEventChat && eventListing ? eventListing.title : conversation.title}
          </div>
          {isEventChat && (
            <div className="text-xs text-gray-500">
              {formatListingDateTime(eventListing?.start_date ?? null)}
            </div>
          )}
        </div>
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
      />

      {/* Reply Preview - Only show when actually replying */}
      {replyToMessage && (
        <div 
          className="bg-gray-50 border-t border-gray-200 px-4 fixed left-0 right-0 z-30"
          style={{ 
            height: '60px', 
            paddingTop: '8px', 
            paddingBottom: '8px',
            bottom: '80px'
          }}
        >
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">
                Replying to {replyToMessage.sender_name || 'Unknown'}
              </div>
              <div className="text-sm text-gray-800 truncate">
                {typeof replyToMessage.text === 'string' ? replyToMessage.text : 'Media message'}
              </div>
            </div>
            <button
              onClick={cancelReply}
              className="ml-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input Card - Expands when photos are selected */}
      <div 
        className="fixed z-20"
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
          onChange={(e) => setMessageText(e.target.value)}
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
          
          return (
            <div 
              key={message.id} 
              style={{ 
                marginBottom: index < messages.length - 1 ? '12px' : '12px',
                position: 'relative',
                zIndex: isLongPressed ? 101 : 1, // Selected message above overlay (98), others below
                opacity: 1, // No dimming - all messages remain at full brightness
                pointerEvents: 'auto', // All messages remain interactive
                isolation: isLongPressed ? 'isolate' : 'auto' // Create new stacking context for selected message to prevent opacity inheritance
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
                  currentUserId={account?.id || ''}
                  onReactionToggle={(emoji: string, msgId: string) => {
                    if (msgId === message.id) {
                      handleReact(message, emoji);
                    }
                  }}
                  onAttachmentClick={handleAttachmentClick}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  onLongPress={handleLongPress}
                />
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} style={{ height: '0px', margin: '0px', padding: '0px' }} />
      </div>

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
      {longPressedMessage && longPressedPosition && (
        <>
          {/* Reaction card - above message */}
          <div
            style={{
              position: 'fixed',
              top: longPressedPosition.top - 8, // Position top edge 8px above message
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
                console.log('Reaction selected:', emoji, longPressedMessage.id);
                handleCloseLongPress();
              }}
            />
          </div>

          {/* Message bubble - selected message */}
          <div
            style={{
              position: 'fixed',
              top: longPressedPosition.top,
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
              width: 'auto',
              maxWidth: '100%'
            }}
          >
            <MessageBubble
              message={longPressedMessage}
              currentUserId={account?.id || ''}
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
            style={{
              position: 'fixed',
              top: longPressedPosition.bottom + 8, // Position below message
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
              onReply={() => {
                handleReply(longPressedMessage);
                handleCloseLongPress();
              }}
              onCopy={() => {
                console.log('Copy message:', longPressedMessage.id);
                handleCloseLongPress();
              }}
              onDelete={() => {
                handleDelete(longPressedMessage.id);
                handleCloseLongPress();
              }}
            />
          </div>
        </>
      )}

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

      {/* Media Viewer */}
      <MediaViewer
        isOpen={showMediaViewer}
        allMedia={viewerMedia}
        initialIndex={viewerStartIndex}
        onClose={() => setShowMediaViewer(false)}
      />

    </div>
  );
}
