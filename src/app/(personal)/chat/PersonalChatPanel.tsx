"use client";

import { useAppStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import type { Conversation } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import { simpleChatService } from "@/lib/simpleChatService";

interface PersonalChatPanelProps {
  conversation: Conversation;
}

export default function PersonalChatPanel({ conversation }: PersonalChatPanelProps) {
  const { sendMessage, markAllRead } = useAppStore();
  const { account } = useAuth();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const hasMarkedAsRead = useRef(false);

  // Load real messages from the database
  useEffect(() => {
    const loadMessages = async () => {
      if (conversation.id && account?.id) {
        setLoading(true);
        console.log('PersonalChatPanel: Loading messages for chat:', conversation.id);
        console.log('PersonalChatPanel: Conversation data:', conversation);
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex justify-center">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex items-center gap-3 max-w-2xl">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
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
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-base">{conversation.title}</div>
            </div>
          </div>
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
          <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
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
              
              {/* Message Time */}
              <div className="text-xs mt-2 text-gray-500">
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

      {/* Message Input */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder=""
              className="w-full px-4 py-3 bg-white rounded-full border border-gray-300 focus:outline-none focus:border-black focus:bg-white transition-colors resize-none"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
