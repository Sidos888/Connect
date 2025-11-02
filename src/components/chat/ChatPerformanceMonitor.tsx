"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
import { useAppStore } from '@/lib/store';

interface PerformanceMetrics {
  authTime: number;
  chatLoadTime: number;
  totalTime: number;
  chatCount: number;
  error?: string;
}

export default function ChatPerformanceMonitor() {
  const { user, account } = useAuth();
  const chatService = useChatService();
  const { conversations, isHydrated } = useAppStore();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHydrated || !user || !account) return;

    const startTime = performance.now();
    let authTime = 0;
    let chatLoadTime = 0;

    // Measure auth time (time from page load to auth ready)
    const authStartTime = performance.now();
    if (user && account) {
      authTime = performance.now() - authStartTime;
    }

    // Measure chat loading time
    const chatStartTime = performance.now();
    if (chatService) {
      chatService.getUserChatsFast().then((result) => {
        chatLoadTime = performance.now() - chatStartTime;
        const totalTime = performance.now() - startTime;

        setMetrics({
          authTime,
          chatLoadTime,
          totalTime,
          chatCount: result.chats?.length || 0,
          error: result.error?.message
        });
      });
    }
  }, [isHydrated, user, account, chatService]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">Performance Monitor</span>
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className="text-gray-300 hover:text-white"
        >
          {isVisible ? '−' : '+'}
        </button>
      </div>
      
      {isVisible && (
        <div className="space-y-1">
          <div>Auth Time: {metrics?.authTime.toFixed(0)}ms</div>
          <div>Chat Load: {metrics?.chatLoadTime.toFixed(0)}ms</div>
          <div>Total Time: {metrics?.totalTime.toFixed(0)}ms</div>
          <div>Chats: {metrics?.chatCount}</div>
          <div>Conversations: {conversations.length}</div>
          {metrics?.error && (
            <div className="text-red-400">Error: {metrics.error}</div>
          )}
          <div className="text-xs text-gray-400 mt-2">
            {metrics?.totalTime && metrics.totalTime < 1000 ? '✅ Fast' : 
             metrics?.totalTime && metrics.totalTime < 3000 ? '⚠️ Slow' : '❌ Very Slow'}
          </div>
        </div>
      )}
    </div>
  );
}















