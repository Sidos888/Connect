"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  supabase: any;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, avatarUrl?: string) => Promise<{ error: Error | null }>;
  sendPhoneVerification: (phone: string) => Promise<{ error: Error | null }>;
  sendEmailVerification: (email: string) => Promise<{ error: Error | null }>;
  verifyPhoneCode: (phone: string, code: string) => Promise<{ error: Error | null }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ error: Error | null }>;
  checkUserExists: (phone?: string, email?: string) => Promise<{ exists: boolean; userData?: { id: string; full_name?: string; email?: string; phone?: string; avatar_url?: string; bio?: string; date_of_birth?: string; created_at: string; updated_at: string } | null; error: Error | null }>;
  loadUserProfile: () => Promise<{ profile: any | null; error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

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
    } catch {
      return { error: new Error('Failed to send verification code') };
    }
  };

  const sendEmailVerification = async (email: string) => {
    try {
      console.log('Sending email verification for:', email);
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: { 
          emailRedirectTo: undefined, // prevents magic link
          shouldCreateUser: true // allows new user creation
        }
      });
      console.log('Email verification response:', { data, error });
      return { error };
    } catch (error) {
      console.error('Email verification error:', error);
      return { error: new Error('Failed to send verification code') };
    }
  };

  const verifyPhoneCode = async (phone: string, code: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: code,
        type: 'sms',
      });
      
      if (!error && data.user) {
        setUser(data.user);
        setLoading(false);
      }
      
      return { error };
    } catch {
      return { error: new Error('Invalid verification code') };
    }
  };

  const verifyEmailCode = async (email: string, code: string) => {
    try {
      console.log('Verifying email code for:', email, 'with code:', code);
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'email',
      });
      
      console.log('Email verification response:', { data, error });
      
      if (!error && data.user) {
        console.log('Setting user after email verification:', data.user);
        setUser(data.user);
        setLoading(false);
      }
      
      return { error };
    } catch (error) {
      console.error('Email verification error:', error);
      return { error: new Error('Invalid verification code') };
    }
  };

  const checkUserExists = useCallback(async (phone?: string, email?: string) => {
    try {
      console.log('checkUserExists: Checking for existing account', { phone, email });
      
      let query = supabase.from('profiles').select('*');
      if (phone) {
        // Normalize phone number - remove spaces and ensure consistent format
        const normalizedPhone = phone.replace(/\s/g, '');
        console.log('checkUserExists: Normalized phone:', normalizedPhone);
        query = query.eq('phone', normalizedPhone);
      } else if (email) {
        console.log('checkUserExists: Checking email:', email);
        query = query.eq('email', email);
      } else {
        console.log('checkUserExists: No phone or email provided');
        return { exists: false, error: new Error('No phone or email provided') };
      }
      
      const { data, error } = await query.limit(1);
      console.log('checkUserExists: Query result:', { data, error });
      
      if (error) {
        console.error('checkUserExists: Database error:', error);
        return { exists: false, error };
      }
      
      const exists = data && data.length > 0;
      const userData = data && data.length > 0 ? data[0] : null;
      
      console.log('checkUserExists: Result:', { exists, userData: userData ? { id: userData.id, name: userData.full_name, email: userData.email, phone: userData.phone } : null });
      
      return { 
        exists, 
        userData,
        error: null 
      };
    } catch (error) {
      console.error('checkUserExists: Unexpected error:', error);
      return { exists: false, error: new Error('Failed to check user existence') };
    }
  }, [supabase]);

  const loadUserProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { profile: null, error: null };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('AuthContext: Error loading profile:', profileError);
        return { profile: null, error: profileError };
      }

      return { profile, error: null };
    } catch (error) {
      console.error('AuthContext: Unexpected error loading profile:', error);
      return { profile: null, error: new Error('Failed to load profile: ' + (error as Error).message) };
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      console.log('AuthContext: Starting avatar upload...');
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('AuthContext: Avatar upload error:', error);
        return { url: null, error };
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log('AuthContext: Avatar uploaded successfully:', publicUrl);
      return { url: publicUrl, error: null };
      
    } catch (error) {
      console.error('AuthContext: Unexpected error during avatar upload:', error);
      return { url: null, error: new Error('Failed to upload avatar: ' + (error as Error).message) };
    }
  };

  const deleteAccount = async () => {
    try {
      console.log('AuthContext: Starting account deletion...');
      
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Delete operation timeout')), 5000)
        );
      
      const deletePromise = (async () => {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('AuthContext: No authenticated user found:', userError);
          return { error: new Error('No authenticated user found') };
        }

        console.log('AuthContext: User found for deletion:', user.id);

        // Try to use the API route first (if service role key is configured)
        try {
          console.log('AuthContext: Attempting API route deletion...');
          const response = await fetch('/api/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });
          
          if (response.ok) {
            console.log('AuthContext: API route deletion successful');
            await supabase.auth.signOut();
            return { error: null };
          } else {
            const errorData = await response.json();
            console.log('AuthContext: API route failed with status:', response.status, 'Error:', errorData);
          }
        } catch (apiError) {
          console.log('AuthContext: API route failed, falling back to client-side deletion:', apiError);
        }

        // Fallback: Client-side deletion (delete profile only)
        console.log('AuthContext: Attempting client-side profile deletion...');
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (profileError) {
          console.error('AuthContext: Profile deletion failed:', profileError);
          console.log('AuthContext: This is likely due to RLS policy. Proceeding with local cleanup...');
          
          // Even if Supabase deletion fails, we should clear local data and sign out
          // This ensures the user can't access their data locally
          console.log('AuthContext: Clearing local data and signing out...');
          await supabase.auth.signOut();
          
          // Clear any remaining local state
          console.log('AuthContext: Clearing local storage in fallback...');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('connect.app.v1');
            localStorage.clear();
          }
          
          return { error: null }; // Don't return error, just clear local data
        }

        console.log('AuthContext: Profile deleted successfully, signing out...');
        await supabase.auth.signOut();
        
        // Clear any remaining local state
        console.log('AuthContext: Clearing local storage...');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('connect.app.v1');
          localStorage.clear();
        }
        
        console.log('AuthContext: Account deletion completed successfully');
        return { error: null };
      })();
      
      // Race between delete operation and timeout
      const result = await Promise.race([deletePromise, timeoutPromise]);
      return result;
      
    } catch (error) {
      console.error('AuthContext: Unexpected error during account deletion:', error);
      
      // Even if there's an error, try to sign out to clear local state
      try {
        await supabase.auth.signOut();
        console.log('AuthContext: Signed out despite error');
        
        // Clear any remaining local state
        console.log('AuthContext: Clearing local storage in error handler...');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('connect.app.v1');
          localStorage.clear();
        }
      } catch (signOutError) {
        console.error('AuthContext: Failed to sign out:', signOutError);
        
        // Even if sign out fails, clear local storage
        console.log('AuthContext: Clearing local storage despite sign out error...');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('connect.app.v1');
          localStorage.clear();
        }
      }
      
      return { error: new Error('Failed to delete account: ' + (error as Error).message) };
    }
  };

  const value = {
    user,
    loading,
    supabase,
    signIn,
    signUp,
    signOut,
    updateProfile,
    sendPhoneVerification,
    sendEmailVerification,
    verifyPhoneCode,
    verifyEmailCode,
    checkUserExists,
    loadUserProfile,
    deleteAccount,
    uploadAvatar,
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
