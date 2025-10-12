"use client";

import { useAppStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import type { Conversation } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import { simpleChatService } from "@/lib/simpleChatService";
import { useRouter } from "next/navigation";
import InlineProfileView from "@/components/InlineProfileView";
import GroupInfoModal from "@/components/chat/GroupInfoModal";
import SettingsModal from "@/components/chat/SettingsModal";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageActionModal from "@/components/chat/MessageActionModal";
import MediaUploadButton, { UploadedMedia } from "@/components/chat/MediaUploadButton";
import MediaPreview from "@/components/chat/MediaPreview";
import GalleryModal from "@/components/chat/GalleryModal";
import MediaViewer from "@/components/chat/MediaViewer";
import AttachmentMenu from "@/components/chat/AttachmentMenu";
import type { SimpleMessage, MediaAttachment } from "@/lib/simpleChatService";

// Generate video thumbnail using HTML5 video + canvas API
const generateVideoThumbnail = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    
    video.onloadeddata = () => {
      video.currentTime = 1; // Get frame at 1 second
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.7);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
  });
};

// Get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
};

// Get image dimensions from URL
const getImageDimensionsFromUrl = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image from URL'));
    };
    img.src = url;
  });
};

interface PersonalChatPanelProps {
  conversation: Conversation;
}

export default function PersonalChatPanel({ conversation }: PersonalChatPanelProps) {
  
  // Add error boundary for missing conversation
  if (!conversation || !conversation.id) {
    console.error('PersonalChatPanel: Invalid conversation object:', conversation);
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Error loading chat</p>
        </div>
      </div>
    );
  }
  
  const { markAllRead, getChatTyping } = useAppStore();
  const { account } = useAuth();
  const router = useRouter();
  const [text, setText] = useState("");
  // Simple local state management - bulletproof approach
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const hasMarkedAsRead = useRef(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [refreshedConversation, setRefreshedConversation] = useState<Conversation | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<SimpleMessage | null>(null);
  const [selectedMessageElement, setSelectedMessageElement] = useState<HTMLElement | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<SimpleMessage | null>(null);
  const [pendingMedia, setPendingMedia] = useState<UploadedMedia[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  // Media viewer states
  const [showGallery, setShowGallery] = useState(false);
  const [galleryMessage, setGalleryMessage] = useState<SimpleMessage | null>(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [allChatMedia, setAllChatMedia] = useState<MediaAttachment[]>([]);
  
  // Real-time state
  const [animationPhase, setAnimationPhase] = useState(0); // For JavaScript animation
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Message action handlers
  const handleMessageLongPress = (message: SimpleMessage) => {
    setSelectedMessage(message);
  };

  const handleReply = (message: SimpleMessage) => {
    setReplyToMessage(message);
    setSelectedMessage(null);
  };

  const handleCopy = (message: SimpleMessage) => {
    navigator.clipboard.writeText(message.text || '');
  };

  const handleDelete = async (message: SimpleMessage) => {
    if (account?.id) {
      await simpleChatService.deleteMessage(message.id, account.id);
    }
  };

  const handleReact = async (message: SimpleMessage, emoji: string) => {
    if (account?.id) {
      await simpleChatService.addReaction(message.id, account.id, emoji);
    }
  };

  const handleProfileClick = (userId: string) => {
    setProfileUserId(userId);
    setShowUserProfile(true);
  };

  const handleMediaSelected = (media: UploadedMedia[]) => {
    console.log('📥 PersonalChatPanel received media:', media.length, 'items');
    const startRender = performance.now();
    setPendingMedia(media);
    console.log(`🎨 setPendingMedia called in ${(performance.now() - startRender).toFixed(2)}ms`);
  };

  const handleRemoveMedia = (index: number) => {
    setPendingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentClick = (message: SimpleMessage) => {
    setGalleryMessage(message);
    setShowGallery(true);
  };

  const handleGalleryImageClick = (index: number) => {
    // Find the starting index in allChatMedia for this message's attachments
    let startIndex = 0;
    for (let i = 0; i < allChatMedia.length; i++) {
      if (allChatMedia[i].id === galleryMessage?.attachments?.[0]?.id) {
        startIndex = i;
        break;
      }
    }
    
    setViewerStartIndex(startIndex + index);
    setShowMediaViewer(true);
    setShowGallery(false);
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const cancelMedia = () => {
    setPendingMedia([]);
  };

  const handleAttachmentMenuOpen = () => {
    setShowAttachmentMenu(true);
  };

  const handleAttachmentMenuClose = () => {
    setShowAttachmentMenu(false);
  };

  const handleFileSelect = (type: 'file' | 'photos' | 'contact' | 'event' | 'ai') => {
    setShowAttachmentMenu(false);
    
    // Create a hidden file input to trigger native file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    // Set accept attribute based on type
    if (type === 'photos') {
      input.accept = 'image/*,video/*';
    } else if (type === 'file') {
      input.accept = '*/*'; // All file types
    }
    
    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        await handleFileUpload(Array.from(files));
      }
    };
    
    // Trigger the native file picker
    input.click();
  };

  const handleFileUpload = async (files: File[]) => {
    
    try {
      const { getSupabaseClient } = await import('@/lib/supabaseClient');
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }
      const uploadedMedia: UploadedMedia[] = [];
      
      for (const file of files) {
        // Validate file type for images/videos only for now
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          console.warn(`Skipping file ${file.name} - not an image or video`);
          continue;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        // Upload file to Supabase Storage
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Failed to upload to Supabase Storage:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(uploadData.path);

        const uploadSuccess = true; // Successfully uploaded to Supabase Storage
        // Upload logging removed for performance

        // Determine file type and get metadata
        const file_type: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';
        let thumbnail_url: string | undefined;
        let width: number | undefined;
        let height: number | undefined;

        try {
          if (file_type === 'video') {
            // Generate video thumbnail
            thumbnail_url = await generateVideoThumbnail(file);
            // For videos, get dimensions from video element
            const video = document.createElement('video');
            video.src = publicUrl; // Use the Supabase Storage URL
            await new Promise((resolve) => {
              video.onloadedmetadata = resolve;
            });
            width = video.videoWidth;
            height = video.videoHeight;
          } else {
            // Get image dimensions from the uploaded URL
            const dimensions = await getImageDimensionsFromUrl(publicUrl);
            width = dimensions.width;
            height = dimensions.height;
          }
        } catch (metadataError) {
          console.warn('Failed to extract metadata for', file.name, metadataError);
          // Continue without metadata rather than failing the upload
        }

        const mediaItem = {
          file_url: publicUrl,
          file_type,
          thumbnail_url,
          width,
          height,
          file_size: file.size
        };
        
        // Media item logging removed for performance
        uploadedMedia.push(mediaItem);
      }
      
      if (uploadedMedia.length > 0) {
        setPendingMedia(uploadedMedia);
      }
    } catch (error) {
      console.error('Error handling file upload:', error);
      alert('Failed to upload files');
    }
  };

  const removeMediaItem = (index: number) => {
    setPendingMedia(prev => prev.filter((_, i) => i !== index));
  };
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get typing users from global store
  const typingState = getChatTyping(conversation.id);
  const typingUsers = typingState?.typingUsers || [];
  
  // Pending messages are now handled by the store


  // Load participants and messages from the database
  useEffect(() => {
    let unsubscribeMessages: (() => void) | null = null;
    
    // useEffect logging removed for performance
    const loadData = async () => {
      if (conversation.id && account?.id) {
        // Only set loading if we don't have messages yet (prevents flicker on chat switch)
        if (messages.length === 0) {
          setLoading(true);
        }
        
        // Load chat details to get participants
        const { chat, error: chatError } = await simpleChatService.getChatById(conversation.id);
        if (chatError) {
          console.error('PersonalChatPanel: Error loading chat details:', chatError);
          setLoading(false);
          return;
        }
        if (!chat) {
          console.error('PersonalChatPanel: Chat not found for ID:', conversation.id);
          setLoading(false);
          return;
        }
        
        // Verify chat is properly cached
        // Note: Chat should now be cached from the getChatById call above
        
        setParticipants(chat.participants || []);
        
        // For group chats, refresh the conversation data with fresh photo
        if (conversation.isGroup) {
          const updatedConversation = {
            ...conversation,
            avatarUrl: chat.photo || null
          };
          setRefreshedConversation(updatedConversation);
        } else {
          setRefreshedConversation(conversation);
        }
        
        // Load messages directly - simple and bulletproof
        // NEW: getChatMessages now returns hasMore for pagination
        const { messages: chatMessages, error: messagesError, hasMore } = await simpleChatService.getChatMessages(conversation.id, account.id);
        if (messagesError) {
          console.error('PersonalChatPanel: Error loading messages:', messagesError);
        } else {
          // NEW: Messages are now ordered by seq (deterministic ordering)
          setMessages(chatMessages || []);
        }

        // Load all chat media for the viewer
        try {
          const chatMedia = await simpleChatService.getChatMedia(conversation.id);
          setAllChatMedia(chatMedia);
        } catch (error) {
          console.error('Failed to load chat media:', error);
          console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            chatId: conversation.id
          });
          // Don't fail the entire chat load if media loading fails
          setAllChatMedia([]); // Set empty array as fallback
        }
        
        // Simple real-time subscription for this chat only
        unsubscribeMessages = simpleChatService.subscribeToMessages(
          conversation.id,
          (newMessage) => {
            setMessages(prev => {
              // Check if message already exists to prevent duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              
              // NEW: Add new message and sort by seq (deterministic ordering)
              const updated = [...prev, newMessage];
              
              // Sort by seq if available, fallback to created_at for legacy messages
              updated.sort((a, b) => {
                if (a.seq !== undefined && b.seq !== undefined) {
                  return a.seq - b.seq;
                }
                // Fallback to created_at for messages without seq
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              });
              
              return updated;
            });
          }
        );
        
        setLoading(false);
        
        // Scroll to bottom after messages are loaded
        setTimeout(() => {
          endRef.current?.scrollIntoView({ behavior: "instant" });
        }, 100);
      }
    };

    loadData();
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, [conversation.id, account?.id]);

  useEffect(() => {
    if (!hasMarkedAsRead.current && account?.id) {
      markAllRead(conversation.id, account.id);
      hasMarkedAsRead.current = true;
    }
  }, [conversation.id, markAllRead, account?.id]);

  // Auto-scroll to bottom when messages change or typing indicator appears/disappears
  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, typingUsers.length]);

  // JavaScript animation for typing dots
  useEffect(() => {
    if (typingUsers.length > 0) {
      const animate = () => {
        setAnimationPhase(prev => {
          const newPhase = (prev + 1) % 4;
          return newPhase;
        });
        animationRef.current = setTimeout(animate, 350); // ~1.4s total cycle
      };
      animate();
    } else {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [typingUsers.length]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      // Clear animation timeout
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
      
      // No pending message cleanup needed
      
      console.log('PersonalChatPanel: Cleanup completed for conversation', conversation.id);
    };
  }, [conversation.id]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!account?.id || !conversation.id) return;
    
    // Send typing indicator
    simpleChatService.sendTypingIndicator(conversation.id, account.id, true);
    
    // Clear any existing timeout - we don't want it to auto-stop while focused
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Use refreshed conversation data if available, otherwise fall back to original
  const displayConversation = refreshedConversation || conversation;
  
  // Debug logging

  return (
        <div className="flex flex-col h-full bg-white">
          {/* Header - match left column; place profile card inside aligned to bottom */}
        <div className="flex-shrink-0 px-4 py-3 lg:p-6 bg-white border-b border-gray-200 h-[85px] lg:h-[85px]">
        <div className="flex justify-center items-center h-full">
          {/* Profile Card */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (!displayConversation.isGroup) {
                // Direct message - find the other participant
                const otherParticipant = participants.find((p: any) => p.id !== account?.id);
                if (otherParticipant) {
                  setProfileUserId(otherParticipant.id);
                  setShowUserProfile(true);
                }
              } else {
                // Group chat - show group info modal
                setShowGroupInfo(true);
              }
            }}
            className="bg-white rounded-2xl p-3 hover:bg-white transition-all duration-200 cursor-pointer w-full lg:w-1/3 relative"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
          >
            {displayConversation.isGroup && /^Me:\\s*/.test(displayConversation.title) ? (
              <div className="w-full flex items-center justify-center">
                <div className="font-semibold text-gray-900 text-base">
                  {displayConversation.title.replace(/^Me:\s*/, '')}
                </div>
                <div className="absolute right-3 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {displayConversation.avatarUrl ? (
                    <img
                      src={displayConversation.avatarUrl}
                      alt={displayConversation.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('PersonalChatPanel image failed to load:', displayConversation.avatarUrl, e);
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-sm font-semibold">
                      {displayConversation.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center">
                  <div className="font-semibold text-gray-900 text-base">{displayConversation.title}</div>
                </div>
                {/* Spacer to balance avatar width so name is visually centered */}
                <div className="w-10" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Messages Container - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          messages.map((m, index) => {
            // Create a unique key that combines ID with index to prevent duplicates
            const uniqueKey = `${m.id}_${index}_${m.created_at}`;
            
            return (
              <MessageBubble
                key={uniqueKey}
                message={m}
                currentUserId={account?.id || ''}
                onAttachmentClick={handleAttachmentClick}
                onReply={handleReply}
                showOptions={true}
              />
            );
          })
        )}
        
        <div ref={endRef} />
      </div>

      {/* Typing Indicator & Pending Messages - positioned at bottom, outside scrollable area */}
      {(typingUsers.length > 0 && !typingUsers.includes(account?.id || '')) && (() => {
        
        return (
          <div className="flex-shrink-0 px-6 pb-8 space-y-4">
            {typingUsers.map((typingUserId: string) => {
              let typingUser = participants.find(p => p.id === typingUserId);
              
              // If typing user not found in participants, create a placeholder
              if (!typingUser) {
                typingUser = {
                  id: typingUserId,
                  name: 'Typing User',
                  profile_pic: null
                };
              }
              
              const avatarUrl = typingUser?.profile_pic;
              const nameInitial = typingUser?.name?.charAt(0).toUpperCase() || 'T';
              
              return (
                <div key={typingUserId} className="flex justify-start items-center gap-2">
                  {/* Profile Avatar */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typingUser) {
                        setProfileUserId(typingUser.id);
                        setShowUserProfile(true);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 hover:bg-gray-300 transition-colors cursor-pointer"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={typingUser?.name || 'Typing user'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-400 text-sm font-semibold">
                        {nameInitial}
                      </div>
                    )}
                  </button>

                  {/* Message Card - Shows typing dots or actual message */}
                  <div 
                    className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm max-w-[70%] transition-all duration-300 ease-in-out" 
                    style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
                  >
                    {/* Show typing dots */}
                    <div className="text-sm leading-relaxed flex items-center gap-2" style={{ height: '22.75px', lineHeight: '22.75px' }}>
                      <div className="flex space-x-1">
                        <div 
                          className="w-2 h-2 bg-gray-400 rounded-full transition-transform duration-150 ease-in-out" 
                          style={{ 
                            transform: animationPhase === 0 ? 'translateY(-10px)' : 'translateY(0)',
                            opacity: animationPhase === 0 ? 1 : 0.7
                          }}
                        ></div>
                        <div 
                          className="w-2 h-2 bg-gray-400 rounded-full transition-transform duration-150 ease-in-out" 
                          style={{ 
                            transform: animationPhase === 1 ? 'translateY(-10px)' : 'translateY(0)',
                            opacity: animationPhase === 1 ? 1 : 0.7
                          }}
                        ></div>
                        <div 
                          className="w-2 h-2 bg-gray-400 rounded-full transition-transform duration-150 ease-in-out" 
                          style={{ 
                            transform: animationPhase === 2 ? 'translateY(-10px)' : 'translateY(0)',
                            opacity: animationPhase === 2 ? 1 : 0.7
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-500 text-xs">is typing...</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Reply Preview */}
      {replyToMessage && (
        <div className="flex-shrink-0 px-6 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">
                Replying to {replyToMessage.sender_name}
              </div>
              <div className="text-sm text-gray-800 truncate">
                {replyToMessage.text || 'Media message'}
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


      {/* Message Input */}
      <div className={`flex-shrink-0 px-6 bg-white border-t border-gray-200 relative transition-all duration-200 ${
        pendingMedia.length > 0 ? 'py-4' : 'py-4'
      }`}>
        {/* Media Preview Section */}
        {pendingMedia.length > 0 && (
          <div className="mb-4">
            <MediaPreview 
              pendingMedia={pendingMedia}
              onRemove={handleRemoveMedia}
            />
          </div>
        )}
        
        <div className={`flex items-center gap-3 ${pendingMedia.length > 0 ? '' : ''}`}>
          {/* Media Upload Button - Only show when no media is pending */}
          {pendingMedia.length === 0 && (
            <button
              onClick={handleAttachmentMenuOpen}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-colors border-[0.4px] border-[#E5E7EB] bg-white text-gray-600 hover:bg-gray-50 cursor-pointer"
              style={{
                boxShadow: `
                  0 0 1px rgba(100, 100, 100, 0.25),
                  inset 0 0 2px rgba(27, 27, 27, 0.25)
                `
              }}
              title="Add photos or videos"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}

          {/* Attachment Menu - positioned above + button */}
          {showAttachmentMenu && (
            <AttachmentMenu
              onClose={handleAttachmentMenuClose}
              onSelectFile={() => handleFileSelect('file')}
              onSelectPhotos={() => handleFileSelect('photos')}
              onSelectContact={() => handleFileSelect('contact')}
              onSelectEvent={() => handleFileSelect('event')}
              onSelectAI={() => handleFileSelect('ai')}
            />
          )}
          
          {/* Input field - 44px height with centered text */}
          <div className="flex-1 relative flex items-center">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
              onFocus={(e) => {
                handleTyping();
                e.target.style.boxShadow = `0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)`;
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = `0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)`;
                // Stop typing indicator when user leaves the input field
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                // Add a small delay to prevent rapid on/off typing indicators
                setTimeout(() => {
                  if (account?.id) {
                    simpleChatService.sendTypingIndicator(conversation.id, account.id, false);
                  }
                }, 100);
              }}
              placeholder=""
              className="w-full h-11 px-4 bg-white rounded-full border-[0.4px] border-[#E5E7EB] focus:outline-none focus:border-[0.8px] focus:border-[#D1D5DB] focus:bg-white transition-all duration-200 resize-none text-sm text-black caret-black"
              style={{
                margin: 0,
                paddingTop: '10px',
                paddingBottom: '10px',
                lineHeight: '1.2',
                boxSizing: 'border-box',
                verticalAlign: 'middle',
                boxShadow: `
                  0 0 1px rgba(100, 100, 100, 0.25),
                  inset 0 0 2px rgba(27, 27, 27, 0.25)
                `
              }}
              rows={1}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && !e.shiftKey && (text.trim() || pendingMedia.length > 0) && account?.id) {
                  e.preventDefault();
                  // Stop typing indicator when sending
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                    simpleChatService.sendTypingIndicator(conversation.id, account.id, false);
                  }
                  
                  try {
                    // Send message directly - simple and bulletproof
                    const { message: newMessage, error: messageError } = await simpleChatService.sendMessage(
                      conversation.id,
                      account.id,
                      text.trim(),
                      replyToMessage?.id
                    );

                    if (messageError || !newMessage) {
                      console.error('Failed to send message:', messageError);
                      return;
                    }

                    // Add to local state immediately for instant UI feedback
                    setMessages(prev => [...prev, newMessage]);

                // Attachments will be handled by the store's sendMessage and real-time updates
                if (pendingMedia.length > 0) {
                  console.log('Attachments will be processed via real-time subscription');
                }

                // Clear the form
                setText("");
                setReplyToMessage(null);
                setPendingMedia([]);
              } catch (error) {
                console.error('Error sending message:', error);
              }
                }
              }}
            />
          </div>
          
          {/* Send Button - White card that turns black when active */}
          <button
            onClick={async () => {
              if ((text.trim() || pendingMedia.length > 0) && account?.id) {
                // Stop typing indicator when sending
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                  simpleChatService.sendTypingIndicator(conversation.id, account.id, false);
                }
                
                try {
                  // Send message directly - simple and bulletproof
                  const { message: newMessage, error: messageError } = await simpleChatService.sendMessage(
                    conversation.id,
                    account.id,
                    text.trim(),
                    replyToMessage?.id
                  );

                  if (messageError || !newMessage) {
                    console.error('Failed to send message:', messageError);
                    return;
                  }

                  // Add to local state immediately for instant UI feedback
                  setMessages(prev => [...prev, newMessage]);

                  // Attachments will be handled by the store's sendMessage and real-time updates
                  if (pendingMedia.length > 0) {
                    console.log('Attachments will be processed via real-time subscription');
                  }

                  // Clear the form
                  setText("");
                  setReplyToMessage(null);
                  setPendingMedia([]);
                } catch (error) {
                  console.error('Error sending message:', error);
                }
              }
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors border-[0.4px] border-[#E5E7EB] ${
              text.trim() || pendingMedia.length > 0
                ? "bg-gray-900 text-white hover:bg-gray-800" 
                : "bg-white text-gray-400 cursor-not-allowed"
            }`}
            style={{
              boxShadow: `
                0 0 1px rgba(100, 100, 100, 0.25),
                inset 0 0 2px rgba(27, 27, 27, 0.25)
              `
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 17a1 1 0 01-1-1V6.414l-2.293 2.293a1 1 0 11-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Profile Modals */}
      {profileUserId && showUserProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => {
              setShowUserProfile(false);
              setProfileUserId(null);
            }}
          />
          <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative mx-4">
            <div className="flex flex-col h-full">
              <InlineProfileView
                userId={profileUserId}
                entryPoint="chat"
                onBack={() => {
                  setShowUserProfile(false);
                  setProfileUserId(null);
                }}
                onStartChat={(chatId) => {
                  setShowUserProfile(false);
                  setProfileUserId(null);
                  router.push(`/chat?chat=${chatId}`);
                }}
                onSettingsClick={() => {
                  setShowSettingsModal(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {conversation.id && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          chatId={conversation.id}
        />
      )}

      {/* Settings Modal */}
      {profileUserId && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => {
            setShowSettingsModal(false);
          }}
          onBack={() => {
            setShowSettingsModal(false);
          }}
          userId={profileUserId}
        />
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
        onDelete={handleDelete}
        onReact={handleReact}
        isMe={selectedMessage?.sender_id === account?.id}
      />

      {/* Gallery Modal */}
      <GalleryModal 
        isOpen={showGallery}
        message={galleryMessage}
        onClose={() => setShowGallery(false)}
        onImageClick={handleGalleryImageClick}
      />

      {/* Media Viewer */}
      <MediaViewer
        isOpen={showMediaViewer}
        allMedia={allChatMedia}
        initialIndex={viewerStartIndex}
        onClose={() => setShowMediaViewer(false)}
      />

    </div>
  );
}
