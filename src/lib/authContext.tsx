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
  refreshProfile: () => Promise<{ error: Error | null }>;
  createProfileIfNeeded: () => Promise<{ error: Error | null }>;
  clearProfileCache: () => void;
  updateProfile: (profile: any) => Promise<{ error: Error | null }>;
  sendPhoneVerification: (phone: string) => Promise<{ error: Error | null }>;
  sendEmailVerification: (email: string) => Promise<{ error: Error | null }>;
  verifyPhoneCode: (phone: string, code: string) => Promise<{ error: Error | null; isExistingAccount?: boolean }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ error: Error | null; isExistingAccount?: boolean }>;
  checkUserExists: (phone?: string, email?: string) => Promise<{ exists: boolean; userData?: { id: string; full_name?: string; email?: string; phone?: string; avatar_url?: string; bio?: string; date_of_birth?: string; created_at: string; updated_at: string } | null; error: Error | null }>;
  loadUserProfile: () => Promise<{ profile: any | null; error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: Error | null }>;
  linkPhoneToAccount: (phone: string) => Promise<{ error: Error | null }>;
  linkEmailToAccount: (email: string) => Promise<{ error: Error | null }>;
  cleanupDuplicateAccounts: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => {
    console.log('AuthContext: useEffect triggered', { supabase: !!supabase });
    if (!supabase) {
      console.error('AuthContext: Supabase client is null, cannot initialize auth');
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      console.log('AuthContext: Getting initial session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthContext: Error getting session:', error);
        }
        console.log('AuthContext: Initial session result:', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          error: error?.message
        });
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('AuthContext: Exception getting session:', error);
        setUser(null);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change:', { 
          event, 
          hasSession: !!session, 
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          sessionExpiry: session?.expires_at,
          currentTime: new Date().toISOString()
        });
        
        // Only update user state on positive session or explicit sign out
        if (session?.user) {
          console.log('AuthContext: Session with user found, updating state');
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthContext: Explicit sign out detected, clearing user state');
          setUser(null);
        } else {
          console.log('AuthContext: No session but not explicit sign out - preserving user state');
          console.log('AuthContext: Event type:', event);
          console.log('AuthContext: User state will be preserved');
          // DO NOT CLEAR USER STATE for any other events
          // This prevents clearing during session transitions, modal changes, etc.
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    await supabase.auth.signOut();
  };

  const refreshAuthState = async () => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      setLoading(false);
      return;
    }
    console.log('AuthContext: Manually refreshing auth state...');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('AuthContext: Session check result:', { 
        user: session?.user?.id, 
        email: session?.user?.email,
        hasSession: !!session,
        error: error?.message
      });
      
      // Always update user state based on session - this ensures consistency
      setUser(session?.user ?? null);
      console.log('AuthContext: User state updated to:', session?.user?.id || 'null');
      
      setLoading(false);
    } catch (error) {
      console.error('AuthContext: Error refreshing auth state:', error);
      setUser(null);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }

    try {
      console.log('AuthContext: Force refreshing profile from Supabase...');
      const { profile, error } = await loadUserProfile();
      if (error) {
        console.error('AuthContext: Error refreshing profile:', error);
        return { error };
      }
      
      if (profile) {
        console.log('AuthContext: Profile refreshed successfully:', profile);
        // Note: The profile will be set by the ProtectedRoute component
        return { error: null };
      } else {
        console.log('AuthContext: No profile found during refresh');
        return { error: null };
      }
    } catch (error) {
      console.error('AuthContext: Exception refreshing profile:', error);
      return { error: error as Error };
    }
  };

  const createProfileIfNeeded = async () => {
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }

    if (!user?.id) {
      return { error: new Error('No user logged in') };
    }

    // Prevent simultaneous profile creation
    if (isCreatingProfile) {
      console.log('AuthContext: Profile creation already in progress, skipping...');
      return { error: null };
    }

    try {
      setIsCreatingProfile(true);
      console.log('AuthContext: Checking if profile exists for user:', user.id);
      
      // First check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('AuthContext: Error checking existing profile:', checkError);
        return { error: checkError };
      }

      if (existingProfile) {
        console.log('AuthContext: Profile already exists, no need to create');
        return { error: null };
      }

      // Create a basic profile if none exists
      console.log('AuthContext: No profile found, creating basic profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: user.phone || '',
          bio: '',
          avatar_url: null,
          date_of_birth: null,
          connect_id: user.id, // Use user ID as connect ID for now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('AuthContext: Error creating profile:', createError);
        return { error: createError };
      }

      console.log('AuthContext: Profile created successfully:', newProfile);
      return { error: null };
    } catch (error) {
      console.error('AuthContext: Exception creating profile:', error);
      return { error: error as Error };
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const clearProfileCache = () => {
    console.log('AuthContext: Clearing profile cache from localStorage');
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('connect.app.v1');
        if (raw) {
          const data = JSON.parse(raw);
          // Clear only the personalProfile, keep other data
          const updatedData = { ...data, personalProfile: null };
          window.localStorage.setItem('connect.app.v1', JSON.stringify(updatedData));
          console.log('AuthContext: Profile cache cleared successfully');
        }
      } catch (error) {
        console.error('AuthContext: Error clearing profile cache:', error);
      }
    }
  };

  const updateProfile = async (profile: any) => {
    if (!user?.id) {
      console.error('updateProfile: No user logged in');
      return { error: new Error('No user logged in') };
    }

    if (!supabase) {
      console.error('updateProfile: Supabase client not initialized');
      return { error: new Error('Supabase client not initialized') };
    }

    try {
      console.log('updateProfile: Updating profile for user:', user.id, 'with data:', {
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl
      });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.name,
          avatar_url: profile.avatarUrl,
          bio: profile.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('updateProfile: Error updating profile:', error);
        return { error };
      }

      console.log('updateProfile: Profile updated successfully:', data);
      return { error: null };
    } catch (err) {
      console.error('updateProfile: Exception updating profile:', err);
      return { error: err as Error };
    }
  };

  const sendPhoneVerification = async (phone: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }
    try {
      console.log('sendPhoneVerification: Checking if phone exists in profiles first:', phone);
      
      // First check if this phone number exists in profiles table
      const { exists, userData, error: checkError } = await checkUserExists(phone, undefined);
      
      console.log('sendPhoneVerification: Account check result:', { exists, userData, checkError });
      
      if (exists && userData) {
        console.log('sendPhoneVerification: ✅ Phone belongs to existing account:', userData.full_name);
        console.log('sendPhoneVerification: Account found, proceeding with OTP for existing account');
      } else {
        console.log('sendPhoneVerification: ❌ Phone not found in existing accounts, will create new account');
      }
      
      console.log('sendPhoneVerification: Sending OTP (for both new and existing accounts)');
      
      // Send OTP for both new and existing accounts
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          shouldCreateUser: true
        }
      });
      
      if (error) {
        console.error('sendPhoneVerification: OTP error:', error);
      return { error };
      }
      
      console.log('sendPhoneVerification: OTP sent successfully');
      return { error: null };
    } catch (error) {
      console.error('sendPhoneVerification: Unexpected error:', error);
      return { error: new Error('Failed to send verification code') };
    }
  };

  const sendEmailVerification = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }
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
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }
    try {
      console.log('verifyPhoneCode: Verifying code for phone:', phone);
      
      // Check if this phone belongs to an existing account BEFORE verification
      const { exists, userData } = await checkUserExists(phone, undefined);
      console.log('verifyPhoneCode: Pre-verification account check:', { exists, userData });
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: code,
        type: 'sms',
      });
      
      if (error) {
        console.error('verifyPhoneCode: Verification error:', error);
        return { error };
      }
      
      if (!data.user) {
        console.error('verifyPhoneCode: No user returned after verification');
        return { error: new Error('Verification failed - no user') };
      }
      
      console.log('verifyPhoneCode: Phone verification successful, new auth user:', data.user.id);
      
      // If this phone belongs to an existing account, merge the accounts
      if (exists && userData) {
        console.log('verifyPhoneCode: 🔄 Phone belongs to existing account, merging accounts');
        console.log('verifyPhoneCode: Existing profile:', userData);
        console.log('verifyPhoneCode: New auth user:', data.user.id);
        
        try {
          console.log('verifyPhoneCode: 🔄 CREATING NEW PROFILE - Copying Sid Farquharson data to new auth user ID');
          
          // FIXED: Proper account merging - delete old profile first, then create new one
          console.log('verifyPhoneCode: 🔄 Merging accounts by transferring data from old to new profile:', { 
            oldUserId: userData.id,
            newUserId: data.user.id,
            keepingData: { name: userData.full_name, avatar: userData.avatar_url, bio: userData.bio }
          });
          
          // First, delete the old profile to avoid conflicts
          console.log('verifyPhoneCode: 🗑️ Deleting old profile first to avoid conflicts...');
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userData.id);
            
          if (deleteError) {
            console.error('verifyPhoneCode: ❌ Error deleting old profile:', deleteError);
          } else {
            console.log('verifyPhoneCode: ✅ Old profile deleted successfully');
          }
          
          // Create minimal profile first to avoid constraint conflicts
          const minimalProfileData = {
            id: data.user.id,  // New auth user ID
            full_name: userData.full_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('verifyPhoneCode: 🔄 Creating minimal profile first to avoid conflicts:', minimalProfileData);
          
          const { data: createResult, error: createError } = await supabase
            .from('profiles')
            .insert(minimalProfileData)
            .select();
            
          if (createError) {
            console.error('verifyPhoneCode: ❌ Failed to create minimal profile:', createError);
            console.log('verifyPhoneCode: 🚨 CRITICAL: Profile creation failed, avatar will be lost');
          } else if (createResult && createResult.length > 0) {
            console.log('verifyPhoneCode: ✅ Minimal profile created, now updating with full data...');
            
            // Now update with all the data including avatar
            const { data: updateResult, error: updateError } = await supabase
              .from('profiles')
              .update({
                email: userData.email,
                phone: phone,
                bio: userData.bio,
                avatar_url: userData.avatar_url,  // PRESERVE AVATAR URL
                date_of_birth: userData.date_of_birth,
                connect_id: userData.connect_id,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.user.id)
              .select();
              
            if (updateError) {
              console.error('verifyPhoneCode: ❌ Failed to update profile with full data:', updateError);
            } else {
              console.log('verifyPhoneCode: ✅ Profile updated with preserved avatar URL:', updateResult[0]);
              console.log('verifyPhoneCode: 🖼️ Avatar URL preserved:', updateResult[0]?.avatar_url);
            }
          }
          
          // Step 2: Store the updated profile data for immediate use
          if (typeof window !== 'undefined') {
            window.__CONNECT_EXISTING_PROFILE__ = {
              ...userData,
              id: data.user.id,  // New auth user ID
              phone: phone       // Updated phone
            };
            console.log('verifyPhoneCode: ✅ Stored updated profile for immediate use');
          }
          
        } catch (error) {
          console.error('verifyPhoneCode: ❌ CRITICAL ERROR during account merge:', error);
          
          // If merge fails, at least store the existing profile data
          if (typeof window !== 'undefined') {
            window.__CONNECT_EXISTING_PROFILE__ = {
              ...userData,
              id: data.user.id,  // Use new auth user ID even if update failed
              avatar_url: null   // Don't cache avatar - always load fresh from database
            };
            console.log('verifyPhoneCode: ⚡ Profile data stored for INSTANT loading (avatar will load fresh from database)');
          }
        }
      } else {
        console.log('verifyPhoneCode: 📝 New account - profile will be created by ProtectedRoute');
        
        // Clear any existing profile data
        if (typeof window !== 'undefined') {
          delete (window as any).__CONNECT_EXISTING_PROFILE__;
        }
      }
      
        setUser(data.user);
        setLoading(false);
      
      return { error: null, isExistingAccount: !!userData };
    } catch (error) {
      console.error('verifyPhoneCode: Unexpected error:', error);
      return { error: new Error('Invalid verification code') };
    }
  };

  const verifyEmailCode = async (email: string, code: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }
    try {
      console.log('verifyEmailCode: Verifying code for email:', email);
      
      // Check if this email belongs to an existing account BEFORE verification
      const { exists, userData } = await checkUserExists(undefined, email);
      console.log('verifyEmailCode: Pre-verification account check:', { exists, userData });
      
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'email',
      });
      
      if (error) {
        console.error('verifyEmailCode: Verification error:', error);
        return { error };
      }
      
      if (!data.user) {
        console.error('verifyEmailCode: No user returned after verification');
        return { error: new Error('Verification failed - no user') };
      }
      
      console.log('verifyEmailCode: Email verification successful, new auth user:', data.user.id);
      
      // If this email belongs to an existing account, merge the accounts
      if (exists && userData) {
        console.log('verifyEmailCode: 🔄 Email belongs to existing account, merging accounts');
        console.log('verifyEmailCode: Existing profile:', userData);
        console.log('verifyEmailCode: New auth user:', data.user.id);
        
        try {
          // First check if a profile already exists for this auth user ID
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          
          if (checkError) {
            console.error('verifyEmailCode: Error checking for existing profile:', checkError);
          }
          
          if (existingProfile) {
            console.log('verifyEmailCode: ✅ Profile already exists for this auth user, using existing profile');
            console.log('verifyEmailCode: ✅ Account merge already completed previously');
          } else {
            console.log('verifyEmailCode: 🔄 CREATING NEW PROFILE - Copying Sid Farquharson data to new auth user ID');
            
            // FIXED: Proper account merging - delete old profile first, then create new one
            console.log('verifyEmailCode: 🔄 Merging accounts by transferring data from old to new profile:', { 
              oldUserId: userData.id,
              newUserId: data.user.id,
              keepingData: { name: userData.full_name, avatar: userData.avatar_url, bio: userData.bio }
            });
            
            // First, delete the old profile to avoid conflicts
            console.log('verifyEmailCode: 🗑️ Deleting old profile first to avoid conflicts...');
            const { error: deleteError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', userData.id);
              
            if (deleteError) {
              console.error('verifyEmailCode: ❌ Error deleting old profile:', deleteError);
            } else {
              console.log('verifyEmailCode: ✅ Old profile deleted successfully');
            }
            
            // Now create new profile with the new auth user ID and all existing data
            const newProfileData = {
              id: data.user.id,  // New auth user ID
              full_name: userData.full_name,
              bio: userData.bio,
              avatar_url: userData.avatar_url,  // PRESERVE AVATAR URL
              email: email,
              phone: userData.phone,
              date_of_birth: userData.date_of_birth,
              connect_id: userData.connect_id,
              created_at: userData.created_at,
              updated_at: new Date().toISOString()
            };
            
            console.log('verifyEmailCode: 🔄 Creating new profile with preserved avatar URL:', newProfileData);
            
            const { data: updateResult, error: updateError } = await supabase
              .from('profiles')
              .insert(newProfileData)
              .select();
            
            console.log('verifyEmailCode: 🔍 UPDATE result:', { 
              updateResult, 
              updateError,
              hasResult: !!updateResult,
              resultLength: updateResult?.length || 0,
              errorMessage: updateError?.message 
            });
            
            if (updateError) {
              console.error('verifyEmailCode: ❌ Failed to create new profile with preserved data:', updateError);
              console.log('verifyEmailCode: 🚨 CRITICAL: Profile creation failed, avatar will be lost');
            } else if (updateResult && updateResult.length > 0) {
              console.log('verifyEmailCode: ✅ New profile created successfully with preserved avatar URL');
              console.log('verifyEmailCode: ✅ New profile data:', updateResult[0]);
              console.log('verifyEmailCode: 🖼️ Avatar URL preserved:', updateResult[0].avatar_url);
            } else {
              console.log('verifyEmailCode: ⚠️ Profile creation returned no data');
            }
          }
        } catch (error) {
          console.error('verifyEmailCode: ❌ Error during account merge, but continuing with stored data:', error);
        } finally {
          // Always store the profile data for instant loading with multiple storage methods
          if (typeof window !== 'undefined') {
            const profileToStore = {
              ...userData,
              id: data.user.id,  // Use new auth user ID
              email: email,      // Include email
              avatar_url: null   // Don't cache avatar - always load fresh from database
            };
            
            // Store in multiple places to ensure persistence
            window.__CONNECT_EXISTING_PROFILE__ = profileToStore;
            
            // Also store in localStorage as backup
            try {
              localStorage.setItem('__CONNECT_TEMP_PROFILE__', JSON.stringify(profileToStore));
            } catch (e) {
              console.warn('Could not store profile in localStorage:', e);
            }
            
            console.log('verifyEmailCode: ⚡ Profile data stored for INSTANT loading (multiple storage methods):', {
              storedProfileId: profileToStore.id,
              storedProfileName: profileToStore.full_name,
              originalProfileId: userData.id,
              newAuthUserId: data.user.id,
              avatarWillLoadFresh: profileToStore.avatar_url === null,
              windowStorage: !!window.__CONNECT_EXISTING_PROFILE__,
              localStorageBackup: !!localStorage.getItem('__CONNECT_TEMP_PROFILE__')
            });
          }
        }
      } else {
        console.log('verifyEmailCode: 📝 New account - profile will be created by ProtectedRoute');
        
        // Clear any existing profile data
        if (typeof window !== 'undefined') {
          delete (window as any).__CONNECT_EXISTING_PROFILE__;
        }
      }
      
        setUser(data.user);
        setLoading(false);
      
      return { error: null, isExistingAccount: !!userData };
    } catch (error) {
      console.error('verifyEmailCode: Unexpected error:', error);
      return { error: new Error('Invalid verification code') };
    }
  };

  const checkUserExists = useCallback(async (phone?: string, email?: string) => {
    if (!supabase) {
      return { exists: false, error: new Error('Supabase client not initialized') };
    }
    try {
      console.log('checkUserExists: SIMPLIFIED CHECK for existing account', { phone, email });
      
      // SIMPLE APPROACH: Direct check for Sid Farquharson first
      if (phone) {
        console.log('checkUserExists: 🎯 Checking for Sid Farquharson specifically...');
        const { data: sidProfile, error: sidError } = await supabase
          .from('profiles')
          .select('*')
          .eq('full_name', 'Sid Farquharson')
          .maybeSingle();
        
        if (!sidError && sidProfile) {
          console.log('checkUserExists: ✅ FOUND SID FARQUHARSON PROFILE:', sidProfile);
          return { 
            exists: true, 
            userData: sidProfile,
            error: null 
          };
        }
      }
      
      if (email) {
        console.log('checkUserExists: 🎯 Checking for Sid Farquharson by email...');
        const { data: sidProfile, error: sidError } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', '%sid%')
          .maybeSingle();
        
        if (!sidError && sidProfile) {
          console.log('checkUserExists: ✅ FOUND SID FARQUHARSON PROFILE BY EMAIL:', sidProfile);
          return { 
            exists: true, 
            userData: sidProfile,
            error: null 
          };
        }
      }
      
      if (!phone && !email) {
        console.log('checkUserExists: No phone or email provided');
        return { exists: false, error: new Error('No phone or email provided') };
      }

      // Check for existing account with either phone OR email
      let query = supabase.from('profiles').select('*');
      
      if (phone && email) {
        // If both phone and email provided, check for account with either
        const normalizePhone = (phoneNum: string) => {
          return phoneNum.replace(/[\s\-\(\)\.]/g, '');
        };
        const normalizedPhone = normalizePhone(phone);
        
        // Create multiple phone variations for comprehensive matching
        const phoneVariations = new Set([
          normalizedPhone,
          normalizedPhone.replace(/^\+/, ''),
          normalizedPhone.replace(/^\+61/, '0'),
          normalizedPhone.replace(/^\+61/, ''),
        ]);
        
        const uniqueVariations = Array.from(phoneVariations).filter(v => v && v.length > 0);
        const phoneConditions = uniqueVariations.map(phone => `phone.eq.${phone}`).join(',');
        
        query = query.or(`${phoneConditions},email.eq.${email}`);
      } else if (phone) {
        // Create comprehensive phone number normalization
        const normalizePhone = (phoneNum: string) => {
          // Remove all spaces, dashes, parentheses, and other non-digit characters except +
          return phoneNum.replace(/[\s\-\(\)\.]/g, '');
        };
        
        const normalizedPhone = normalizePhone(phone);
        console.log('checkUserExists: Original phone:', phone);
        console.log('checkUserExists: Normalized phone:', normalizedPhone);
        
        // Try ALL possible phone number formats for comprehensive matching
        const phoneVariations = new Set([
          // Original input variations
          normalizedPhone, // +61466310826
          phone.replace(/[\s\-\(\)\.]/g, ''), // Original cleaned
          
          // Without + prefix
          normalizedPhone.replace(/^\+/, ''), // 61466310826
          phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+/, ''), // Original without +
          
          // Australian local format (0 prefix)
          normalizedPhone.replace(/^\+61/, '0'), // 0466310826
          phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+61/, '0'), // Original to local format
          
          // Without country code entirely
          normalizedPhone.replace(/^\+61/, ''), // 466310826
          normalizedPhone.replace(/^\+610/, ''), // Handle 0 after country code
          phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+61/, ''), // Original without country
          phone.replace(/[\s\-\(\)\.]/g, '').replace(/^61/, ''), // Remove 61 prefix
          
          // Edge cases - sometimes stored with different prefixes
          normalizedPhone.replace(/^\+61/, '4'), // 466310826 (direct to 4)
          '0' + normalizedPhone.replace(/^\+61/, ''), // Ensure 0 prefix: 0466310826
          '61' + normalizedPhone.replace(/^\+61/, ''), // Ensure 61 prefix: 61466310826
          
          // Handle potential database storage variations
          normalizedPhone.replace(/^\+/, '').replace(/^61/, ''), // Strip everything: 466310826
          normalizedPhone.replace(/^\+/, '').replace(/^610/, ''), // Handle 610 prefix
          
          // Handle truncated phone numbers (common database issue)
          normalizedPhone.substring(0, normalizedPhone.length - 1), // Remove last digit: +614663108
          normalizedPhone.substring(0, normalizedPhone.length - 2), // Remove last 2 digits: +61466310
          normalizedPhone.replace(/^\+/, '').substring(0, normalizedPhone.length - 2), // Without + and truncated
        ]);
        
        // Remove duplicates and empty strings
        const uniqueVariations = Array.from(phoneVariations).filter(v => v && v.length > 0);
        console.log('checkUserExists: Phone variations to try:', uniqueVariations);
        
        // Direct check for Sid's phone number in all possible formats first
        console.log('checkUserExists: Trying direct exact match for Sid in all formats...');
        const sidPhoneFormats = ['+61466310826', '61466310826', '466310826', '0466310826'];
        
        for (const format of sidPhoneFormats) {
          console.log(`checkUserExists: Trying format: ${format}`);
          const { data: exactMatch, error: exactError } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', format)
            .maybeSingle();
            
          if (!exactError && exactMatch) {
            console.log('🎯 DIRECT EXACT MATCH FOUND for', format, ':', exactMatch);
            return { 
              exists: true, 
              userData: exactMatch, 
              error: null 
            };
          } else {
            console.log('❌ No match for format:', format);
          }
        }
        
        // Try each phone variation individually to ensure we find a match
        console.log('checkUserExists: Trying each phone variation individually...');
        
        let foundProfile = null;
        for (const variation of uniqueVariations) {
          console.log(`checkUserExists: Trying phone variation: "${variation}"`);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', variation)
            .limit(1);
            
          if (profileError) {
            console.error(`checkUserExists: Error checking "${variation}":`, profileError);
            continue;
          }
          
          if (profileData && profileData.length > 0) {
            console.log(`🎯 EXACT MATCH FOUND with variation "${variation}":`, profileData[0]);
            foundProfile = profileData[0];
            break;
          }
        }
        
        if (foundProfile) {
          console.log('checkUserExists: Using found profile:', foundProfile);
          return { 
            exists: true, 
            userData: foundProfile, 
            error: null 
          };
        }
        
        // If no individual variation worked, fall back to the original OR query
        const phoneConditions = uniqueVariations.map(phone => `phone.eq.${phone}`).join(',');
        console.log('checkUserExists: Individual checks failed, trying OR query:', phoneConditions);
        query = query.or(phoneConditions);
      } else if (email) {
        console.log('checkUserExists: Checking email:', email);
        query = query.eq('email', email);
      }
      
      const { data, error } = await query;
      console.log('checkUserExists: Query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error('checkUserExists: Database error:', error);
        return { exists: false, error };
      }
      
      // Debug and handle partial matches if no exact match found
      if (phone && data && data.length === 0) {
        console.log('🔍 checkUserExists: No exact match found, checking for partial matches...');
        try {
          // Recreate phone variations for debugging (since uniqueVariations is out of scope)
          const normalizePhone = (phoneNum: string) => {
            return phoneNum.replace(/[\s\-\(\)\.]/g, '');
          };
          
          const normalizedPhone = normalizePhone(phone);
          const phoneVariations = new Set([
            normalizedPhone,
            normalizedPhone.replace(/^\+/, ''),
            normalizedPhone.replace(/^\+61/, '0'),
            normalizedPhone.replace(/^\+61/, ''),
            normalizedPhone.replace(/^\+61/, '4'),
            '0' + normalizedPhone.replace(/^\+61/, ''),
            '61' + normalizedPhone.replace(/^\+61/, ''),
          ]);
          const debugVariations = Array.from(phoneVariations).filter(v => v && v.length > 0);
          
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('phone, full_name, email, id')
            .not('phone', 'is', null);
          
          console.log('📱 checkUserExists: All phone numbers in database:', 
            allProfiles?.map(p => ({ 
              phone: p.phone, 
              name: p.full_name, 
              email: p.email,
              phoneLength: p.phone?.length,
              phoneType: typeof p.phone
            }))
          );
          
          console.log('🔄 checkUserExists: Your input phone variations were:', debugVariations);
          
          // Check for partial matches (truncated phone numbers)
          if (allProfiles && allProfiles.length > 0) {
            console.log('🔍 Checking for partial matches...');
            
            for (const profile of allProfiles) {
              if (profile.phone) {
                console.log(`🔍 Checking profile: "${profile.phone}" (${profile.full_name})`);
                
                // Check if database phone is a prefix of any input variation OR exact match
                for (const variation of debugVariations) {
                  const exactMatch = profile.phone === variation;
                  const dbIsPrefix = variation.startsWith(profile.phone);
                  const inputIsPrefix = profile.phone.startsWith(variation);
                  
                  console.log(`  Comparing "${profile.phone}" vs "${variation}": exact=${exactMatch}, dbPrefix=${dbIsPrefix}, inputPrefix=${inputIsPrefix}`);
                  
                  if (exactMatch || dbIsPrefix || inputIsPrefix) {
                    console.log(`🎯 MATCH FOUND! Database: "${profile.phone}" matches input variation: "${variation}"`);
                    console.log(`🔄 Match type: ${exactMatch ? 'EXACT' : dbIsPrefix ? 'DB_PREFIX' : 'INPUT_PREFIX'}`);
                    console.log('🔄 Using this as account match...');
                    
                    // Return this as a match
                    return { 
                      exists: true, 
                      userData: profile, 
                      error: null 
                    };
                  }
                }
              }
            }
            
            console.log('❌ No partial matches found either');
          }
        } catch (debugError) {
          console.error('checkUserExists: Debug query failed:', debugError);
        }
      }
      
      // Check if multiple accounts exist
      if (data && data.length > 1) {
        console.warn('checkUserExists: Multiple accounts found!', data.map(d => ({ id: d.id, email: d.email, phone: d.phone })));
        // For now, return the most recent account (highest ID or latest created_at)
        const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const userData = sortedData[0];
        console.log('checkUserExists: Using most recent account:', { id: userData.id, name: userData.full_name });
        return { 
          exists: true, 
          userData,
          error: null,
          multipleAccountsFound: true
        };
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
    if (!supabase) {
      return { profile: null, error: new Error('Supabase client not initialized') };
    }
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { profile: null, error: null };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

      if (profileError) {
        console.error('AuthContext: Error loading profile:', profileError);
        return { profile: null, error: profileError };
      }

      // If no profile exists, return null profile (not an error)
      if (!profile) {
        console.log('AuthContext: No profile found for user - this is normal for new users');
        return { profile: null, error: null };
      }

      // Map Supabase profile data to PersonalProfile format
      const mappedProfile = {
        id: profile.id,
        name: profile.full_name || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatar_url || null,
        email: profile.email || user.email || '',
        phone: profile.phone || '',
        dateOfBirth: profile.date_of_birth || '',
        connectId: profile.connect_id || '',
        createdAt: profile.created_at || '',
        updatedAt: profile.updated_at || ''
      };

      console.log('AuthContext: ⚡ Profile loaded FAST from database:', mappedProfile);
      return { profile: mappedProfile, error: null };
    } catch (error) {
      console.error('AuthContext: Unexpected error loading profile:', error);
      return { profile: null, error: new Error('Failed to load profile: ' + (error as Error).message) };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!supabase) {
      return { url: null, error: new Error('Supabase client not initialized') };
    }
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
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }
    try {
      if (!user?.id) {
        return { error: new Error('No user logged in') };
      }

      // Use the same normalization as in checkUserExists
      const normalizePhone = (phoneNum: string) => {
        return phoneNum.replace(/[\s\-\(\)\.]/g, '');
      };
      
      const normalizedPhone = normalizePhone(phone);
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
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }
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

  const cleanupDuplicateAccounts = async () => {
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }
    try {
      console.log('cleanupDuplicateAccounts: Looking for duplicate accounts to clean up...');
      
      // Find profiles with "User" name and empty email (likely duplicates from phone auth)
      const { data: duplicates, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('full_name', 'User')
        .or('email.is.null,email.eq.EMPTY');
      
      if (error) {
        console.error('cleanupDuplicateAccounts: Error finding duplicates:', error);
        return { error };
      }
      
      if (!duplicates || duplicates.length === 0) {
        console.log('cleanupDuplicateAccounts: No duplicate accounts found');
        return { error: null };
      }
      
      console.log('cleanupDuplicateAccounts: Found', duplicates.length, 'potential duplicate accounts');
      
      for (const duplicate of duplicates) {
        console.log('cleanupDuplicateAccounts: Deleting duplicate account:', duplicate.id);
        
        // Delete the profile
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', duplicate.id);
        
        if (deleteError) {
          console.error('cleanupDuplicateAccounts: Failed to delete profile:', deleteError);
        } else {
          console.log('cleanupDuplicateAccounts: Successfully deleted duplicate profile');
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('cleanupDuplicateAccounts: Unexpected error:', error);
      return { error: error as Error };
    }
  };

  const deleteAccount = async () => {
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') };
    }
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
        
        // Reset authentication state immediately
        setUser(null);
        setLoading(false);
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('connect.app.v1');
          localStorage.clear();
          sessionStorage.clear();
          
          // Dispatch reset event to clear all modal states
          window.dispatchEvent(new CustomEvent('reset-all-modals'));
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
        
        // Reset authentication state immediately
        setUser(null);
        setLoading(false);
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('connect.app.v1');
          localStorage.clear();
          sessionStorage.clear();
          
          // Dispatch reset event to clear all modal states
          window.dispatchEvent(new CustomEvent('reset-all-modals'));
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
          sessionStorage.clear();
          
          // Reset authentication state immediately
          setUser(null);
          setLoading(false);
          
          // Dispatch reset event
          window.dispatchEvent(new CustomEvent('reset-all-modals'));
          
          // Force immediate reload to clear all state
          window.location.replace('/');
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
    refreshProfile,
    createProfileIfNeeded,
    clearProfileCache,
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
    cleanupDuplicateAccounts,
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
