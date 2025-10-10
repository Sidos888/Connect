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
import MediaUploadButton from "@/components/chat/MediaUploadButton";
import type { SimpleMessage } from "@/lib/simpleChatService";

interface PersonalChatPanelProps {
  conversation: Conversation;
}

export default function PersonalChatPanel({ conversation }: PersonalChatPanelProps) {
  console.log('🎬 PersonalChatPanel: Component rendering with conversation:', conversation.id);
  
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
  
  const { sendMessage, markAllRead, getChatTyping } = useAppStore();
  const { account } = useAuth();
  console.log('🎬 PersonalChatPanel: Account:', account?.id);
  console.log('🎬 PersonalChatPanel: Conversation object:', conversation);
  console.log('🎬 PersonalChatPanel: Account object:', account);
  const router = useRouter();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
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
  const [replyToMessage, setReplyToMessage] = useState<SimpleMessage | null>(null);
  const [pendingMedia, setPendingMedia] = useState<string[]>([]);
  
  // Real-time state
  const [animationPhase, setAnimationPhase] = useState(0); // For JavaScript animation
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const unsubscribeReactionsRef = useRef<(() => void) | null>(null);

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

  const handleMediaSelected = (urls: string[]) => {
    setPendingMedia(urls);
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const cancelMedia = () => {
    setPendingMedia([]);
  };
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get typing users from global store
  const typingState = getChatTyping(conversation.id);
  const typingUsers = typingState?.typingUsers || [];
  
  // Track pending messages (messages being transitioned from typing indicator)
  const [pendingMessages, setPendingMessages] = useState<Map<string, any>>(new Map());
  const pendingMessageTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());


  // Load participants and messages from the database
  useEffect(() => {
    console.log('PersonalChatPanel: useEffect triggered with:', { 
      conversationId: conversation.id, 
      accountId: account?.id,
      conversation: conversation 
    });
    const loadData = async () => {
      if (conversation.id && account?.id) {
        console.log('PersonalChatPanel: Conditions met, starting loadData');
        // Only set loading if we don't have messages yet (prevents flicker on chat switch)
        if (messages.length === 0) {
          setLoading(true);
        }
        
        // Load chat details to get participants
        console.log('PersonalChatPanel: Loading chat details for:', conversation.id, 'isGroup:', conversation.isGroup);
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
        console.log('PersonalChatPanel: Verifying chat is cached in service');
        // Note: Chat should now be cached from the getChatById call above
        
        console.log('PersonalChatPanel: Chat loaded successfully:', chat.id, 'participants:', chat.participants?.length || 0);
        setParticipants(chat.participants || []);
        
        // For group chats, refresh the conversation data with fresh photo
        if (conversation.isGroup) {
          console.log('PersonalChatPanel: Group chat detected, refreshing photo from database');
          const updatedConversation = {
            ...conversation,
            avatarUrl: chat.photo || null
          };
          console.log('PersonalChatPanel: Updated conversation with fresh photo:', updatedConversation.avatarUrl);
          setRefreshedConversation(updatedConversation);
        } else {
          setRefreshedConversation(conversation);
        }
        
        // Only load messages if we don't have them yet (prevents refetch on chat switch)
        if (messages.length === 0) {
          const { messages: newMessages, error: messagesError } = await simpleChatService.getChatMessages(conversation.id, account.id);
          if (!messagesError) {
            setMessages(newMessages);
          } else {
            console.error('PersonalChatPanel: Error loading messages:', messagesError);
          }
        }
        
        // Subscribe to real-time messages
        const unsubscribeMessages = simpleChatService.subscribeToMessages(
          conversation.id,
          (newMessage) => {
            console.log('PersonalChatPanel: Received new message:', newMessage);
            
            // Check if this sender was typing using the wasTyping flag from message
            // This flag is set in simpleChatService BEFORE typing indicator is removed
            const wasTyping = (newMessage as any).wasTyping === true;
            
            console.log('🔍 Message wasTyping flag:', wasTyping, 'sender:', newMessage.sender_id);
            
            if (wasTyping) {
              console.log('🔄 Sender was typing, creating smooth transition');
              // Add message to pending state immediately (replaces typing indicator)
              setPendingMessages(prev => {
                const newMap = new Map(prev);
                newMap.set(newMessage.sender_id, newMessage);
                return newMap;
              });
              
              // After a brief moment, move to actual messages
              const timeout = setTimeout(() => {
                setMessages(prev => {
                  // If we already have a temp optimistic message for this sender/text, replace it
                  const tempIndex = prev.findIndex(msg => 
                    typeof msg.id === 'string' && (msg.id as string).startsWith('temp_') &&
                    msg.sender_id === newMessage.sender_id &&
                    (msg.text || '') === (newMessage.text || '')
                  );
                  if (tempIndex !== -1) {
                    const updated = [...prev];
                    updated[tempIndex] = newMessage;
                    console.log('PersonalChatPanel: Replaced temp optimistic message with real message');
                    return updated;
                  }
                  const exists = prev.some(msg => msg.id === newMessage.id);
                  if (exists) return prev;
                  console.log('PersonalChatPanel: Moving pending message to actual messages');
                  return [...prev, newMessage];
                });
                setPendingMessages(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(newMessage.sender_id);
                  return newMap;
                });
              }, 400); // Brief delay for smooth transition (typing indicator will be removed by simpleChatService)
              
              pendingMessageTimeouts.current.set(newMessage.sender_id, timeout);
            } else {
              console.log('PersonalChatPanel: No typing indicator, adding message normally');
              // Normal message flow - just add it
              setMessages(prev => {
                // Replace optimistic temp message if present
                const tempIndex = prev.findIndex(msg => 
                  typeof msg.id === 'string' && (msg.id as string).startsWith('temp_') &&
                  msg.sender_id === newMessage.sender_id &&
                  (msg.text || '') === (newMessage.text || '')
                );
                if (tempIndex !== -1) {
                  const updated = [...prev];
                  updated[tempIndex] = newMessage;
                  console.log('PersonalChatPanel: Replaced temp optimistic message with real message');
                  return updated;
                }
                const exists = prev.some(msg => 
                  msg.id === newMessage.id || 
                  (msg.text === newMessage.text && msg.sender_id === newMessage.sender_id && Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 10000)
                );
                if (exists) {
                  console.log('PersonalChatPanel: Message already exists, skipping duplicate');
                  return prev;
                }
                console.log('PersonalChatPanel: Adding new message to UI');
                return [...prev, newMessage];
              });
            }
            
            // Auto-scroll to bottom when new message arrives
            setTimeout(() => {
              endRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        );
        unsubscribeMessagesRef.current = unsubscribeMessages;
        
        // Subscribe to reaction changes for real-time updates
        const unsubscribeReactions = simpleChatService.subscribeToReactions(
          conversation.id,
          (messageId) => {
            console.log('PersonalChatPanel: Reaction update received for message:', messageId);
            // Refresh the specific message to get updated reactions
            setMessages(prev => {
              return prev.map(msg => {
                if (msg.id === messageId) {
                  // Trigger a re-render by updating the message
                  return { ...msg, reactions: msg.reactions || [] };
                }
                return msg;
              });
            });
          }
        );
        unsubscribeReactionsRef.current = unsubscribeReactions;
        
        // Note: Typing indicators are now handled by ChatLayout's global subscription
        // PersonalChatPanel will use the global store instead of its own subscription
        
        setLoading(false);
      }
    };

    loadData();
    
    // Cleanup function
    return () => {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
        unsubscribeMessagesRef.current = null;
      }
      if (unsubscribeReactionsRef.current) {
        unsubscribeReactionsRef.current();
        unsubscribeReactionsRef.current = null;
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
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingUsers.length]);

  // JavaScript animation for typing dots
  useEffect(() => {
    console.log('PersonalChatPanel: Animation useEffect triggered, typingUsers.length:', typingUsers.length);
    if (typingUsers.length > 0) {
      console.log('PersonalChatPanel: Starting animation');
      const animate = () => {
        setAnimationPhase(prev => {
          const newPhase = (prev + 1) % 4;
          console.log('PersonalChatPanel: Animation phase changed to:', newPhase);
          return newPhase;
        });
        animationRef.current = setTimeout(animate, 350); // ~1.4s total cycle
      };
      animate();
    } else {
      console.log('PersonalChatPanel: Stopping animation');
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
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      // Clean up pending message timeouts
      pendingMessageTimeouts.current.forEach(timeout => clearTimeout(timeout));
      pendingMessageTimeouts.current.clear();
    };
  }, []);

  // Handle typing indicator
  const handleTyping = () => {
    if (!account?.id || !conversation.id) return;
    
    console.log('🎯 Starting typing indicator for user:', account.id);
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
  console.log('PersonalChatPanel - Original conversation avatarUrl:', conversation.avatarUrl);
  console.log('PersonalChatPanel - Refreshed conversation avatarUrl:', refreshedConversation?.avatarUrl);
  console.log('PersonalChatPanel - Display conversation avatarUrl:', displayConversation.avatarUrl);

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
                console.log('PersonalChatPanel: Opening group info modal for chat:', displayConversation.id);
                setShowGroupInfo(true);
              }
            }}
            className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-3 hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] hover:bg-white transition-shadow cursor-pointer w-full lg:w-1/3 relative`}
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
            const isMe = m.sender_id === account?.id;
            // Create a unique key that combines ID with index to prevent duplicates
            const uniqueKey = `${m.id}_${index}_${m.created_at}`;
            return (
              <MessageBubble
                key={uniqueKey}
                message={m}
                isMe={isMe}
                participants={participants}
                onLongPress={handleMessageLongPress}
                onReactionClick={handleReact}
                onProfileClick={handleProfileClick}
              />
            );
          })
        )}
        
        <div ref={endRef} />
      </div>

      {/* Typing Indicator & Pending Messages - positioned at bottom, outside scrollable area */}
      {(typingUsers.length > 0 && !typingUsers.includes(account?.id || '')) && (() => {
        console.log('🐛 Typing indicator rendering with typingUsers:', typingUsers);
        console.log('🐛 Current user account.id:', account?.id);
        
        return (
          <div className="flex-shrink-0 px-6 pb-8 space-y-4">
            {typingUsers.map((typingUserId: string) => {
              // Check if this user has a pending message
              const pendingMessage = pendingMessages.get(typingUserId);
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
                    {pendingMessage ? (
                      // Show the actual message with fade-in
                      <div className="text-sm leading-relaxed whitespace-pre-wrap animate-fade-in">
                        {pendingMessage.text || 'Message'}
                      </div>
                    ) : (
                      // Show typing dots
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
                      </div>
                    )}
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

      {/* Pending Media Preview */}
      {pendingMedia.length > 0 && (
        <div className="flex-shrink-0 px-6 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Media:</div>
            <div className="flex gap-2">
              {pendingMedia.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={cancelMedia}
              className="ml-auto p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-3">
          <MediaUploadButton 
            onMediaSelected={handleMediaSelected}
            disabled={false}
          />
          <div className="flex-1 relative max-w-xs sm:max-w-none">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
              onFocus={handleTyping}
              onBlur={() => {
                console.log('🚪 User blurred from input field');
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
              className="w-full px-3 py-1 bg-white rounded-full border-[1.5px] border-gray-300 focus:outline-none focus:border-gray-300 focus:bg-white focus:shadow-[0_0_12px_rgba(0,0,0,0.12)] transition-colors resize-none text-sm sm:px-4 sm:py-3 sm:rounded-xl"
              rows={1}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && !e.shiftKey && text.trim() && account?.id) {
                  e.preventDefault();
                  // Stop typing indicator when sending
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                    simpleChatService.sendTypingIndicator(conversation.id, account.id, false);
                  }
                  await sendMessage(conversation.id, text.trim(), account.id, replyToMessage?.id, pendingMedia.length > 0 ? pendingMedia : undefined);
                  setText("");
                  setReplyToMessage(null);
                  setPendingMedia([]);
                }
              }}
            />
          </div>
          <button
            onClick={async () => {
              if (text.trim() && account?.id) {
                // Stop typing indicator when sending
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                  simpleChatService.sendTypingIndicator(conversation.id, account.id, false);
                }
                await sendMessage(conversation.id, text.trim(), account.id, replyToMessage?.id, pendingMedia.length > 0 ? pendingMedia : undefined);
                setText("");
                setReplyToMessage(null);
                setPendingMedia([]);
              }
            }}
            className={`p-2 rounded-full transition-colors ${
              text.trim() 
                ? "bg-gray-900 text-white hover:bg-gray-800" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
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
        onClose={() => setSelectedMessage(null)}
        onReply={handleReply}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onReact={handleReact}
        isMe={selectedMessage?.sender_id === account?.id}
      />

    </div>
  );
}
