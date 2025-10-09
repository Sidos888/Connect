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

interface PersonalChatPanelProps {
  conversation: Conversation;
}

export default function PersonalChatPanel({ conversation }: PersonalChatPanelProps) {
  console.log('🎬 PersonalChatPanel: Component rendering with conversation:', conversation.id);
  const { sendMessage, markAllRead } = useAppStore();
  const { account } = useAuth();
  console.log('🎬 PersonalChatPanel: Account:', account?.id);
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
  
  // Real-time state
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [testTyping, setTestTyping] = useState(false); // Real typing logic
  const [animationPhase, setAnimationPhase] = useState(0); // For JavaScript animation
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const unsubscribeTypingRef = useRef<(() => void) | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);


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
        setLoading(true);
        
        // Load chat details to get participants
        const { chat, error: chatError } = await simpleChatService.getChatById(conversation.id);
        if (!chatError && chat) {
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
        } else {
          console.error('Error loading chat:', chatError);
          setRefreshedConversation(conversation);
        }
        
        // Load messages
        const { messages, error: messagesError } = await simpleChatService.getChatMessages(conversation.id, account.id);
        if (!messagesError) {
          setMessages(messages);
        } else {
          console.error('Error loading messages:', messagesError);
        }
        
        // Subscribe to real-time messages
        const unsubscribeMessages = simpleChatService.subscribeToMessages(
          conversation.id,
          (newMessage) => {
            console.log('PersonalChatPanel: Received new message:', newMessage);
            setMessages(prev => [...prev, newMessage]);
          }
        );
        unsubscribeMessagesRef.current = unsubscribeMessages;
        
        // Subscribe to typing indicators
        console.log('PersonalChatPanel: Setting up typing subscription for chat:', conversation.id, 'user:', account.id);
        const unsubscribeTyping = simpleChatService.subscribeToTyping(
          conversation.id,
          account.id,
          (typingUserIds) => {
            console.log('PersonalChatPanel: Typing users updated:', typingUserIds);
            setTypingUsers(typingUserIds);
          }
        );
        console.log('PersonalChatPanel: Typing subscription created:', !!unsubscribeTyping);
        unsubscribeTypingRef.current = unsubscribeTyping;
        
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
      if (unsubscribeTypingRef.current) {
        unsubscribeTypingRef.current();
        unsubscribeTypingRef.current = null;
      }
    };
  }, [conversation.id, account?.id, conversation]);

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
    if (typingUsers.length > 0) {
      const animate = () => {
        setAnimationPhase(prev => (prev + 1) % 4); // 0, 1, 2, 3 cycles
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
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
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
          messages.map((m) => {
            const isMe = m.sender_id === account?.id;
            return (
          <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} items-center gap-2`}>
            {/* Profile picture for received messages */}
            {!isMe && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Find the sender of this specific message
                  const messageSender = participants.find((p: any) => p.id === m.sender_id);
                  if (messageSender) {
                    setProfileUserId(messageSender.id);
                    setShowUserProfile(true);
                  }
                }}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 hover:bg-gray-300 transition-colors cursor-pointer"
              >
                {(() => {
                  // Find the sender of this specific message
                  const messageSender = participants.find((p: any) => p.id === m.sender_id);
                  const senderAvatarUrl = messageSender?.profile_pic;
                  const senderName = messageSender?.name || 'Unknown';
                  
                  return senderAvatarUrl ? (
                    <img
                      src={senderAvatarUrl}
                      alt={senderName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm font-semibold">
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                  );
                })()}
              </button>
            )}
            
            <div className={`
              max-w-[70%]
              ${isMe 
                ? "bg-white text-gray-900 border border-gray-200" 
                : "bg-white text-gray-900 border border-gray-200"
              }
              rounded-2xl px-4 py-3 shadow-sm
            `} style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}>
              {/* Message Content */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {m.text || 'Message'}
              </div>
            </div>
          </div>
          )})
        )}
        
        {/* Typing Indicator - positioned exactly like a message */}
        {typingUsers.length > 0 && (() => {
          console.log('🐛 Typing indicator rendering with typingUsers:', typingUsers);
          console.log('🐛 Current user account.id:', account?.id);
          console.log('🐛 TypingUsers[0]:', typingUsers[0]);
          console.log('🐛 Is current user in typingUsers?', typingUsers.includes(account?.id || ''));
          return (
            <div className="flex justify-start items-center gap-2 mt-12">
              {/* Profile Card - same positioning as message avatars */}
              {typingUsers.length === 1 && (() => {
                let typingUser = participants.find(p => p.id === typingUsers[0]);
                console.log('🐛 Looking for typing user:', typingUsers[0]);
                console.log('🐛 Available participants:', participants);
                console.log('🐛 Participant IDs:', participants.map(p => p.id));
                console.log('🐛 Participant IDs expanded:', participants.map(p => ({ id: p.id, name: p.name })));
                console.log('🐛 Found typing user:', typingUser);
                
                // If typing user not found in participants, create a placeholder
                if (!typingUser) {
                  console.log('🐛 Typing user not found in participants, creating placeholder');
                  typingUser = {
                    id: typingUsers[0],
                    name: 'Typing User', // We'll fetch the real name later
                    profile_pic: null
                  };
                }
                
                const avatarUrl = typingUser?.profile_pic;
                const nameInitial = typingUser?.name?.charAt(0).toUpperCase() || 'T';
                return (
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
                );
              })()}

              {/* Bouncing Dots Card - original size with perfect positioning */}
              <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm max-w-xs" style={{ backgroundColor: '#ffffff !important', color: '#111827 !important', height: 'auto', minHeight: 'fit-content' }}>
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
                  {typingUsers.length > 1 && (
                    <span className="text-gray-600">
                      {`${typingUsers.length} people are typing...`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <div ref={endRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
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
                simpleChatService.sendTypingIndicator(conversation.id, account.id, false);
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
                  await sendMessage(conversation.id, text.trim(), account.id);
                  setText("");
                }
              }}
            />
          </div>
          {text.trim() && (
            <button
              onClick={async () => {
                if (text.trim() && account?.id) {
                  // Stop typing indicator when sending
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                    simpleChatService.sendTypingIndicator(conversation.id, account.id, false);
                  }
                  await sendMessage(conversation.id, text.trim(), account.id);
                  setText("");
                }
              }}
              className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
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

    </div>
  );
}
