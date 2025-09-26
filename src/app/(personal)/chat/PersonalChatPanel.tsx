"use client";

import { useAppStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import type { Conversation } from "@/lib/types";

interface PersonalChatPanelProps {
  conversation: Conversation;
}

export default function PersonalChatPanel({ conversation }: PersonalChatPanelProps) {
  const { sendMessage, markAllRead } = useAppStore();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const hasMarkedAsRead = useRef(false);

  useEffect(() => {
    if (!hasMarkedAsRead.current) {
      markAllRead(conversation.id);
      hasMarkedAsRead.current = true;
    }
  }, [conversation.id, markAllRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar 
            src={conversation.avatarUrl ?? undefined} 
            name={conversation.title} 
            size={40}
          />
          <div>
            <div className="font-semibold text-gray-900">{conversation.title}</div>
            <div className="text-sm text-gray-500">{conversation.isGroup ? "Group Chat" : "Direct Message"}</div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {conversation.messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`
              max-w-[70%]
              ${m.sender === "me" 
                ? "bg-blue-500 text-white" 
                : "bg-gray-100 text-gray-900"
              }
              rounded-2xl px-4 py-3 shadow-sm
            `}>
              {/* Message Content */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {m.text}
              </div>
              
              {/* Message Time */}
              <div className={`text-xs mt-2 ${
                m.sender === "me" ? "text-blue-100" : "text-gray-500"
              }`}>
                {new Date().toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            sendMessage(conversation.id, text.trim());
            setText("");
          }}
          className="flex items-end gap-3"
        >
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 text-sm
                         bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                         transition-all duration-200 max-h-32 min-h-[48px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (text.trim()) {
                    sendMessage(conversation.id, text.trim());
                    setText("");
                  }
                }
              }}
            />
          </div>
          <button 
            type="submit"
            disabled={!text.trim()}
            className="rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 
                       text-white px-6 py-3 font-medium transition-all duration-200
                       disabled:cursor-not-allowed flex items-center justify-center min-w-[80px] text-sm"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
