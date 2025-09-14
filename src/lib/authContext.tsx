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
  refreshAuthState: () => Promise<void>;
  updateProfile: (profile: any) => Promise<{ error: Error | null }>;
  sendPhoneVerification: (phone: string) => Promise<{ error: Error | null }>;
  sendEmailVerification: (email: string) => Promise<{ error: Error | null }>;
  verifyPhoneCode: (phone: string, code: string) => Promise<{ error: Error | null }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ error: Error | null }>;
  checkUserExists: (phone?: string, email?: string) => Promise<{ exists: boolean; userData?: { id: string; full_name?: string; email?: string; phone?: string; avatar_url?: string; bio?: string; date_of_birth?: string; created_at: string; updated_at: string } | null; error: Error | null }>;
  loadUserProfile: () => Promise<{ profile: any | null; error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: Error | null }>;
  linkPhoneToAccount: (phone: string) => Promise<{ error: Error | null }>;
  linkEmailToAccount: (email: string) => Promise<{ error: Error | null }>;
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

  const refreshAuthState = async () => {
    console.log('AuthContext: Manually refreshing auth state...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('AuthContext: Session check result:', { user: session?.user?.id, email: session?.user?.email });
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const updateProfile = async (profile: any) => {
    if (!user?.id) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.name,
          avatar_url: profile.avatarUrl,
          bio: profile.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { error: err as Error };
    }
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
      console.log('Email provider:', email.split('@')[1]);
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: { 
          emailRedirectTo: undefined, // prevents magic link
          shouldCreateUser: true, // allows new user creation
          data: {
            // Force OTP method
            method: 'otp'
          }
        }
      });
      console.log('Email verification response:', { data, error });
      console.log('OTP method used:', data?.user ? 'OTP code' : 'Magic link');
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
      
      if (!phone && !email) {
        console.log('checkUserExists: No phone or email provided');
        return { exists: false, error: new Error('No phone or email provided') };
      }

      // Check for existing account with either phone OR email
      let query = supabase.from('profiles').select('*');
      
      if (phone && email) {
        // If both phone and email provided, check for account with either
        const normalizedPhone = phone.replace(/\s/g, '');
        query = query.or(`phone.eq.${normalizedPhone},email.eq.${email}`);
      } else if (phone) {
        // Normalize phone number - remove spaces and ensure consistent format
        const normalizedPhone = phone.replace(/\s/g, '');
        console.log('checkUserExists: Normalized phone:', normalizedPhone);
        query = query.eq('phone', normalizedPhone);
      } else if (email) {
        console.log('checkUserExists: Checking email:', email);
        query = query.eq('email', email);
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

  const linkPhoneToAccount = async (phone: string) => {
    try {
      if (!user?.id) {
        return { error: new Error('No user logged in') };
      }

      const normalizedPhone = phone.replace(/\s/g, '');
      console.log('Linking phone to account:', normalizedPhone);

      const { error } = await supabase
        .from('profiles')
        .update({ phone: normalizedPhone })
        .eq('id', user.id);

      if (error) {
        console.error('Error linking phone:', error);
        return { error };
      }

      console.log('Phone linked successfully');
      return { error: null };
    } catch (error) {
      console.error('Error linking phone:', error);
      return { error: error as Error };
    }
  };

  const linkEmailToAccount = async (email: string) => {
    try {
      if (!user?.id) {
        return { error: new Error('No user logged in') };
      }

      console.log('Linking email to account:', email);

      const { error } = await supabase
        .from('profiles')
        .update({ email: email })
        .eq('id', user.id);

      if (error) {
        console.error('Error linking email:', error);
        return { error };
      }

      console.log('Email linked successfully');
      return { error: null };
    } catch (error) {
      console.error('Error linking email:', error);
      return { error: error as Error };
    }
  };

  const deleteAccount = async () => {
    try {
      console.log('AuthContext: Starting account deletion...');
      
        // Simplified deletion approach
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('AuthContext: No authenticated user found:', userError);
        return { error: new Error('No authenticated user found') };
      }

      console.log('AuthContext: User found for deletion:', user.id);

      // Try API route deletion with service role key
      console.log('AuthContext: Attempting API route deletion...');
      const response = await fetch('/api/delete-account/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      console.log('AuthContext: API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('AuthContext: API route deletion successful:', result);
        
        // Sign out and clear local data
        await supabase.auth.signOut();
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('connect.app.v1');
          localStorage.clear();
          sessionStorage.clear();
        }
        
        console.log('AuthContext: User completely removed from Supabase');
        return { error: null };
      } else {
        const errorData = await response.json();
        console.error('AuthContext: API route failed:', response.status, errorData);
        
        // Fallback: Try to delete profile directly
        console.log('AuthContext: Attempting direct profile deletion as fallback...');
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);
        
        if (profileError) {
          console.error('AuthContext: Direct profile deletion also failed:', profileError);
        } else {
          console.log('AuthContext: Direct profile deletion successful');
        }
        
        // Sign out regardless
        await supabase.auth.signOut();
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('connect.app.v1');
          localStorage.clear();
          sessionStorage.clear();
        }
        
        console.log('AuthContext: Fallback deletion completed');
        return { error: null };
      }
      
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
          // Force reload to clear all state
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
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
    refreshAuthState,
    updateProfile,
    sendPhoneVerification,
    sendEmailVerification,
    verifyPhoneCode,
    verifyEmailCode,
    checkUserExists,
    loadUserProfile,
    deleteAccount,
    uploadAvatar,
    linkPhoneToAccount,
    linkEmailToAccount,
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
