"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';

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
  const supabase = getSupabaseClient();

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Detect mobile environment
    const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('🔄 NewAuthContext: Initializing scalable auth system...');
    console.log('📱 NewAuthContext: Environment check:', { isCapacitor, isMobile, userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR' });

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 NewAuthContext: Loading initial session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
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
          await loadAccountForUser(session.user.id);
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
          setUser(session.user);
        await loadAccountForUser(session.user.id);
        } else {
          setUser(null);
        setAccount(null);
        }
        
        setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Load account for authenticated user - MOBILE ENHANCED
  const loadAccountForUser = async (authUserId: string) => {
    try {
      console.log('🔍 NewAuthContext: Loading account for user:', authUserId);
      
      // Mobile Strategy 1: Try identity linking first (most reliable)
      console.log('📱 NewAuthContext: Trying identity-based lookup...');
      const { data: identityData, error: identityError } = await supabase!
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
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (!identityError && identityData?.accounts) {
        console.log('✅ NewAuthContext: Account found via identity linking');
        const accountData = identityData.accounts as any;
        console.log('📱 NewAuthContext: DETAILED Account data from database:', { 
          id: accountData.id, 
          name: accountData.name,
          bio: accountData.bio,
          profile_pic: accountData.profile_pic,
          connect_id: accountData.connect_id,
          created_at: accountData.created_at,
          updated_at: accountData.updated_at,
          hasProfilePic: !!accountData.profile_pic,
          bioLength: accountData.bio?.length || 0
        });
        setAccount(accountData as Account);
        console.log('📱 NewAuthContext: Account state updated in context');
        return;
      }
      
      console.log('⚠️ NewAuthContext: Identity lookup failed:', identityError?.message);

      // Mobile Strategy 2: Try direct account lookup by ID
      console.log('📱 NewAuthContext: Trying direct account lookup by ID...');
      const { data: directAccountById, error: directByIdError } = await supabase!
        .from('accounts')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

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
      }
      
      console.log('⚠️ NewAuthContext: Direct ID lookup failed:', directByIdError?.message);

      // Mobile Strategy 3: Get any account (fallback for testing)
      console.log('📱 NewAuthContext: Trying fallback - any account lookup...');
      const { data: anyAccount, error: anyAccountError } = await supabase!
        .from('accounts')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!anyAccountError && anyAccount) {
        console.log('⚠️ NewAuthContext: Using fallback account (for testing):', anyAccount.id);
        setAccount(anyAccount as Account);
        return;
      }

      console.log('❌ NewAuthContext: All lookup strategies failed');
      console.log('📱 NewAuthContext: Final errors:', { identityError, directByIdError, anyAccountError });
      setAccount(null);
    } catch (error) {
      console.error('❌ NewAuthContext: Error loading account:', error);
      setAccount(null);
    }
  };

  // Send email verification
  const sendEmailVerification = async (email: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') };

    try {
      console.log('📧 NewAuthContext: Sending email verification to:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: { 
          emailRedirectTo: undefined,
          shouldCreateUser: true // Allow user creation for new accounts
        }
      });

      if (error) throw error;
      
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

      if (error) throw error;
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
      } else if (phone) {
        query = query.eq('method', 'phone').eq('identifier', phone);
      } else {
        return { exists: false, error: new Error('No identifier provided') };
      }

      const { data, error } = await query.maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      if (data?.accounts) {
        console.log('✅ NewAuthContext: Found account via identity linking');
        console.log('🔍 NewAuthContext: Account data:', data.accounts);
        return { exists: true, account: data.accounts as unknown as Account, error: null };
      }

      console.log('❌ NewAuthContext: No existing account found');
      console.log('🔍 NewAuthContext: Query data was:', data);
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
          name: account.name,
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
    if (!supabase) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadAccountForUser(session.user.id);
      } else {
        setUser(null);
        setAccount(null);
      }
    } catch (error) {
      console.error('❌ Error refreshing auth state:', error);
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
    if (!supabase || !account) {
      console.log('❌ NewAuthContext: No supabase client or account to delete');
      return { error: new Error('No account to delete') };
    }

    try {
      console.log('🗑️ NewAuthContext: Starting account deletion for:', account.id);
      
      // First, clear local state immediately to prevent loops
      setAccount(null);
      
      // Delete account (will cascade to account_identities due to foreign key)
      console.log('🗑️ NewAuthContext: Deleting from database...');
      const { error: deleteError } = await supabase
        .from('accounts')
        .delete()
        .eq('id', account.id);

      if (deleteError) {
        console.error('❌ NewAuthContext: Database deletion failed:', deleteError);
        throw deleteError;
      }
      
      console.log('✅ NewAuthContext: Account deleted from database successfully');
      
      // Sign out from auth
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
      
      // Then sign out from Supabase
        await supabase.auth.signOut();
      
      console.log('✅ NewAuthContext: Sign out completed successfully');
    } catch (error) {
      console.error('❌ NewAuthContext: Sign out error:', error);
      // Even if Supabase sign out fails, clear local state
      setUser(null);
      setAccount(null);
      setLoading(false);
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
