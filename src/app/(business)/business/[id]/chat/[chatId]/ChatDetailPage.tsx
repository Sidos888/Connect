"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import { useAppStore } from "@/lib/store";
import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";

export default function ChatDetailPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { getConversations, sendMessage, markAllRead } = useAppStore();
  const conv = useMemo(() => getConversations().find((c) => c.id === chatId), [getConversations, chatId]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conv) markAllRead(conv.id);
  }, [conv, markAllRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  if (!conv) return <div className="text-sm text-neutral-500">Conversation not found.</div>;

  const backHref = typeof window !== "undefined" ? `/business/${window.location.pathname.split("/")[2]}/chat` : "#";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="flex items-center justify-center relative">
          <Link 
            href={backHref} 
            className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Back to chat"
          >
            <span className="back-btn-circle">
              <ChevronLeftIcon className="h-5 w-5" />
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar
              src={conv.avatarUrl}
              name={conv.title}
              size={40}
              className="lg:w-10 lg:h-10"
            />
            
            <div>
              <h1 className="font-semibold text-gray-900 text-sm lg:text-base">
                {conv.title}
              </h1>
              <p className="text-xs text-gray-500">
                {conv.isGroup ? `${conv.messages.length} members` : "Direct Message"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {conv.messages.map((message, index) => {
          const isMe = message.sender === "me";
          const showAvatar = !isMe && (index === 0 || conv.messages[index - 1].sender !== message.sender);
          
          return (
            <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`flex items-end space-x-2 max-w-[80%] lg:max-w-[70%] ${isMe ? "flex-row-reverse space-x-reverse" : ""}`}>
                {!isMe && (
                  <div className="w-6 h-6 lg:w-8 lg:h-8">
                    {showAvatar && (
                      <Avatar
                        src={conv.avatarUrl}
                        name={conv.title}
                        size={24}
                        className="lg:w-8 lg:h-8"
                      />
                    )}
                  </div>
                )}
                
                <div className={`px-3 py-2 lg:px-4 lg:py-3 rounded-2xl ${
                  isMe 
                    ? "bg-blue-500 text-white" 
                    : "bg-white text-gray-900 border border-gray-200"
                }`}>
                  <p className="text-sm lg:text-base whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            sendMessage(conv.id, text.trim());
            setText("");
          }}
          className="flex items-center space-x-3"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${conv.title}...`}
            className="flex-1 px-4 py-3 lg:py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-6 py-3 lg:py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm lg:text-base font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
