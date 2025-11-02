"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from './authContext';
import { ChatService } from './chatService';
import { SubscriptionManager } from './subscriptionManager';

const ChatContext = createContext<ChatService | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { supabase, account } = useAuth();
  const chatServiceRef = useRef<ChatService | null>(null);
  const subscriptionManagerRef = useRef<SubscriptionManager | null>(null);

  const chatService = useMemo(() => {
    if (!supabase) return null;
    
    // Create new instance (no longer needs getAccount dependency)
    const service = new ChatService(supabase as SupabaseClient);
    chatServiceRef.current = service;
    return service;
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    
    // Initialize SubscriptionManager for centralized cleanup
    if (!subscriptionManagerRef.current) {
      subscriptionManagerRef.current = new SubscriptionManager(supabase);
    }
    
    return () => {
      // Cleanup on unmount
      if (subscriptionManagerRef.current) {
        subscriptionManagerRef.current.unsubscribeAll();
      }
    };
  }, [supabase]);

  return (
    <ChatContext.Provider value={chatService}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatService() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatService must be used within ChatProvider');
  return ctx;
}


