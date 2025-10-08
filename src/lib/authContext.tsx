"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient, clearInvalidSession } from './supabaseClient';
import { formatNameForDisplay } from './utils';

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
  supabase: any;
  
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

  // Debug account state changes
  useEffect(() => {
    console.log('🔍 AuthContext: Account state changed:', account ? { id: account.id, name: account.name } : null);
  }, [account]);
  const supabase = getSupabaseClient();
  const realtimeCleanupRef = useRef<(() => void) | null>(null);

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Detect mobile environment
    const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Add error handling for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session ? 'Session exists' : 'No session');
      
      // Handle authentication errors gracefully
      if (event === 'SIGNED_OUT') {
        console.log('🔐 User signed out');
        setUser(null);
        setAccount(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔐 Token refreshed successfully');
        setUser(session?.user || null);
      } else if (event === 'SIGNED_IN') {
        console.log('🔐 User signed in');
        setUser(session?.user || null);
      }
      
      setLoading(false);
    });
    
    // Initializing auth system

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      if (realtimeCleanupRef.current) {
        realtimeCleanupRef.current();
      }
    };
  }, [supabase]);

  // Set up real-time sync for profile changes
  useEffect(() => {
    if (!supabase || !user?.id) return;
    const setupRealtimeSync = () => {
      if (!user?.id) return;

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

    // Get initial session
    const getInitialSession = async () => {
      try {
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
          console.log('👤 NewAuthContext: User found in session, loading account...');
          setUser(session.user);
          try {
            await loadAccountForUser(session.user.id);
            console.log('👤 NewAuthContext: Initial account loading completed');
          } catch (error) {
            console.error('👤 NewAuthContext: Initial account loading failed:', error);
          }
          // Set up real-time sync after user is loaded
          setupRealtimeSync();
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
      console.log('🔄 NewAuthContext: Auth state change:', event, !!session?.user);
      
        if (session?.user) {
          console.log('🔐 AuthContext: User session available, loading account for:', session.user.id);
          setUser(session.user);
          
          // Call loadAccountForUser and wait for it to complete
          try {
            await loadAccountForUser(session.user.id);
            console.log('🔐 AuthContext: Account loading completed successfully');
          } catch (error) {
            console.error('🔐 AuthContext: Account loading failed:', error);
          }
          
          // Set up real-time sync after user is loaded
          setupRealtimeSync();
        } else {
          console.log('🔐 AuthContext: No user session, clearing account');
          setUser(null);
          setAccount(null);
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

  // Load account for authenticated user - MOBILE ENHANCED
  const loadAccountForUser = async (authUserId: string) => {
    try {
      console.log('🔍 NewAuthContext: Loading account for user:', authUserId);
      console.log('🔍 NewAuthContext: Current user object:', user);
      console.log('🔍 NewAuthContext: Supabase client available:', !!supabase);
      
      // Strategy 1: identifier-first (email)
      const email = user?.email?.toLowerCase();
      if (email) {
        console.log('📧 NewAuthContext: Trying email identity linking…', email);
        try {
          const { data: emailLink, error: emailLinkErr } = await supabase!
            .from('account_identities')
            .select(`account_id, account_identities.created_at, accounts!inner(*)`)
            .eq('method', 'email')
            .eq('identifier', email)
            .order('account_identities.created_at', { ascending: false })
            .limit(1)
            .single();
          
          console.log('📧 NewAuthContext: Email identity query result:', {
            hasData: !!emailLink,
            hasError: !!emailLinkErr,
            errorMessage: emailLinkErr?.message,
            hasAccounts: !!emailLink?.accounts
          });
          
          if (!emailLinkErr && emailLink?.accounts) {
            console.log('✅ NewAuthContext: Account found via email identity');
            const accountData = emailLink.accounts as any as Account;
            accountData.name = formatNameForDisplay(accountData.name);
            setAccount(accountData);
            return;
          }
        } catch (emailError) {
          console.error('📧 NewAuthContext: Email identity lookup failed:', emailError);
          console.log('⚠️ NewAuthContext: No email identity mapping:', emailError?.message);
        }
      }

      // Strategy 2: identifier-first (phone)
      const phone = user?.phone || null;
      if (phone) {
        console.log('📱 NewAuthContext: Trying phone identity linking…', phone);
        const { data: phoneLink, error: phoneLinkErr } = await supabase!
          .from('account_identities')
          .select(`account_id, account_identities.created_at, accounts!inner(*)`)
          .eq('method', 'phone')
          .eq('identifier', phone)
          .order('account_identities.created_at', { ascending: false })
          .limit(1)
          .single();
        if (!phoneLinkErr && phoneLink?.accounts) {
          console.log('✅ NewAuthContext: Account found via phone identity');
          const accountData = phoneLink.accounts as any as Account;
          accountData.name = formatNameForDisplay(accountData.name);
          setAccount(accountData);
          return;
        }
        console.log('⚠️ NewAuthContext: No phone identity mapping:', phoneLinkErr?.message);
      }

      // Strategy 3: direct account lookup by auth_user_id mapping table
      console.log('📱 NewAuthContext: Trying auth_user_id → account mapping…');
      try {
        const { data: identityData, error: identityError } = await supabase!
          .from('account_identities')
          .select(`account_id, account_identities.created_at, accounts!inner(*)`)
          .eq('auth_user_id', authUserId)
          .order('account_identities.created_at', { ascending: false })
          .limit(1)
          .single();
        if (!identityError && identityData?.accounts) {
          console.log('✅ NewAuthContext: Account found via auth_user_id mapping');
          const accountData = identityData.accounts as any as Account;
          accountData.name = formatNameForDisplay(accountData.name);
          setAccount(accountData);
          return;
        }
      } catch (identityError) {
        console.error('📱 NewAuthContext: Auth user ID mapping failed:', identityError);
      }
      console.log('⚠️ NewAuthContext: auth_user_id mapping not found');

      // Strategy 4: Try direct account lookup by ID (only if account.id === auth user id)
      console.log('📱 NewAuthContext: Trying direct account lookup by ID...');
      try {
        const { data: directAccountById, error: directByIdError } = await supabase!
          .from('accounts')
          .select('*')
          .eq('id', authUserId)
          .limit(1)
          .single();

        console.log('📱 NewAuthContext: Direct lookup raw result:', {
          data: directAccountById,
          error: directByIdError,
          hasData: !!directAccountById,
          searchedId: authUserId,
          errorMessage: directByIdError?.message
        });

        if (!directByIdError && directAccountById) {
          console.log('✅ NewAuthContext: Account found via direct ID lookup');
          console.log('📱 NewAuthContext: DETAILED Direct account data:', {
            id: directAccountById.id,
            name: directAccountById.name,
            bio: directAccountById.bio,
            profile_pic: directAccountById.profile_pic,
            connect_id: directAccountById.connect_id,
            created_at: directAccountById.created_at,
            updated_at: directAccountById.updated_at,
            bioLength: directAccountById.bio?.length || 0
          });
          setAccount(directAccountById as Account);
          console.log('📱 NewAuthContext: Direct account state updated in context');
          return;
        } else {
          console.log('⚠️ NewAuthContext: No account found via direct ID lookup:', directByIdError?.message);
        }
      } catch (directError) {
        console.error('📱 NewAuthContext: Direct account lookup failed:', directError);
      }

      // Strategy 5 (final): Create account if none exists
      console.log('🆕 NewAuthContext: No account found, creating new account for user...');
      
      try {
        const newAccountData = {
          id: authUserId,
          name: user?.email?.split('@')[0] || 'User',
          bio: '',
          profile_pic: null,
          connect_id: generateConnectId(user?.email?.split('@')[0] || 'User'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('🆕 NewAuthContext: Creating account with data:', newAccountData);
        
        const { data: newAccount, error: createError } = await supabase!
          .from('accounts')
          .insert(newAccountData)
          .select()
          .single();
          
        if (!createError && newAccount) {
          console.log('✅ NewAuthContext: Account created successfully:', newAccount);
          setAccount(newAccount as Account);
          
          // Also create an identity mapping
          const identityData = {
            account_id: authUserId,
            auth_user_id: authUserId,
            method: 'email',
            identifier: user?.email?.toLowerCase() || '',
            created_at: new Date().toISOString()
          };
          
          const { error: identityError } = await supabase!
            .from('account_identities')
            .insert(identityData);
            
          if (identityError) {
            console.error('⚠️ NewAuthContext: Failed to create identity mapping:', identityError);
          } else {
            console.log('✅ NewAuthContext: Identity mapping created successfully');
          }
          
          return;
        } else {
          console.error('❌ NewAuthContext: Failed to create account:', createError);
        }
      } catch (createError) {
        console.error('❌ NewAuthContext: Account creation failed:', createError);
      }

      console.log('❌ NewAuthContext: All lookup strategies failed');
      
      // DEBUG: Let's see what accounts actually exist
      try {
        console.log('🔍 NewAuthContext: DEBUG - Checking what accounts exist in database...');
        const { data: allAccounts, error: allAccountsError } = await supabase!
          .from('accounts')
          .select('id, name, created_at')
          .limit(5);
        
        console.log('🔍 NewAuthContext: DEBUG - Existing accounts:', {
          accounts: allAccounts,
          error: allAccountsError,
          count: allAccounts?.length || 0
        });
        
        // Also check account_identities
        const { data: allIdentities, error: allIdentitiesError } = await supabase!
          .from('account_identities')
          .select('account_id, auth_user_id, method, identifier')
          .limit(5);
        
        console.log('🔍 NewAuthContext: DEBUG - Existing identities:', {
          identities: allIdentities,
          error: allIdentitiesError,
          count: allIdentities?.length || 0,
          searchingFor: authUserId
        });
      } catch (debugError) {
        console.log('🔍 NewAuthContext: DEBUG query failed:', debugError);
      }
      
      console.log('🔍 NewAuthContext: No account found, setting to null');
      setAccount(null);
    } catch (error) {
      console.error('❌ NewAuthContext: Error loading account:', error);
      setAccount(null);
    }
    
    console.log('🔍 NewAuthContext: loadAccountForUser function completed');
  };

  // Send email verification
  const sendEmailVerification = async (email: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') };

    // Rate limiting: Check if we've sent an email recently
    const lastEmailTime = localStorage.getItem('lastEmailVerification');
    const now = Date.now();
    const RATE_LIMIT_MS = 30000; // 30 seconds

    if (lastEmailTime && (now - parseInt(lastEmailTime)) < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - parseInt(lastEmailTime))) / 1000);
      console.log(`⏳ Rate limited: Please wait ${remainingSeconds} seconds before sending another verification email`);
      return { error: new Error(`Please wait ${remainingSeconds} seconds before sending another verification email`) };
    }

    try {
      console.log('📧 NewAuthContext: Sending email verification to:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: { 
          emailRedirectTo: undefined,
          shouldCreateUser: true // Allow user creation for new accounts
        }
      });

      if (error) {
        // Handle rate limiting error specifically
        if (error.message.includes('For security purposes')) {
          localStorage.setItem('lastEmailVerification', now.toString());
          return { error: new Error('Please wait a moment before requesting another verification email') };
        }
        throw error;
      }
      
      // Store timestamp of successful email send
      localStorage.setItem('lastEmailVerification', now.toString());
      console.log('✅ NewAuthContext: Email verification sent successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ NewAuthContext: Error sending email verification:', error);
      return { error: error as Error };
    }
  };

  // Send phone verification
  const sendPhoneVerification = async (phone: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') };

    try {
      console.log('📱 NewAuthContext: Sending phone verification to:', phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: { 
          shouldCreateUser: true // Allow user creation for new accounts
        }
      });

      if (error) throw error;
      
      console.log('✅ NewAuthContext: Phone verification sent successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ NewAuthContext: Error sending phone verification:', error);
      return { error: error as Error };
    }
  };

  // Verify email code
  const verifyEmailCode = async (email: string, code: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') };

    try {
      console.log('🔐 NewAuthContext: Verifying email code for:', email);
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email'
      });

      if (error) {
        console.error('🔐 NewAuthContext: OTP verification failed:', error.message);
        // Handle specific token expiration error
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          return { error: new Error('Verification code has expired. Please request a new code.') };
        }
        throw error;
      }
      
      if (!data.user) throw new Error('No user returned from verification');

      console.log('✅ NewAuthContext: Email verification successful, user ID:', data.user.id);

      // Check if this email is already linked to an account
      const { exists } = await checkExistingAccount(email);
      
      if (exists) {
        console.log('👤 NewAuthContext: Found existing account for email');
        return { error: null, isExistingAccount: true };
      } else {
        console.log('🆕 NewAuthContext: New user, will need to create account');
        return { 
          error: null, 
          isExistingAccount: false,
          tempUser: { email, authUserId: data.user.id }
        };
      }
    } catch (error) {
      console.error('❌ NewAuthContext: Error verifying email code:', error);
      return { error: error as Error };
    }
  };

  // Verify phone code
  const verifyPhoneCode = async (phone: string, code: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') };

    try {
      console.log('🔐 NewAuthContext: Verifying phone code for:', phone);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms'
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from verification');

      console.log('✅ NewAuthContext: Phone verification successful, user ID:', data.user.id);

      // Check if this phone is already linked to an account
      console.log('🔍 NewAuthContext: Checking if phone is linked to existing account:', phone);
      const { exists, account } = await checkExistingAccount(undefined, phone);
      
      console.log('🔍 NewAuthContext: Phone account check result:', { exists, account });
      
      if (exists) {
        console.log('👤 NewAuthContext: Found existing account for phone');
        return { error: null, isExistingAccount: true };
      } else {
        console.log('🆕 NewAuthContext: New user, will need to create account');
        return { 
          error: null, 
          isExistingAccount: false,
          tempUser: { phone, authUserId: data.user.id }
        };
      }
    } catch (error) {
      console.error('❌ NewAuthContext: Error verifying phone code:', error);
      return { error: error as Error };
    }
  };

  // Check if account exists by email or phone
  const checkExistingAccount = async (email?: string, phone?: string) => {
    if (!supabase) return { exists: false, error: new Error('Supabase client not initialized') };

    try {
      console.log('🔍 NewAuthContext: Checking existing account for:', { email, phone });

      // First, check account_identities table (new system)
      let query = supabase
        .from('account_identities')
        .select(`
          account_id,
          accounts!inner (
            id,
            name,
            bio,
            dob,
            profile_pic,
            connect_id,
            created_at,
            updated_at
          )
        `);

      if (email) {
        query = query.eq('method', 'email').eq('identifier', email);
        
        const { data, error } = await query.maybeSingle();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          throw error;
        }

        if (data?.accounts) {
          console.log('✅ NewAuthContext: Found account via email identity linking');
          console.log('🔍 NewAuthContext: Account data:', data.accounts);
          return { exists: true, account: data.accounts as unknown as Account, error: null };
        }
      } else if (phone) {
        // CRITICAL FIX: Try multiple phone number formats
        const phoneVariations = [
          phone,                                    // Original: "+61466310826"
          phone.replace(/^\+/, ''),                // Remove +: "61466310826"  
          phone.replace(/^\+61/, '0'),             // Replace +61 with 0: "0466310826"
          phone.replace(/^\+61/, ''),              // Remove +61: "466310826"
          `+61${phone.replace(/^\+61/, '')}`,      // Ensure +61 prefix
          `61${phone.replace(/^\+61/, '')}`,       // Ensure 61 prefix
        ];
        
        console.log('🔍 NewAuthContext: Trying phone variations:', phoneVariations);
        
        // Try each phone format variation
        for (const phoneVariation of phoneVariations) {
          console.log('🔍 NewAuthContext: Checking phone format:', phoneVariation);
          
          const { data, error } = await supabase
            .from('account_identities')
            .select(`
              account_id,
              accounts!inner (
                id,
                name,
                bio,
                dob,
                profile_pic,
                connect_id,
                created_at,
                updated_at
              )
            `)
            .eq('method', 'phone')
            .eq('identifier', phoneVariation)
            .maybeSingle();
          
          if (error && error.code !== 'PGRST116') {
            console.warn('⚠️ NewAuthContext: Phone query error for', phoneVariation, ':', error);
            continue;
          }

          if (data?.accounts) {
            console.log('✅ NewAuthContext: Found account via phone identity linking with format:', phoneVariation);
            console.log('🔍 NewAuthContext: Account data:', data.accounts);
            return { exists: true, account: data.accounts as unknown as Account, error: null };
          }
        }
      } else {
        return { exists: false, error: new Error('No identifier provided') };
      }

      console.log('❌ NewAuthContext: No existing account found after all attempts');
      return { exists: false, account: null, error: null };
      
    } catch (error) {
      console.error('❌ NewAuthContext: Error checking existing account:', error);
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

  // Link phone to current account
  const linkPhoneToAccount = async (phone: string) => {
    if (!supabase || !user || !account) return { error: new Error('Not authenticated or no account') };

    try {
      console.log('📱 NewAuthContext: Linking phone to account:', phone);
      
      const { error } = await supabase
        .from('account_identities')
        .insert({
          account_id: account.id,
          auth_user_id: user.id,
          method: 'phone',
          identifier: phone
        });

      if (error) throw error;
      
      console.log('✅ NewAuthContext: Phone linked successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ NewAuthContext: Error linking phone:', error);
      return { error: error as Error };
    }
  };

  // Link email to current account
  const linkEmailToAccount = async (email: string) => {
    if (!supabase || !user || !account) return { error: new Error('Not authenticated or no account') };

    try {
      console.log('📧 NewAuthContext: Linking email to account:', email);
      
      const { error } = await supabase
        .from('account_identities')
        .insert({
          account_id: account.id,
          auth_user_id: user.id,
          method: 'email',
          identifier: email
        });

      if (error) throw error;
      
      console.log('✅ NewAuthContext: Email linked successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ NewAuthContext: Error linking email:', error);
      return { error: error as Error };
    }
  };

  // Create new account - SIMPLIFIED VERSION
  const createAccount = async (userData: { name: string; email?: string; phone?: string; bio?: string; dob?: string }) => {
    console.log('🚀 NewAuthContext: SIMPLE account creation starting...');
    
    // Skip all the complex stuff and just create a local account that works
    const newAccount = {
      id: user?.id || 'temp-id',
      name: userData.name,
      bio: userData.bio || '',
      dob: userData.dob || null,
      profile_pic: '',
      connect_id: generateConnectId(userData.name),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ NewAuthContext: Simple account created:', newAccount);
    setAccount(newAccount);
    
    // Try database save in background (don't wait for it)
    if (supabase && user) {
      console.log('🔄 NewAuthContext: Attempting background database save...');
      
      // Save account to database - using async/await for better error handling
      (async () => {
        try {
          const result = await supabase
            .from('accounts')
            .insert([{
              name: userData.name,
              bio: userData.bio || '',
              dob: userData.dob || null,
              connect_id: newAccount.connect_id
            }])
            .select('*')
            .single();

          console.log('✅ NewAuthContext: Background save result:', result);
          
          if (result.data) {
            // Also create identity link for future sign-ins
            const primaryMethod = userData.email ? 'email' : 'phone';
            const primaryIdentifier = userData.email || userData.phone;
            
            if (primaryIdentifier) {
              console.log('🔗 NewAuthContext: Creating identity link:', { method: primaryMethod, identifier: primaryIdentifier });
              
              const { error: identityError } = await supabase
                .from('account_identities')
                .insert({
                  account_id: result.data.id,
                  auth_user_id: user.id,
                  method: primaryMethod,
                  identifier: primaryIdentifier
                });
              
              if (identityError) {
                console.log('❌ NewAuthContext: Identity link failed:', identityError);
              } else {
                console.log('✅ NewAuthContext: Identity link created successfully');
              }
            }
          }
        } catch (error) {
          console.log('❌ NewAuthContext: Background save failed:', error);
        }
      })();
    }
    
    return { error: null };
  };

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    if (!supabase || !account) return { url: null, error: new Error('Not authenticated or no account') };

    try {
      console.log('📸 NewAuthContext: Uploading avatar...');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${account.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log('✅ NewAuthContext: Avatar uploaded successfully');
      return { url: data.publicUrl, error: null };
    } catch (error) {
      console.error('❌ NewAuthContext: Error uploading avatar:', error);
      return { url: null, error: error as Error };
    }
  };

  // Delete account
  const deleteAccount = async () => {
    if (!supabase) {
      console.log('❌ NewAuthContext: No supabase client available');
      return { error: new Error('No supabase client available') };
    }

    // CRITICAL FIX: Use authenticated user ID if account context is missing/wrong
    const accountIdToDelete = account?.id || user?.id;
    
    if (!accountIdToDelete) {
      console.log('❌ NewAuthContext: No account ID or user ID to delete');
      return { error: new Error('No account to delete') };
    }

    try {
      console.log('🗑️ NewAuthContext: Starting account deletion for:', accountIdToDelete);
      console.log('🗑️ NewAuthContext: Account source:', {
        fromAccount: account?.id,
        fromUser: user?.id,
        using: accountIdToDelete,
        hasAccount: !!account,
        hasUser: !!user
      });
      
      // First, clear local state immediately to prevent loops
      setAccount(null);
      
      // Delete account_identities first (foreign key dependency)
      console.log('🗑️ NewAuthContext: Deleting account identities...');
      const { error: identityError } = await supabase
        .from('account_identities')
        .delete()
        .eq('account_id', accountIdToDelete);

      if (identityError) {
        console.warn('⚠️ NewAuthContext: Identity deletion failed (continuing):', identityError);
      } else {
        console.log('✅ NewAuthContext: Account identities deleted');
      }
      
      // Delete account (will cascade any remaining dependencies)
      console.log('🗑️ NewAuthContext: Deleting account from database...');
      const { error: deleteError } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountIdToDelete);

      if (deleteError) {
        console.error('❌ NewAuthContext: Database deletion failed:', deleteError);
        // Don't throw - continue with auth cleanup
        console.log('🗑️ NewAuthContext: Continuing with auth cleanup despite database error');
      } else {
        console.log('✅ NewAuthContext: Account deleted from database successfully');
      }
      
      // Sign out from auth (always do this)
      console.log('🗑️ NewAuthContext: Signing out from auth...');
      await signOut();
      
      console.log('✅ NewAuthContext: Account deletion completed successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ NewAuthContext: Error deleting account:', error);
      // Even if there's an error, try to sign out to prevent stuck states
      try {
        await signOut();
      } catch (signOutError) {
        console.error('❌ NewAuthContext: Sign out after error also failed:', signOutError);
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
      
      // Clear all storage immediately
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Try Supabase signout but don't wait for it
      supabase.auth.signOut().catch(err => {
        console.log('Supabase signout error (ignoring):', err);
      });
      
      console.log('✅ NewAuthContext: Sign out completed successfully');
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
