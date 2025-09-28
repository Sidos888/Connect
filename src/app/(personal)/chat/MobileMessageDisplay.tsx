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

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        messages.map((m) => {
          const isMe = m.sender_id === account?.id;
          return (
        <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
          <div className={`
            max-w-[70%]
            ${isMe 
              ? "bg-blue-500 text-white" 
              : "bg-gray-100 text-gray-900"
            }
            rounded-2xl px-4 py-3 shadow-sm
          `}>
            {/* Message Content */}
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {m.text || 'Message'}
            </div>
            
            {/* Message Time */}
            <div className={`text-xs mt-2 ${
              isMe ? "text-blue-100" : "text-gray-500"
            }`}>
              {new Date(m.created_at).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
          </div>
        </div>
        )})
      )}
      <div ref={endRef} />
    </div>
  );
}
