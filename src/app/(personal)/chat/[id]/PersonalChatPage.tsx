"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import { useAppStore } from "@/lib/store";
import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";

export default function PersonalChatPage() {
  const { id } = useParams<{ id: string }>();
  const { getConversations, sendMessage, markAllRead } = useAppStore();
  const conv = useMemo(() => getConversations().find((c) => c.id === id), [getConversations, id]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conv) markAllRead(conv.id);
  }, [conv, markAllRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  if (!conv) return <div className="text-sm text-neutral-500">Conversation not found.</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="flex items-center justify-center relative">
          <Link 
            href="/chat" 
            className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
          >
            <span className="back-btn-circle">
              <ChevronLeftIcon className="h-5 w-5" />
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar 
              src={conv.avatarUrl ?? undefined} 
              name={conv.title} 
              size={36}
            />
            <div>
              <div className="font-semibold text-gray-900 text-sm sm:text-base">{conv.title}</div>
              <div className="text-xs text-gray-500">{conv.isGroup ? "Group Chat" : "Direct Message"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
        {conv.messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`
              max-w-[85%] sm:max-w-[80%] lg:max-w-[70%]
              ${m.sender === "me" 
                ? "bg-white border border-blue-200 shadow-sm" 
                : "bg-white border border-gray-200 shadow-sm"
              }
              rounded-2xl p-3 sm:p-4 transition-all duration-200 hover:shadow-md
            `}>
              {/* Message Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    m.sender === "me" 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {m.sender === "me" ? "You" : conv.title.charAt(0)}
                  </div>
                  <span className={`text-xs font-medium ${
                    m.sender === "me" ? "text-blue-700" : "text-gray-700"
                  }`}>
                    {m.sender === "me" ? "You" : conv.title}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date().toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </span>
              </div>
              
              {/* Message Content */}
              <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
                {m.text}
              </div>
              
              {/* Message Footer */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <button className="text-gray-400 hover:text-blue-500 transition-colors">
                    <span className="text-xs">👍</span>
                  </button>
                  <button className="text-gray-400 hover:text-blue-500 transition-colors">
                    <span className="text-xs">↩️</span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {m.sender === "me" && (
                    <span className="text-xs text-blue-500">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-3 sm:py-4 bg-white border-t border-gray-200 safe-bottom">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            sendMessage(conv.id, text.trim());
            setText("");
          }}
          className="flex items-end gap-2 sm:gap-3"
        >
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base
                         bg-gray-50 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100
                         transition-all duration-200 max-h-32 min-h-[44px] sm:min-h-[48px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (text.trim()) {
                    sendMessage(conv.id, text.trim());
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
                       text-white px-4 sm:px-6 py-2 sm:py-3 font-medium transition-all duration-200
                       disabled:cursor-not-allowed flex items-center justify-center min-w-[60px] sm:min-w-[80px] text-sm sm:text-base"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
