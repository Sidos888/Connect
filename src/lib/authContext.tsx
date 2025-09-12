"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, avatarUrl?: string) => Promise<{ error: Error | null }>;
  sendPhoneVerification: (phone: string) => Promise<{ error: Error | null }>;
  sendEmailVerification: (email: string) => Promise<{ error: Error | null }>;
  verifyPhoneCode: (phone: string, code: string) => Promise<{ error: Error | null }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ error: Error | null }>;
  checkUserExists: (phone?: string, email?: string) => Promise<{ exists: boolean; error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (name: string, avatarUrl?: string) => {
    const { error } = await supabase.auth.updateUser({
      data: { 
        full_name: name,
        avatar_url: avatarUrl 
      }
    });
    return { error };
  };

  const sendPhoneVerification = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });
      return { error };
    } catch (err) {
      return { error: new Error('Failed to send verification code') };
    }
  };

  const sendEmailVerification = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
      });
      return { error };
    } catch (err) {
      return { error: new Error('Failed to send verification code') };
    }
  };

  const verifyPhoneCode = async (phone: string, code: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: code,
        type: 'sms',
      });
      return { error };
    } catch (err) {
      return { error: new Error('Invalid verification code') };
    }
  };

  const verifyEmailCode = async (email: string, code: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'email',
      });
      return { error };
    } catch (err) {
      return { error: new Error('Invalid verification code') };
    }
  };

  const checkUserExists = async (phone?: string, email?: string) => {
    try {
      let query = supabase.from('profiles').select('id');
      if (phone) {
        query = query.eq('phone', phone);
      } else if (email) {
        query = query.eq('email', email);
      } else {
        return { exists: false, error: new Error('No phone or email provided') };
      }
      const { data, error } = await query.limit(1);
      if (error) {
        return { exists: false, error };
      }
      return { exists: data && data.length > 0, error: null };
    } catch (err) {
      return { exists: false, error: new Error('Failed to check user existence') };
    }
  };

  const deleteAccount = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { error: new Error('No authenticated user found') };
      }
      
      // Try to use the API route first (if service role key is configured)
      try {
        const response = await fetch('/api/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        if (response.ok) {
          await supabase.auth.signOut();
          return { error: null };
        }
      } catch (apiError) {
        console.log('API route failed, falling back to client-side deletion:', apiError);
      }
      
      // Fallback: Client-side deletion (delete profile only)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      if (profileError) {
        return { error: new Error('Failed to delete profile') };
      }
      await supabase.auth.signOut();
      return { error: null };
    } catch (err) {
      return { error: new Error('Failed to delete account') };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    sendPhoneVerification,
    sendEmailVerification,
    verifyPhoneCode,
    verifyEmailCode,
    checkUserExists,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
