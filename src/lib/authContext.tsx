"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, clearInvalidSession } from './supabaseClient';
import { formatNameForDisplay, normalizeEmail, normalizePhoneAU } from './utils';
import { ChatService } from './chatService';

// Account interface (our true user profile)
interface Account {
  id: string;
  name: string;
  bio?: string;
  dob?: string | null;
  profile_pic?: string;
  connect_id?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  account: Account | null;
  loading: boolean;
  supabase: SupabaseClient | null;
  
  // Authentication methods (compatible with existing UI)
  sendEmailVerification: (email: string) => Promise<{ error: Error | null }>;
  sendPhoneVerification: (phone: string) => Promise<{ error: Error | null }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ error: Error | null; isExistingAccount?: boolean; tempUser?: any }>;
  verifyPhoneCode: (phone: string, code: string) => Promise<{ error: Error | null; isExistingAccount?: boolean; tempUser?: any }>;
  
  // Legacy compatibility methods
  checkUserExists: (phone?: string, email?: string) => Promise<{ exists: boolean; userData?: any; error: Error | null }>;
  loadUserProfile: () => Promise<{ profile: any | null; error: Error | null }>;
  refreshAuthState: () => Promise<void>;
  linkPhoneToAccount: (phone: string) => Promise<{ error: Error | null }>;
  linkEmailToAccount: (email: string) => Promise<{ error: Error | null }>;
  
  // Account management
  createAccount: (userData: { name: string; email?: string; phone?: string; bio?: string; dob?: string }) => Promise<{ error: Error | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  updateProfile: (profile: any) => Promise<{ error: Error | null }>;
  
  // Utility
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  // Debug user state changes
  useEffect(() => {
    console.log('🔍 AuthContext: ========== USER STATE CHANGED ==========');
    console.log('🔍 AuthContext: User state:', user ? { id: user.id, email: user.email, phone: user.phone } : null);
    console.log('🔍 AuthContext: Loading state:', loading);
  }, [user, loading]);

  // Debug account state changes and sync with store
  useEffect(() => {
    console.log('🔍 AuthContext: ========== ACCOUNT STATE CHANGED ==========');
    console.log('🔍 AuthContext: Account state changed:', account ? { id: account.id, name: account.name } : null);
    console.log('🔍 AuthContext: User state:', user ? { id: user.id, email: user.email, phone: user.phone } : null);
    
    // Sync account with personalProfile in store
    if (account && typeof window !== 'undefined') {
      import('./store').then(({ useAppStore }) => {
        try {
        const store = useAppStore.getState();
        console.log('🔍 AuthContext: Store state before sync:', { 
          hasPersonalProfile: !!store.personalProfile,
          personalProfileId: store.personalProfile?.id 
        });
        
        if (store.setPersonalProfile) {
          store.setPersonalProfile({
              id: String(account.id || ''),
              name: String(account.name || ''),
              bio: String(account.bio || ''),
              avatarUrl: String(account.profile_pic || ''),
              email: String(user?.email || ''),
              phone: String(user?.phone || ''),
              dateOfBirth: String(account.dob || ''),
              connectId: String(account.connect_id || ''),
              createdAt: String(account.created_at || ''),
              updatedAt: String(account.updated_at || '')
          });
          console.log('✅ AuthContext: Synced account to personalProfile in store');
          
          // Verify the sync worked
          const updatedStore = useAppStore.getState();
          console.log('🔍 AuthContext: Store state after sync:', { 
            hasPersonalProfile: !!updatedStore.personalProfile,
            personalProfileId: updatedStore.personalProfile?.id,
            personalProfileName: updatedStore.personalProfile?.name
          });
        }
        } catch (error) {
          console.error('❌ AuthContext: Error syncing to store:', error);
        }
      }).catch(error => {
        console.error('❌ AuthContext: Error importing store:', error);
      });
    }
  }, [account, user]);
  const realtimeCleanupRef = useRef<(() => void) | null>(null);

  // Initialize auth state
  useEffect(() => {
    if (!supabase) return;
    
    console.log('🔄 NewAuthContext: ========== AUTH INITIALIZATION STARTING ==========');
    // Force-clean any lingering realtime channels on init
    try {
      const channels = supabase.getChannels?.() || [];
      channels.forEach((ch: any) => supabase.removeChannel(ch));
    } catch (e) {
      console.warn('Realtime cleanup (init) skipped:', e);
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 NewAuthContext: ========== GET INITIAL SESSION CALLED ==========');
        console.log('🔄 NewAuthContext: Loading initial session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ NewAuthContext: Session error:', sessionError);
          // If it's a refresh token error, clear the session
          if (sessionError.message?.includes('Invalid Refresh Token') || sessionError.message?.includes('Refresh Token Not Found')) {
            console.log('🧹 NewAuthContext: Clearing invalid session due to refresh token error');
            await clearInvalidSession();
            setUser(null);
            setAccount(null);
            setLoading(false);
            return;
          }
        }
        
        console.log('✅ NewAuthContext: Initial session result:', { 
          hasSession: !!session?.user, 
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          userPhone: session?.user?.phone,
          sessionError: sessionError?.message 
        });
        
        if (session?.user) {
          console.log('👤 NewAuthContext: ========== SETTING USER FROM INITIAL SESSION ==========');
          console.log('👤 NewAuthContext: User found in session:', { id: session.user.id, email: session.user.email, phone: session.user.phone });
          console.log('👤 NewAuthContext: Current user state before setUser:', user ? { id: user.id, email: user.email } : null);
          
          setUser(session.user);
          
          console.log('👤 NewAuthContext: setUser called, loading account...');
          try {
            await loadAccountForUser(session.user.id);
            console.log('👤 NewAuthContext: Initial account loading completed');
          } catch (error) {
            console.error('👤 NewAuthContext: Initial account loading failed:', error);
          }
          // Realtime sync is handled in the user.id effect
        } else {
          console.log('👤 NewAuthContext: No user in session');
        }
      } catch (error) {
        console.error('❌ NewAuthContext: Error loading initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 NewAuthContext: ========== AUTH STATE CHANGE ==========');
      console.log('🔄 NewAuthContext: Event:', event);
      console.log('🔄 NewAuthContext: Has session:', !!session);
      console.log('🔄 NewAuthContext: Session user:', session?.user ? { 
        id: session.user.id, 
        email: session.user.email, 
        phone: session.user.phone,
        aud: session.user.aud,
        role: session.user.role
      } : null);
      console.log('🔄 NewAuthContext: Session tokens:', {
        hasAccessToken: !!session?.access_token,
        hasRefreshToken: !!session?.refresh_token,
        expiresAt: session?.expires_at
      });
      console.log('🔄 NewAuthContext: Current user state:', user ? { id: user.id, email: user.email } : null);
      console.log('🔄 NewAuthContext: Current account state:', account ? { id: account.id, name: account.name } : null);
      
      // Debug session vs account ID mismatch
      if (session?.user?.id && account?.id) {
        const idsMatch = session.user.id === account.id;
        console.log('🔄 NewAuthContext: ID consistency check:', {
          sessionUserId: session.user.id,
          accountId: account.id,
          idsMatch: idsMatch,
          mismatchWarning: !idsMatch ? '⚠️ MISMATCH DETECTED!' : '✅ IDs match'
        });
      }
      // Force-clean channels on every auth transition
      try {
        const channels = supabase.getChannels?.() || [];
        channels.forEach((ch: any) => supabase.removeChannel(ch));
      } catch (e) {
        console.warn('Realtime cleanup (auth change) skipped:', e);
      }
      
      // Chat service is managed by ChatProvider
      
        if (session?.user) {
          console.log('🔐 AuthContext: ========== AUTH STATE CHANGE - USER SESSION AVAILABLE ==========');
          console.log('🔐 AuthContext: User session available:', { id: session.user.id, email: session.user.email, phone: session.user.phone });
          console.log('🔐 AuthContext: Current user state before setUser:', user ? { id: user.id, email: user.email } : null);
          
          setUser(session.user);
          
          // Call loadAccountForUser and wait for it to complete
          try {
            console.log('🔐 AuthContext: Starting account loading...');
            await loadAccountForUser(session.user.id);
            console.log('🔐 AuthContext: Account loading completed successfully');
          } catch (error) {
            console.error('🔐 AuthContext: Account loading failed:', error);
          }
          
          // Realtime sync is handled in the user.id effect
        } else {
          console.log('🔐 AuthContext: ========== AUTH STATE CHANGE - NO USER SESSION (SOFT CHECK) ==========');
          // Soft-debounce clearing user to avoid brief "blinks" on tab focus/visibility
          try {
            const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
            await delay(150);
            const { data: { session: recheck } } = await supabase.auth.getSession();
            if (recheck?.user) {
              console.log('🔐 AuthContext: Recheck restored session, skipping clear');
              setUser(recheck.user);
              await loadAccountForUser(recheck.user.id);
            } else {
              console.log('🔐 AuthContext: Confirmed no session after recheck, clearing');
          setUser(null);
          setAccount(null);
            }
          } catch (e) {
            console.warn('Auth recheck failed, proceeding to clear:', e);
            setUser(null);
            setAccount(null);
          }
        }
        
        setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      // Clean up real-time sync
      if (realtimeCleanupRef.current) {
        realtimeCleanupRef.current();
      }
    };
  }, [supabase]);

  // Set up real-time sync for profile changes (separate useEffect for when user changes)
  useEffect(() => {
    if (!supabase || !user?.id) return;
    
    const setupRealtimeSync = () => {
      // Clean up existing sync if any
      if (realtimeCleanupRef.current) {
        realtimeCleanupRef.current();
      }

      const channel = supabase
        .channel('profile-sync')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'accounts',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔄 Real-time profile update received:', payload.new);
            // Update local state with the new profile data
            setAccount(payload.new);
            
            // Also update the app store for consistency
            if (typeof window !== 'undefined') {
              import('./store').then(({ useAppStore }) => {
                const store = useAppStore.getState();
              if (store.setPersonalProfile) {
                store.setPersonalProfile({
                  id: payload.new.id,
                  name: payload.new.name,
                  bio: payload.new.bio,
                  avatarUrl: payload.new.profile_pic,
                  email: payload.new.email || '',
                  phone: payload.new.phone || '',
                  dateOfBirth: payload.new.dob || '',
                  connectId: payload.new.connect_id || '',
                  createdAt: payload.new.created_at,
                  updatedAt: payload.new.updated_at
                });
              }
              });
            }
          }
        )
        .subscribe();

      realtimeCleanupRef.current = () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSync();

    return () => {
      if (realtimeCleanupRef.current) {
        realtimeCleanupRef.current();
      }
    };
  }, [supabase, user?.id]);

  // Load account for authenticated user - UNIFIED IDENTITY
  const loadAccountForUser = async (authUserId: string) => {
    try {
      console.log('🔍 AuthContext: Loading account for:', authUserId);
      
      // Direct query - accounts.id = auth.uid() now
      const { data, error } = await supabase!
        .from('accounts')
        .select('*')
        .eq('id', authUserId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setAccount(data);
        console.log('✅ AuthContext: Account loaded:', data.name);
      } else {
        // Create account if doesn't exist (new user signup)
        console.log('🆕 AuthContext: Creating new account for:', authUserId);
        const { data: newAccount, error: createError } = await supabase!
          .from('accounts')
          .insert({ 
            id: authUserId, 
            name: 'User' 
          })
          .select()
          .single();
        
        if (createError) throw createError;
        setAccount(newAccount);
        console.log('✅ AuthContext: New account created');
      }
    } catch (err) {
      console.error('❌ AuthContext: Account load failed:', err);
    }
  };

  // Send email verification
  const sendEmailVerification = async (email: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') };

    try {
      console.log('📧 AuthContext: ========== SENDING EMAIL OTP ==========');
      
      // Normalize email (server-side normalization enforced by RPC)
      const normalizedEmail = normalizeEmail(email);
      console.log('📧 AuthContext: Normalized email:', normalizedEmail);
      
      // Check server-side rate limit
      const { data: canSend, error: rateLimitError } = await supabase
        .rpc('app_can_send_otp', {
          p_identifier: normalizedEmail,
          p_ip: 'client' // In production, get from request headers server-side
        });
      
      console.log('📧 AuthContext: Rate limit check:', { canSend, rateLimitError });
      
      if (rateLimitError || !canSend) {
        console.error('❌ AuthContext: Rate limit exceeded');
        return { error: new Error('Rate limit exceeded. Please wait before requesting another code.') };
      }
      
      // Send OTP via Supabase Auth
      const { data, error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { 
          emailRedirectTo: undefined,
          shouldCreateUser: true
        }
      });

      console.log('📧 AuthContext: OTP response:', { 
        hasData: !!data, 
        hasError: !!error, 
        errorMessage: error?.message
      });

      if (error) {
        console.error('❌ AuthContext: Email OTP error:', error.message);
        throw error;
      }
      
      console.log('✅ AuthContext: Email verification sent successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ AuthContext: Error sending email verification:', error);
      return { error: error as Error };
    }
  };

  // Send phone verification
  const sendPhoneVerification = async (phone: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') };

    try {
      console.log('📱 AuthContext: ========== SENDING PHONE OTP ==========');
      
      // Normalize phone (server-side normalization enforced by RPC)
      let normalizedPhone: string;
      try {
        normalizedPhone = normalizePhoneAU(phone);
        console.log('📱 AuthContext: Normalized phone:', normalizedPhone);
      } catch (err) {
        console.error('❌ AuthContext: Invalid phone format:', err);
        return { error: new Error('Invalid phone number format') };
      }
      
      // Check server-side rate limit
      const { data: canSend, error: rateLimitError } = await supabase
        .rpc('app_can_send_otp', {
          p_identifier: normalizedPhone,
          p_ip: 'client'
        });
      
      console.log('📱 AuthContext: Rate limit check:', { canSend, rateLimitError });
      
      if (rateLimitError || !canSend) {
        console.error('❌ AuthContext: Rate limit exceeded');
        return { error: new Error('Rate limit exceeded. Please wait before requesting another code.') };
      }
      
      // Send OTP via Supabase Auth
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: { 
          shouldCreateUser: true
        }
      });

      if (error) {
        console.error('❌ AuthContext: Phone OTP error:', error.message);
        throw error;
      }
      
      console.log('✅ AuthContext: Phone verification sent successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ AuthContext: Error sending phone verification:', error);
      return { error: error as Error };
    }
  };

  // Verify email code
  const verifyEmailCode = async (email: string, code: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') };

    try {
      console.log('🔐 AuthContext: ========== VERIFYING EMAIL OTP ==========');
      
      // Step 1: Verify OTP with Supabase Auth
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email'
      });

      if (error) {
        console.error('🔐 AuthContext: OTP verification failed:', error.message);
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          return { error: new Error('Verification code has expired. Please request a new code.') };
        }
        throw error;
      }
      
      if (!data.user) throw new Error('No user returned from verification');

      console.log('✅ AuthContext: Email verification successful, user ID:', data.user.id);

      // Step 2: Check if account already exists
      const { data: existingAccount, error: fetchError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', data.user.id)
        .single();

      let account;
      let isExistingAccount = false;

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected for new users
        console.error('❌ AuthContext: Failed to fetch existing account:', fetchError);
        throw fetchError;
      }

      if (existingAccount) {
        // Account already exists
        account = existingAccount;
        isExistingAccount = true;
        console.log('✅ AuthContext: Existing account found:', account.name);
      } else {
        // Account doesn't exist, create new one
        console.log('🆕 AuthContext: Creating new account for user:', data.user.id);
        const { data: newAccount, error: createError } = await supabase
          .from('accounts')
          .insert({ 
            id: data.user.id,
            name: 'User'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ AuthContext: Failed to create new account:', createError);
          throw createError;
        }

        account = newAccount;
        isExistingAccount = false;
        console.log('✅ AuthContext: New account created:', account);
      }

      // Step 3: Set account state
      setAccount(account);
      
      // CRITICAL: Immediately trigger auth state change for instant login
      console.log('🔐 AuthContext: Triggering immediate auth state change...');
      setUser(data.user);
      setLoading(false);

      return { 
        error: null, 
        isExistingAccount,
        tempUser: isExistingAccount ? undefined : { email: email, authUserId: data.user.id }
      };
    } catch (error) {
      console.error('❌ AuthContext: Error verifying email code:', error);
      return { error: error as Error };
    }
  };

  // Verify phone code
  const verifyPhoneCode = async (phone: string, code: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') };

    try {
      console.log('🔐 AuthContext: ========== VERIFYING PHONE OTP ==========');
      
      // Step 1: Verify OTP with Supabase Auth
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms'
      });

      if (error) {
        console.error('🔐 AuthContext: OTP verification failed:', error.message);
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          return { error: new Error('Verification code has expired. Please request a new code.') };
        }
        throw error;
      }
      
      if (!data.user) throw new Error('No user returned from verification');

      console.log('✅ AuthContext: Phone verification successful, user ID:', data.user.id);

      // Step 2: Check if account already exists
      const { data: existingAccount, error: fetchError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', data.user.id)
        .single();

      let account;
      let isExistingAccount = false;

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected for new users
        console.error('❌ AuthContext: Failed to fetch existing account:', fetchError);
        throw fetchError;
      }

      if (existingAccount) {
        // Account already exists
        account = existingAccount;
        isExistingAccount = true;
        console.log('✅ AuthContext: Existing account found:', account.name);
      } else {
        // Account doesn't exist, create new one
        console.log('🆕 AuthContext: Creating new account for user:', data.user.id);
        const { data: newAccount, error: createError } = await supabase
          .from('accounts')
          .insert({ 
            id: data.user.id,
            name: 'User'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ AuthContext: Failed to create new account:', createError);
          throw createError;
        }

        account = newAccount;
        isExistingAccount = false;
        console.log('✅ AuthContext: New account created:', account);
      }

      // Step 3: Set account state
      setAccount(account);
      
      // CRITICAL: Immediately trigger auth state change for instant login
      console.log('🔐 AuthContext: Triggering immediate auth state change...');
      setUser(data.user);
      setLoading(false);

      return { 
        error: null, 
        isExistingAccount,
        tempUser: isExistingAccount ? undefined : { phone: phone, authUserId: data.user.id }
      };
    } catch (error) {
      console.error('❌ AuthContext: Error verifying phone code:', error);
      return { error: error as Error };
    }
  };

  // Check if account exists by email or phone (UNIFIED IDENTITY SYSTEM)
  const checkExistingAccount = async (email?: string, phone?: string) => {
    if (!supabase) return { exists: false, error: new Error('Supabase client not initialized') };

    try {
      console.log('🔍 AuthContext: Checking existing account for:', { email, phone });

      // In unified identity system, we can't directly query auth.users from client
      // Instead, we'll try to sign in with the provided credentials to check if they exist
      // This is the proper client-side approach for checking account existence
      
      if (email) {
        // Try to send OTP to see if email exists (this will fail if email doesn't exist)
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: { 
              shouldCreateUser: false // This will fail if user doesn't exist
            }
          });
          
          if (!error) {
            // OTP was sent successfully, meaning email exists
            console.log('✅ AuthContext: Email exists (OTP sent successfully)');
            return { exists: true, account: null, error: null };
          } else if (error.message?.includes('User not found') || error.message?.includes('Invalid login credentials')) {
            // User doesn't exist
            console.log('❌ AuthContext: Email does not exist');
            return { exists: false, account: null, error: null };
          } else {
            // Some other error occurred
            console.error('❌ AuthContext: Error checking email existence:', error);
            return { exists: false, error: error as Error };
          }
        } catch (error) {
          console.error('❌ AuthContext: Error checking email existence:', error);
          return { exists: false, error: error as Error };
        }
      }

      if (phone) {
        // Try to send OTP to see if phone exists (this will fail if phone doesn't exist)
        try {
          const { error } = await supabase.auth.signInWithOtp({
            phone: phone,
            options: { 
              shouldCreateUser: false // This will fail if user doesn't exist
            }
          });
          
          if (!error) {
            // OTP was sent successfully, meaning phone exists
            console.log('✅ AuthContext: Phone exists (OTP sent successfully)');
            return { exists: true, account: null, error: null };
          } else if (error.message?.includes('User not found') || error.message?.includes('Invalid login credentials')) {
            // User doesn't exist
            console.log('❌ AuthContext: Phone does not exist');
            return { exists: false, account: null, error: null };
          } else {
            // Some other error occurred
            console.error('❌ AuthContext: Error checking phone existence:', error);
            return { exists: false, error: error as Error };
          }
        } catch (error) {
          console.error('❌ AuthContext: Error checking phone existence:', error);
          return { exists: false, error: error as Error };
        }
      }

      if (!email && !phone) {
        return { exists: false, error: new Error('No identifier provided') };
      }

      console.log('❌ AuthContext: No existing account found');
      return { exists: false, account: null, error: null };
      
    } catch (error) {
      console.error('❌ AuthContext: Error checking existing account:', error);
      return { exists: false, error: error as Error };
    }
  };

  // Legacy compatibility method for existing UI components
  const checkUserExists = async (phone?: string, email?: string) => {
    console.log('🔍 checkUserExists: Starting check for:', { phone, email });
    
    try {
      const { exists, account, error } = await checkExistingAccount(email, phone);
      
      console.log('🔍 checkUserExists: checkExistingAccount result:', { exists, account: !!account, error });
      
      const result = { 
        exists, 
        userData: account ? {
          id: account.id,
          name: account.name,
          bio: account.bio,
          profile_pic: account.profile_pic,
          connect_id: account.connect_id,
          created_at: account.created_at,
          updated_at: account.updated_at
        } : null,
        error 
      };
      
      console.log('✅ checkUserExists: Returning result:', result);
      return result;
    } catch (error) {
      console.error('❌ checkUserExists: Caught error:', error);
      return { 
        exists: false, 
        userData: null, 
        error: error as Error 
      };
    }
  };

  // Legacy compatibility method for ProtectedRoute
  const loadUserProfile = async () => {
    if (!user) {
      console.log('🔍 loadUserProfile: No authenticated user');
      return { profile: null, error: new Error('No authenticated user') };
    }
    
    try {
      console.log('🔍 loadUserProfile: Loading account for user:', user.id);
      await loadAccountForUser(user.id);
      
      console.log('🔍 loadUserProfile: Account loaded, current account state:', {
        hasAccount: !!account,
        accountId: account?.id,
        accountName: account?.name,
        accountBio: account?.bio,
        accountProfilePic: account?.profile_pic
      });
      
      if (account) {
        const profileData = {
          id: account.id,
          name: formatNameForDisplay(account.name),
          bio: account.bio,
          avatarUrl: account.profile_pic, // Map profile_pic to avatarUrl for compatibility
          connect_id: account.connect_id,
          created_at: account.created_at,
          updated_at: account.updated_at
        };
        
        console.log('🔍 loadUserProfile: Returning profile data:', {
          id: profileData.id,
          name: profileData.name,
          bio: profileData.bio,
          hasAvatar: !!profileData.avatarUrl
        });
        
        return { profile: profileData, error: null };
      } else {
        console.log('🔍 loadUserProfile: No account found after loadAccountForUser');
        return { profile: null, error: null };
      }
    } catch (error) {
      console.error('🔍 loadUserProfile: Error:', error);
      return { profile: null, error: error as Error };
    }
  };

  // Legacy compatibility method for components that expect this
  const refreshAuthState = async () => {
    console.log('🔄 AuthContext: refreshAuthState called');
    if (!supabase) {
      console.log('🔄 AuthContext: No supabase client available');
      return;
    }
    
    try {
      console.log('🔄 AuthContext: Getting current session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔄 AuthContext: Session check result:', { hasSession: !!session, userId: session?.user?.id });
      
      if (session?.user) {
        console.log('🔄 AuthContext: User found in session, loading account for:', session.user.id);
        setUser(session.user);
        await loadAccountForUser(session.user.id);
        console.log('🔄 AuthContext: Account loading completed');
      } else {
        console.log('🔄 AuthContext: No user in session, clearing account');
        setUser(null);
        setAccount(null);
      }
    } catch (error) {
      console.error('🔄 AuthContext: Error refreshing auth state:', error);
    }
  };

  // Link phone to current account (UNIFIED IDENTITY SYSTEM)
  const linkPhoneToAccount = async (phone: string) => {
    if (!supabase || !user || !account) return { error: new Error('Not authenticated or no account') };

    try {
      console.log('📱 AuthContext: Linking phone to account:', phone);
      
      // In unified identity, phone is stored in auth.users
      // Use Supabase Auth API to update user phone
      const { error } = await supabase.auth.updateUser({
        phone: phone
      });

      if (error) throw error;
      
      console.log('✅ AuthContext: Phone linked successfully via auth.users');
      return { error: null };
    } catch (error) {
      console.error('❌ AuthContext: Error linking phone:', error);
      return { error: error as Error };
    }
  };

  // Link email to current account (UNIFIED IDENTITY SYSTEM)
  const linkEmailToAccount = async (email: string) => {
    if (!supabase || !user || !account) return { error: new Error('Not authenticated or no account') };

    try {
      console.log('📧 AuthContext: Linking email to account:', email);
      
      // In unified identity, email is stored in auth.users
      // Use Supabase Auth API to update user email
      const { error } = await supabase.auth.updateUser({
        email: email
      });

      if (error) throw error;
      
      console.log('✅ AuthContext: Email linked successfully via auth.users');
      return { error: null };
    } catch (error) {
      console.error('❌ AuthContext: Error linking email:', error);
      return { error: error as Error };
    }
  };

  // Create new account (unified identity)
  const createAccount = async (userData: { name: string; email?: string; phone?: string; bio?: string; dob?: string }) => {
    if (!supabase || !user) {
      return { error: new Error('Not authenticated') };
    }

    try {
      console.log('🚀 AuthContext: ========== CREATING ACCOUNT ==========');
      
      // Direct upsert to accounts table (id = auth.uid())
      const { data: account, error } = await supabase
        .from('accounts')
        .upsert({
          id: user.id,
          name: userData.name,
          bio: userData.bio || '',
          dob: userData.dob || null
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('❌ AuthContext: Failed to create account:', error);
        throw error;
      }

      console.log('✅ AuthContext: Account created successfully:', account);

      // Set account state
      setAccount(account);

      return { error: null };
    } catch (error) {
      console.error('❌ AuthContext: Error creating account:', error);
      return { error: error as Error };
    }
  };

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    if (!supabase || !account) {
      console.error('❌ Upload failed: No supabase client or account');
      return { url: null, error: new Error('Not authenticated or no account') };
    }

    try {
      console.log('📸 NewAuthContext: Uploading avatar...');
      console.log('📸 File size:', Math.round(file.size / 1024), 'KB');
      console.log('📸 Account ID:', account.id);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No active session');
        throw new Error('No active session');
      }
      console.log('✅ Session valid');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${account.id}.${fileExt}`;
      
      console.log('📸 Uploading to bucket: avatars');
      console.log('📸 File name:', fileName);
      console.log('📸 Starting upload...');
      
      // Add timeout to detect hanging uploads
      const uploadPromise = supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
      );
      
      const { data: uploadData, error: uploadError } = await Promise.race([
        uploadPromise,
        timeoutPromise
      ]) as any;
      
      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        console.error('❌ Error message:', uploadError.message);
        console.error('❌ Error status:', uploadError.statusCode);
        throw uploadError;
      }
      
      console.log('✅ Upload response:', uploadData);
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      console.log('✅ NewAuthContext: Avatar uploaded successfully');
      console.log('✅ Public URL:', data.publicUrl);
      return { url: data.publicUrl, error: null };
    } catch (error: any) {
      console.error('❌ NewAuthContext: Error uploading avatar:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error?.message || 'Unknown error');
      return { url: null, error: error as Error };
    }
  };

  // Delete account (UNIFIED IDENTITY SYSTEM)
  const deleteAccount = async () => {
    if (!supabase) {
      console.log('❌ AuthContext: No supabase client available');
      return { error: new Error('No supabase client available') };
    }

    // Use authenticated user ID if account context is missing/wrong
    const accountIdToDelete = account?.id || user?.id;
    
    if (!accountIdToDelete) {
      console.log('❌ AuthContext: No account ID or user ID to delete');
      return { error: new Error('No account to delete') };
    }

    try {
      console.log('🗑️ AuthContext: Starting account deletion for:', accountIdToDelete);
      console.log('🗑️ AuthContext: Account source:', {
        fromAccount: account?.id,
        fromUser: user?.id,
        using: accountIdToDelete,
        hasAccount: !!account,
        hasUser: !!user
      });
      
      // First, clear local state immediately to prevent loops
      setAccount(null);
      
      // In unified identity system, just delete from accounts table
      // (No account_identities table to clean up)
      console.log('🗑️ AuthContext: Deleting account from database...');
      const { error: deleteError } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountIdToDelete);

      if (deleteError) {
        console.error('❌ AuthContext: Database deletion failed:', deleteError);
        // Don't throw - continue with auth cleanup
        console.log('🗑️ AuthContext: Continuing with auth cleanup despite database error');
      } else {
        console.log('✅ AuthContext: Account deleted from database successfully');
      }
      
      // Delete from auth.users (this cascades due to foreign key)
      console.log('🗑️ AuthContext: Deleting from auth.users...');
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(accountIdToDelete);
      
      if (authDeleteError) {
        console.warn('⚠️ AuthContext: Auth user deletion warning:', authDeleteError);
      } else {
        console.log('✅ AuthContext: Auth user deleted successfully');
      }
      
      // Sign out from auth (always do this)
      console.log('🗑️ AuthContext: Signing out from auth...');
      await signOut();
      
      console.log('✅ AuthContext: Account deletion completed successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ AuthContext: Error deleting account:', error);
      // Even if there's an error, try to sign out to prevent stuck states
      try {
        await signOut();
      } catch (signOutError) {
        console.error('❌ AuthContext: Sign out after error also failed:', signOutError);
      }
      return { error: error as Error };
    }
  };

  // Update profile
  const updateProfile = async (profileUpdates: any) => {
    if (!supabase || !account) {
      console.error('📝 NewAuthContext: Cannot update - missing supabase or account');
      return { error: new Error('No account to update') };
    }

    try {
      console.log('📝 NewAuthContext: Updating profile with data:', {
        currentAccountId: account.id,
        currentBio: account.bio,
        newName: profileUpdates.name,
        newBio: profileUpdates.bio,
        newProfilePic: profileUpdates.avatarUrl || profileUpdates.profile_pic,
        bioChanged: account.bio !== profileUpdates.bio
      });
      
      const updateData = {
        name: profileUpdates.name,
        bio: profileUpdates.bio,
        profile_pic: profileUpdates.avatarUrl || profileUpdates.profile_pic
      };
      
      console.log('📝 NewAuthContext: Sending update to database:', updateData);
      
      const { data, error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', account.id)
        .select()
        .single();

      if (error) {
        console.error('📝 NewAuthContext: Database update error:', error);
        throw error;
      }
      
      console.log('✅ NewAuthContext: Profile updated successfully in database');
      console.log('📝 NewAuthContext: Updated data from database:', {
        id: data.id,
        name: data.name,
        bio: data.bio,
        profile_pic: data.profile_pic,
        bioLength: data.bio?.length || 0
      });
      
      setAccount(data);
      console.log('📝 NewAuthContext: Account state updated in context');
      
      return { error: null };
    } catch (error) {
      console.error('❌ NewAuthContext: Error updating profile:', error);
      return { error: error as Error };
    }
  };

  // Sign out
  const signOut = async () => {
    if (!supabase) return;
    
    console.log('👋 NewAuthContext: Starting sign out process...');
    
    try {
      // Clear local state first
      setUser(null);
      setAccount(null);
      setLoading(false);
      
      // Clean up real-time subscriptions
      if (realtimeCleanupRef.current) {
        console.log('🧹 Cleaning up real-time subscriptions...');
        realtimeCleanupRef.current();
        realtimeCleanupRef.current = null;
      }
      
      // Clear all storage immediately
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Sign out from Supabase and WAIT for it to complete
      console.log('🔐 Signing out from Supabase...');
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('⚠️ Supabase signout error:', signOutError);
      } else {
        console.log('✅ Supabase session cleared successfully');
      }
      
      console.log('✅ NewAuthContext: Sign out completed successfully');
      console.log('✅ User can now log in fresh without refresh');
    } catch (error) {
      console.error('❌ NewAuthContext: Sign out error:', error);
      // Even if there's an error, clear everything
      setUser(null);
      setAccount(null);
      setLoading(false);
      
      // Clear all storage even on error
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    }
  };

  // Generate unique connect ID
  const generateConnectId = (name: string) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${cleanName}_${randomSuffix}`;
  };

  const value: AuthContextType = {
    user,
    account,
    loading,
    supabase,
    sendEmailVerification,
    sendPhoneVerification,
    verifyEmailCode,
    verifyPhoneCode,
    checkUserExists,
    loadUserProfile,
    refreshAuthState,
    linkPhoneToAccount,
    linkEmailToAccount,
    createAccount,
    uploadAvatar,
    deleteAccount,
    updateProfile,
    signOut
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
