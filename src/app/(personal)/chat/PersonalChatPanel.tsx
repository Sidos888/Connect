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

interface PersonalChatPanelProps {
  conversation: Conversation;
}

export default function PersonalChatPanel({ conversation }: PersonalChatPanelProps) {
  const { sendMessage, markAllRead } = useAppStore();
  const { account } = useAuth();
  const router = useRouter();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const hasMarkedAsRead = useRef(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [refreshedConversation, setRefreshedConversation] = useState<Conversation | null>(null);


  // Load participants and messages from the database
  useEffect(() => {
    const loadData = async () => {
      if (conversation.id && account?.id) {
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
        setLoading(false);
      }
    };

    loadData();
  }, [conversation.id, account?.id, conversation]);

  useEffect(() => {
    if (!hasMarkedAsRead.current && account?.id) {
      markAllRead(conversation.id, account.id);
      hasMarkedAsRead.current = true;
    }
  }, [conversation.id, markAllRead, account?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  // Use refreshed conversation data if available, otherwise fall back to original
  const displayConversation = refreshedConversation || conversation;
  
  // Debug logging
  console.log('PersonalChatPanel - Original conversation avatarUrl:', conversation.avatarUrl);
  console.log('PersonalChatPanel - Refreshed conversation avatarUrl:', refreshedConversation?.avatarUrl);
  console.log('PersonalChatPanel - Display conversation avatarUrl:', displayConversation.avatarUrl);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex justify-center">
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
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 flex items-center gap-3 w-full max-w-3xl lg:max-w-4xl hover:shadow-md hover:bg-white transition-all cursor-pointer"
          >
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
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900 text-base">{displayConversation.title}</div>
            </div>
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
          <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}>
            {/* Profile picture for received messages */}
            {!isMe && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {displayConversation.avatarUrl ? (
                  <img
                    src={displayConversation.avatarUrl}
                    alt={displayConversation.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-sm font-semibold">
                    {displayConversation.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
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
              onChange={(e) => setText(e.target.value)}
              placeholder=""
              className="w-full px-3 py-1 bg-white rounded-full border-[1.5px] border-gray-300 focus:outline-none focus:border-gray-900 focus:bg-white transition-colors resize-none text-sm shadow-sm sm:px-4 sm:py-3 sm:rounded-xl sm:border sm:border-gray-300"
              rows={1}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && !e.shiftKey && text.trim() && account?.id) {
                  e.preventDefault();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => {
              setShowUserProfile(false);
              setProfileUserId(null);
            }}
          />
          <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
            <div className="flex flex-col h-full">
              <InlineProfileView
                userId={profileUserId}
                entryPoint="chat"
                onBack={() => {
                  setShowUserProfile(false);
                  setProfileUserId(null);
                }}
                onStartChat={(chatId) => {
                  router.push(`/chat?chat=${chatId}`);
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

    </div>
  );
}
