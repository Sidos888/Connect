"use client";

import { useAppStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import type { Conversation } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import { simpleChatService } from "@/lib/simpleChatService";

interface MobileMessageDisplayProps {
  conversation: Conversation;
}

export default function MobileMessageDisplay({ conversation }: MobileMessageDisplayProps) {
  const { sendMessage, markAllRead } = useAppStore();
  const { account } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const hasMarkedAsRead = useRef(false);

  // Load real messages from the database
  useEffect(() => {
    const loadMessages = async () => {
      if (conversation.id && account?.id) {
        setLoading(true);
        console.log('MobileMessageDisplay: Loading messages for chat:', conversation.id);
        console.log('MobileMessageDisplay: Conversation data:', conversation);
        const { messages, error } = await simpleChatService.getChatMessages(conversation.id, account.id);
        if (!error) {
          setMessages(messages);
        } else {
          console.error('Error loading messages:', error);
        }
        setLoading(false);
      }
    };

    loadMessages();
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

  const handleReactionAdd = async (messageId: string, reaction: string) => {
    // TODO: Implement reaction adding to database
    console.log('Adding reaction:', reaction, 'to message:', messageId);
  };

  const handleReactionRemove = async (messageId: string, reaction: string) => {
    // TODO: Implement reaction removal from database
    console.log('Removing reaction:', reaction, 'from message:', messageId);
  };

  return (
    <div className="space-y-4">
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
                  {conversation.avatarUrl ? (
                    <img
                      src={conversation.avatarUrl}
                      alt={conversation.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm font-semibold">
                      {conversation.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}
              
              {/* Message bubble - white background for mobile */}
              <div className={`
                max-w-[70%]
                ${isMe 
                  ? "bg-white text-gray-900 border border-gray-200" 
                  : "bg-white text-gray-900 border border-gray-200"
                }
                rounded-2xl px-4 py-3 shadow-sm
              `}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {m.text || 'Message'}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={endRef} />
    </div>
  );
}
