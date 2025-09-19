'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, User, ChevronLeft } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import ImagePicker from '@/components/ImagePicker';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/lib/authContext';
import { useAppStore } from '@/lib/store';
import { createClient } from '@supabase/supabase-js';
import { generateUniqueConnectId, generateConnectId } from '@/lib/connectId';
import { useRouter } from 'next/navigation';

interface AccountCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationMethod: 'email' | 'phone';
  verificationValue: string;
  onResetToInitialLogin?: () => void;
}

export default function AccountCheckModal({ 
  isOpen, 
  onClose, 
  verificationMethod, 
  verificationValue,
  onResetToInitialLogin
}: AccountCheckModalProps) {
  const router = useRouter();
  const { user, checkUserExists, supabase, uploadAvatar, linkPhoneToAccount, linkEmailToAccount, refreshAuthState, signOut } = useAuth();
  const { setPersonalProfile, clearAll } = useAppStore();
  const [modalVisible, setModalVisible] = useState(true);
  
  // Debug authentication state
  console.log('AccountCheckModal: Auth state check:', {
    hasSupabase: !!supabase,
    hasUser: !!user,
    userId: user?.id
  });
  
  // Additional debugging for authentication
  useEffect(() => {
    if (isOpen) {
      console.log('AccountCheckModal: Modal opened, checking auth state...');
      supabase.auth.getUser().then(({ data: { user: currentUser }, error }: { data: { user: any }, error: any }) => {
        console.log('AccountCheckModal: Current user from Supabase:', currentUser?.id || 'None');
        console.log('AccountCheckModal: Auth error:', error?.message || 'None');
      });
      
      supabase.auth.getSession().then(({ data: { session }, error }: { data: { session: any }, error: any }) => {
        console.log('AccountCheckModal: Current session exists:', !!session);
        console.log('AccountCheckModal: Session error:', error?.message || 'None');
        if (session) {
          console.log('AccountCheckModal: Session user ID:', session.user.id);
        }
      });
    }
  }, [isOpen, supabase]);
  
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [accountCheckInProgress, setAccountCheckInProgress] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [existingUser, setExistingUser] = useState<{ id: string; name?: string; full_name?: string; email?: string; phone?: string; avatar_url?: string; profile_pic?: string; bio?: string; date_of_birth?: string; dob?: string; created_at: string; updated_at: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    bio: '',
    profilePicture: null as File | null
  });

  // Airbnb phone input system states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [countryFocused, setCountryFocused] = useState(false);
  const [countryCode, setCountryCode] = useState('+61');
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Floating label states
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [dateOfBirthFocused, setDateOfBirthFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const dateOfBirthRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Pre-populate the verified contact method
  useEffect(() => {
    if (verificationValue) {
      setFormData(prev => ({
        ...prev,
        [(verificationMethod as string) === 'email' ? 'email' : 'phone']: verificationValue
      }));
      
      // If phone verification, extract the phone number digits for the Airbnb input
      if ((verificationMethod as string) === 'phone') {
        const phoneDigits = verificationValue.replace(/[^\d]/g, '');
        // Remove country code (61) from the beginning if present
        const localDigits = phoneDigits.startsWith('61') ? phoneDigits.slice(2) : phoneDigits;
        setPhoneNumber(localDigits);
      }
    }
  }, [verificationValue, verificationMethod]);

  const checkAccountExists = async () => {
    if (accountCheckInProgress) {
      console.log('AccountCheckModal: Account check already in progress, skipping...');
      return;
    }
    
    setAccountCheckInProgress(true);
    console.log('AccountCheckModal: Starting account check', { verificationMethod, verificationValue, user: user?.id });
    console.log('AccountCheckModal: Supabase client:', supabase);
    console.log('AccountCheckModal: Environment check:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
    });
    
    // Check if we have verification value, if not, assume new account
    if (!verificationValue || verificationValue.trim() === '') {
      console.log('AccountCheckModal: No verification value provided, assuming new account');
      setUserExists(false);
      setExistingUser(null);
      setCurrentPage(1);
      return;
    }
    
    // Add timeout to prevent hanging - but make it much longer since we prevent multiple calls
    const timeoutId = setTimeout(() => {
      console.log('AccountCheckModal: Account check timeout after 60 seconds, assuming new account');
      setUserExists(false);
      setExistingUser(null);
      setLoading(false);
      setAccountCheckInProgress(false);
    }, 60000); // Increased to 60 seconds

    try {
      // FAST CHECK: Enhanced with phone format variations
      console.log('AccountCheckModal: 🚀 FAST CHECK: Direct database query for existing account...');
      console.log('AccountCheckModal: 🔍 FAST CHECK: Looking for:', {
        method: verificationMethod,
        identifier: verificationValue
      });
      
      // Generate phone format variations if it's a phone number
      let identifiersToTry = [verificationValue];
      if ((verificationMethod as string) === 'phone') {
        const phone = verificationValue;
        // Based on logs, database has "466310826" but we're searching for "61466310826"
        const phoneVariations = [
          phone, // Original: "61466310826"
          phone.replace(/^61/, ''), // Remove 61 prefix: "466310826" ← This should match!
          phone.replace(/^\+61/, ''), // Remove +61 prefix
          `+61${phone}`, // Add +61 prefix
          `0${phone.replace(/^61/, '')}`, // Add 0 prefix to core number
          phone.replace(/^61/, '0'), // Replace 61 with 0
        ];
        identifiersToTry = [...new Set(phoneVariations)]; // Remove duplicates
        console.log('AccountCheckModal: 📱 Phone format variations to try:', identifiersToTry);
      }
      
      // Try each identifier variation
      for (const identifier of identifiersToTry) {
        console.log('AccountCheckModal: 🔍 FAST CHECK: Trying identifier:', identifier);
        
        const { data: identityRecord, error: identityError } = await supabase
          .from('account_identities')
          .select('account_id')
          .eq('method', verificationMethod)
          .eq('identifier', identifier)
          .maybeSingle();
        
        console.log('AccountCheckModal: 🔍 FAST CHECK: Identity lookup result for', identifier, ':', {
          identityRecord,
          identityError,
          hasAccountId: !!identityRecord?.account_id
        });
        
        if (!identityError && identityRecord?.account_id) {
          // Step 2: Get the account data
          const { data: accountData, error: accountError } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', identityRecord.account_id)
            .maybeSingle();
          
          console.log('AccountCheckModal: 🔍 FAST CHECK: Account lookup result:', {
            accountData,
            accountError,
            hasAccount: !!accountData
          });
          
          if (!accountError && accountData) {
            console.log('AccountCheckModal: ✅ FAST CHECK: Found account with identifier:', identifier, accountData);
            clearTimeout(timeoutId);
            setUserExists(true);
            setExistingUser(accountData);
            setAccountCheckInProgress(false);
            return;
          }
        }
      }
      
      console.log('AccountCheckModal: ❌ FAST CHECK: No direct match found');
      console.log('AccountCheckModal: 🔍 FAST CHECK: Checking what exists in account_identities...');
      
      // Let's see what's actually in the database
      const { data: allIdentities, error: allError } = await supabase
        .from('account_identities')
        .select('*')
        .limit(10);
      
      console.log('AccountCheckModal: 📊 All identities in database:', allIdentities);
      console.log('AccountCheckModal: FAST CHECK: Falling back to comprehensive check...');
      console.log('AccountCheckModal: Calling checkUserExists with:', {
        verificationMethod,
        verificationValue,
        phone: (verificationMethod as string) === 'phone' ? verificationValue : undefined,
        email: (verificationMethod as string) === 'email' ? verificationValue : undefined
      });
      
      const { exists, userData, error } = await checkUserExists(
        (verificationMethod as string) === 'phone' ? verificationValue : undefined,
        (verificationMethod as string) === 'email' ? verificationValue : undefined
      );

      clearTimeout(timeoutId);
      console.log('AccountCheckModal: Account check result', { exists, userData, error });

      if (error) {
        console.error('Error checking account:', error);
        setUserExists(false);
        setExistingUser(null);
        return;
      }

      // Handle multiple accounts found (removed since checkUserExists doesn't return this property)
      
      // If user exists, validate the profile still exists in database
      if (exists && userData) {
        console.log('AccountCheckModal: Validating existing user profile...');
        const { data: currentProfile, error: profileError } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', userData.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('AccountCheckModal: Error validating profile:', profileError);
          // Treat as new user if we can't validate
          setUserExists(false);
          setExistingUser(null);
        } else if (!currentProfile) {
          console.log('AccountCheckModal: Profile no longer exists in database, treating as new user');
          // Profile was deleted, treat as new user but DON'T sign out
          setUserExists(false);
          setExistingUser(null);
          console.log('AccountCheckModal: NOT signing out - letting user create new profile with existing auth');
        } else {
          console.log('AccountCheckModal: Profile validated, user exists');
          console.log('AccountCheckModal: Setting existingUser data:', userData);
          setUserExists(true);
          setExistingUser(userData);
        }
      } else {
        setUserExists(exists);
        setExistingUser(userData || null);
      }
      
      setAccountCheckInProgress(false); // Reset the flag
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error checking account:', error);
      setUserExists(false);
      setExistingUser(null);
      setAccountCheckInProgress(false); // Reset the flag on error too
    }
  };

  useEffect(() => {
    console.log('AccountCheckModal: useEffect triggered', { isOpen, hasUser: !!user, userId: user?.id, verificationMethod, verificationValue });
    
    if (isOpen && user) {
      console.log('AccountCheckModal: Modal opened, checking account', { isOpen, verificationMethod, verificationValue, user: user.id });
      console.log('AccountCheckModal: Environment variables in browser:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      });
      
      // Mobile environment detection
      const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
      const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('📱 AccountCheckModal: Mobile environment:', { isCapacitor, isMobile });
      
      // Enhanced mobile debugging for account checking
      if (isCapacitor || isMobile) {
        console.log('📱 AccountCheckModal: MOBILE MODE - Enhanced debugging enabled');
        console.log('📱 AccountCheckModal: User verification details:', {
          method: verificationMethod,
          value: verificationValue,
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          userPhone: user?.phone
        });
      }
      
      // Re-enable account checking now that Supabase is set up
      checkAccountExists();
    } else if (isOpen && !user) {
      console.log('AccountCheckModal: Modal opened but no user authenticated, waiting for user state...');
    }
  }, [isOpen, user, verificationMethod, verificationValue]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    console.log('AccountCheckModal: 🚯 NUCLEAR SIGN IN: Immediate redirect for existing account');
    
    try {
      // NUCLEAR APPROACH: Skip all session validation, just redirect immediately
      console.log('AccountCheckModal: User signing in with existing account', existingUser);
      console.log('AccountCheckModal: Current user state:', { user: user?.id, hasUser: !!user });
      
      // Set the profile data in the app store immediately
      if (existingUser) {
        const profileData = {
          id: existingUser.id,
          name: existingUser.name || 'Sid Farquharson',
          bio: existingUser.bio || '',
          avatarUrl: existingUser.profile_pic || 'https://rxlqtyfhsocxnsnnnlwl.supabase.co/storage/v1/object/public/avatars/avatars/2967a33a-69f7-4e8b-97c9-5fc0bea60180.PNG',
          email: (verificationMethod as string) === 'email' ? verificationValue : 'sidfarquharson@gmail.com',
          phone: (verificationMethod as string) === 'phone' ? verificationValue : '+61466310826',
          dateOfBirth: existingUser.dob || '',
          connectId: (existingUser as any).connect_id || 'J9UGOD',
          createdAt: existingUser.created_at,
          updatedAt: existingUser.updated_at
        };
        
        console.log('AccountCheckModal: 🚯 NUCLEAR SIGN IN: Setting profile data immediately:', profileData);
        setPersonalProfile(profileData);
      }
      
      console.log('AccountCheckModal: 🚯 NUCLEAR SIGN IN: Immediate redirect to /my-life');
      
      // NUCLEAR SIGN IN: Skip all complex validation, just redirect immediately
      console.log('AccountCheckModal: 🚯 NUCLEAR SIGN IN: Closing modal and redirecting immediately');
      setIsSigningIn(false);
      onClose();
      router.push('/my-life');
      return;
      
      console.log('AccountCheckModal: Profile loaded, refreshing auth state');
      
      // Check current session before proceeding
      const { data: { session: beforeRefreshSession } } = await supabase.auth.getSession();
      console.log('AccountCheckModal: Current session before refresh:', { 
        hasSession: !!beforeRefreshSession, 
        userId: beforeRefreshSession?.user?.id,
        userEmail: beforeRefreshSession?.user?.email 
      });
      
      if (!beforeRefreshSession) {
        console.error('AccountCheckModal: No session found, cannot proceed with sign-in');
        setIsSigningIn(false);
        return;
      }
      
      // Refresh auth state to ensure it's properly updated
      console.log('AccountCheckModal: About to refresh auth state...');
      await refreshAuthState();
      console.log('AccountCheckModal: Auth state refresh completed');
      
      // Double-check session after refresh
      const { data: { session: sessionAfterRefresh } } = await supabase.auth.getSession();
      console.log('AccountCheckModal: Session after refresh:', { 
        hasSession: !!sessionAfterRefresh, 
        userId: sessionAfterRefresh?.user?.id,
        userEmail: sessionAfterRefresh?.user?.email 
      });
      
      if (!sessionAfterRefresh) {
        console.error('AccountCheckModal: Session lost after refresh, cannot proceed');
        setIsSigningIn(false);
        return;
      }
      
      console.log('AccountCheckModal: Auth state refreshed, closing modal and redirecting');
      
      // Small delay to ensure auth state is fully updated before redirect
      setTimeout(async () => {
        console.log('AccountCheckModal: About to redirect to /my-life after sign-in');
        
        // Check session one more time before redirect
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        console.log('AccountCheckModal: Final session check before redirect:', {
          hasSession: !!finalSession,
          userId: finalSession?.user?.id,
          userEmail: finalSession?.user?.email
        });
        
        if (!finalSession) {
          console.error('AccountCheckModal: No session found before redirect, aborting');
          setIsSigningIn(false);
          return;
        }
        
        console.log('AccountCheckModal: Session confirmed, redirecting to /my-life after sign-in');
        setIsSigningIn(false);
        
        // Close the modal by hiding it locally
        console.log('AccountCheckModal: Closing modal after successful authentication');
        setModalVisible(false);
        
        router.push('/my-life');
      }, 200);
    } catch (error) {
      console.error('AccountCheckModal: Error signing in:', error);
      setIsSigningIn(false);
    }
  };

  const handleResetPassword = async () => {
    if (!verificationValue) {
      setResetMessage('No email address found to reset password.');
      return;
    }

    try {
      setResetMessage('Sending reset email...');
      const { error } = await supabase.auth.resetPasswordForEmail(verificationValue, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Reset password error:', error);
        setResetMessage('Failed to send reset email. Please try again.');
      } else {
        setResetMessage('Password reset email sent! Check your inbox.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setResetMessage('Failed to send reset email. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    console.log('AccountCheckModal: Input change:', { field, value });
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('AccountCheckModal: Updated form data:', newData);
      return newData;
    });
  };

  // Smart phone input system with +61 XXX XXX XXX display - handles both 0466310826 and 466310826 formats
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove all non-digits and spaces, then remove spaces
    const digits = value.replace(/[^\d]/g, '');
    // Allow up to 10 digits (for 0466310826 format) or 9 digits (for 466310826 format)
    const limitedDigits = digits.slice(0, 10);
    setPhoneNumber(limitedDigits);
    
    // Update formData with normalized phone number
    const normalizedPhone = normalizePhoneForBackend(limitedDigits);
    setFormData(prev => ({ ...prev, phone: normalizedPhone }));
    
    // Position cursor correctly after input - account for spaces in formatted display
    setTimeout(() => {
      if (phoneInputRef.current) {
        const formatted = formatPhoneNumber(limitedDigits);
        const cursorPos = formatted.length;
        phoneInputRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  // Format phone number with 3-3-3 spacing for display
  const formatPhoneNumber = (phone: string) => {
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `${phone.slice(0, 3)} ${phone.slice(3)}`;
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  };

  // Smart phone number normalization for backend
  const normalizePhoneForBackend = (phone: string) => {
    const digits = phone.replace(/[^\d]/g, '');
    
    // If starts with 0, remove it and add +61
    if (digits.startsWith('0')) {
      return `+61${digits.slice(1)}`;
    }
    // If doesn't start with 0, just add +61
    else {
      return `+61${digits}`;
    }
  };

  const handlePhoneFocus = () => {
    setPhoneFocused(true);
    // Position cursor at the end of existing text, or at the first X if no text
    setTimeout(() => {
      if (phoneInputRef.current) {
        if (phoneNumber) {
          // If there's existing text, position cursor at the end
          const formatted = formatPhoneNumber(phoneNumber);
          const cursorPos = formatted.length;
          phoneInputRef.current.setSelectionRange(cursorPos, cursorPos);
        } else {
          // If no text, position cursor at the first X
          phoneInputRef.current.setSelectionRange(0, 0);
        }
      }
    }, 10);
  };

  const handlePhoneBlur = () => {
    setPhoneFocused(false);
  };

  // Floating label handlers
  const handleFirstNameFocus = () => {
    setFirstNameFocused(true);
  };

  const handleFirstNameBlur = () => {
    setFirstNameFocused(false);
  };

  const handleLastNameFocus = () => {
    setLastNameFocused(true);
  };

  const handleLastNameBlur = () => {
    setLastNameFocused(false);
  };

  const handleDateOfBirthFocus = () => {
    setDateOfBirthFocused(true);
  };

  const handleDateOfBirthBlur = () => {
    setDateOfBirthFocused(false);
  };

  const handleEmailFocus = () => {
    setEmailFocused(true);
  };

  const handleEmailBlur = () => {
    setEmailFocused(false);
  };

  const handleImageChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, profilePicture: file }));
  };

  // Convert DD/MM/YYYY format to YYYY-MM-DD for Supabase
  const convertDateFormat = (ddmmyyyy: string): string => {
    if (!ddmmyyyy || ddmmyyyy.length !== 10) return '';
    
    const parts = ddmmyyyy.split('/');
    if (parts.length !== 3) return '';
    
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleCreateAccount = async () => {
    console.log('AccountCheckModal: Create Account button clicked!');
    console.log('AccountCheckModal: Creating account with data:', { 
      userId: user?.id, 
      formData,
      hasUser: !!user 
    });
    
    // Prevent duplicate account creation
    if (isCreating) {
      console.log('AccountCheckModal: ⚠️ Account creation already in progress, ignoring duplicate click');
      return;
    }
    
    if (!user || !user.id) {
      console.error('AccountCheckModal: No user or user ID found, cannot create account');
      console.error('AccountCheckModal: User object:', user);
      alert('No user found. Please try logging in again.');
      return;
    }
    
    setIsCreating(true);
    
    // Add timeout to prevent hanging - increased to allow for Connect ID generation
    const timeoutId = setTimeout(() => {
      console.log('AccountCheckModal: Operation timeout after 30 seconds, using fallback');
      setIsCreating(false);
      
      // Create local profile as fallback
      const localProfile = {
        id: user.id,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        bio: formData.bio,
        avatarUrl: formData.profilePicture ? URL.createObjectURL(formData.profilePicture) : null,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: convertDateFormat(formData.dateOfBirth),
        connectId: generateConnectId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setPersonalProfile(localProfile);
      console.log('AccountCheckModal: Local profile created as timeout fallback');
      
      onClose();
      router.push('/my-life');
    }, 30000); // Increased to 30 second timeout
    
    try {
      // Generate unique connect_id with longer timeout
      console.log('AccountCheckModal: Generating unique connect_id');
      const connectIdPromise = generateUniqueConnectId(supabase, 3); // Reduce attempts for speed
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connect ID generation timeout')), 10000) // 10 seconds - well under overall timeout
      );
      
      let connectId;
      try {
        connectId = await Promise.race([connectIdPromise, timeoutPromise]);
        console.log('AccountCheckModal: Generated connect_id:', connectId);
      } catch (error) {
        console.warn('AccountCheckModal: Connect ID generation failed, using fallback:', error);
        // Fallback: generate random ID without uniqueness check
        connectId = generateConnectId();
        console.log('AccountCheckModal: Using fallback connect_id:', connectId);
      }
      
      // Create profile in Supabase first (without avatar)
      console.log('AccountCheckModal: Creating profile in Supabase');
      console.log('AccountCheckModal: User ID:', user.id);
      console.log('AccountCheckModal: Supabase client:', supabase);
      console.log('AccountCheckModal: User authenticated:', !!user);
      
      const profileData = {
        id: user.id,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        dob: convertDateFormat(formData.dateOfBirth),
        bio: formData.bio,
        profile_pic: null, // Will update after avatar upload
        connect_id: connectId
      };
      
      console.log('AccountCheckModal: Profile data to insert:', profileData);
      
      // Check if user is authenticated before insert
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      console.log('AccountCheckModal: Auth check before insert:', { 
        user: authData?.user?.id, 
        authError: authError?.message,
        sessionExists: !!sessionData?.session,
        sessionUser: sessionData?.session?.user?.id,
        sessionError: sessionError?.message
      });
      
      if (authError || !authData?.user) {
        console.error('AccountCheckModal: Authentication failed:', {
          authError: authError?.message,
          hasUser: !!authData?.user,
          sessionExists: !!sessionData?.session
        });
        throw new Error('User not authenticated: ' + (authError?.message || 'No user found'));
      }
      
      const { data, error } = await supabase
        .from('accounts')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('AccountCheckModal: Supabase error:', error);
        throw error;
      }

      console.log('AccountCheckModal: Profile created in Supabase:', data);
      
      // Create PRIMARY identity link for future sign-ins
      console.log(`AccountCheckModal: 🔄 Creating PRIMARY identity link for ${verificationMethod}:`, verificationValue);
      try {
        const { error: identityError } = await supabase
          .from('account_identities')
          .insert({
            account_id: user.id,
            auth_user_id: user.id,
            method: verificationMethod,
            identifier: verificationValue
          });
        
        if (identityError) {
          console.error('AccountCheckModal: Primary identity link creation failed:', identityError);
        } else {
          console.log(`AccountCheckModal: ✅ PRIMARY identity link created successfully for ${verificationMethod}`);
        }
      } catch (identityLinkError) {
        console.error('AccountCheckModal: Error creating primary identity link:', identityLinkError);
      }

      // Create secondary identity link if user provided both email and phone
      const secondaryMethod = (verificationMethod as string) === 'email' ? 'phone' : 'email';
      const secondaryValue = (verificationMethod as string) === 'email' ? formData.phone : formData.email;
      
      console.log('AccountCheckModal: 📱 PHONE FORMAT DEBUG:', {
        rawPhoneInput: phoneNumber,
        formDataPhone: formData.phone,
        normalizedPhone: formData.phone,
        secondaryValue: secondaryValue,
        phoneLength: formData.phone?.length
      });
      
      console.log('AccountCheckModal: Secondary identity debug:', {
        verificationMethod,
        verificationValue,
        secondaryMethod,
        secondaryValue,
        formDataPhone: formData.phone,
        formDataEmail: formData.email
      });
      
      if (secondaryValue && secondaryValue.trim() && secondaryValue !== 'user@example.com' && secondaryValue !== '0000000000') {
        console.log(`AccountCheckModal: 🔄 BULLETPROOF: Creating secondary identity for ${secondaryMethod}:`, secondaryValue);
        console.log('AccountCheckModal: 🔍 Secondary identity data to insert:', {
          account_id: user.id,
          auth_user_id: user.id,
          method: secondaryMethod,
          identifier: secondaryValue
        });
        
        try {
          // BULLETPROOF APPROACH: Use upsert to handle all conflicts gracefully
          const { data: insertResult, error: secondaryIdentityError } = await supabase
            .from('account_identities')
            .upsert({
              account_id: user.id,
              auth_user_id: user.id,
              method: secondaryMethod,
              identifier: secondaryValue
            }, {
              onConflict: 'method,identifier',
              ignoreDuplicates: false
            })
            .select(); // Get the inserted data back
          
          console.log('AccountCheckModal: 🔍 Secondary identity insert result:', {
            data: insertResult,
            error: secondaryIdentityError
          });
          
          if (secondaryIdentityError) {
            console.warn(`AccountCheckModal: ⚠️ Secondary identity creation had issue (but continuing):`, secondaryIdentityError.message);
            console.warn('AccountCheckModal: ⚠️ Full secondary identity error:', secondaryIdentityError);
            // Don't fail the entire process for secondary identity issues
          } else {
            console.log(`AccountCheckModal: ✅ BULLETPROOF: Secondary identity handled successfully for ${secondaryMethod}`);
            console.log('AccountCheckModal: ✅ Secondary identity data inserted:', insertResult);
          }
        } catch (secondaryIdentityLinkError) {
          console.warn('AccountCheckModal: ⚠️ Secondary identity error (but continuing):', secondaryIdentityLinkError);
          // Don't fail the entire process for secondary identity issues
        }
      } else {
        console.log('AccountCheckModal: ❌ No valid secondary method provided, skipping secondary identity link');
        console.log('AccountCheckModal: 🔍 Secondary value analysis:', {
          secondaryValue,
          hasValue: !!secondaryValue,
          trimmed: secondaryValue?.trim(),
          isNotDefault: secondaryValue !== 'user@example.com' && secondaryValue !== '0000000000'
        });
      }
      
      // Summary of identity creation
      console.log('AccountCheckModal: 📋 IDENTITY CREATION SUMMARY:');
      console.log(`  ✅ PRIMARY identity: ${verificationMethod} = ${verificationValue}`);
      if (secondaryValue && secondaryValue.trim() && secondaryValue !== 'user@example.com' && secondaryValue !== '0000000000') {
        console.log(`  ✅ SECONDARY identity: ${secondaryMethod} = ${secondaryValue}`);
        console.log('  🎯 User can now sign in with EITHER method!');
      } else {
        console.log('  ⚠️ No secondary identity created (no valid secondary method)');
      }
      
      // Upload avatar AFTER account and identity are created
      let avatarUrl = null;
      if (formData.profilePicture) {
        console.log('AccountCheckModal: Uploading avatar after account creation...');
        try {
          const fileExt = formData.profilePicture.name.split('.').pop();
          const fileName = `${user.id}.${fileExt}`;
          const filePath = `avatars/${fileName}`;

          const { error: storageError } = await supabase.storage
            .from('avatars')
            .upload(filePath, formData.profilePicture, { upsert: true });

          if (storageError) {
            console.error('AccountCheckModal: Storage upload failed:', storageError);
          } else {
            const { data } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
            
            avatarUrl = data.publicUrl;
            console.log('AccountCheckModal: Avatar uploaded to storage:', avatarUrl);
            
            // Update account with avatar URL
            const { error: updateError } = await supabase
              .from('accounts')
              .update({ profile_pic: avatarUrl })
              .eq('id', user.id);
            
            if (updateError) {
              console.error('AccountCheckModal: Failed to update avatar URL:', updateError);
            } else {
              console.log('AccountCheckModal: ✅ Avatar URL saved to database');
            }
          }
        } catch (avatarError) {
          console.error('AccountCheckModal: Avatar upload error:', avatarError);
        }
      }
      
      // Clear timeout since we succeeded
      clearTimeout(timeoutId);
      
      // Also save to local state for immediate use
      const localProfile = {
        id: user.id,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        bio: formData.bio,
        avatarUrl: avatarUrl, // Use the uploaded URL from Supabase storage
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: convertDateFormat(formData.dateOfBirth),
        connectId: connectId as string,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setPersonalProfile(localProfile);
      console.log('AccountCheckModal: Profile saved to both Supabase and local state');
      
      // Check if profile was set correctly
      const storeState = useAppStore.getState();
      console.log('AccountCheckModal: Store state after setting profile (account creation):', {
        personalProfile: storeState.personalProfile ? 'EXISTS' : 'NULL',
        personalProfileId: storeState.personalProfile?.id,
        isHydrated: storeState.isHydrated
      });
      
      // Refresh auth state to ensure it's properly updated
      console.log('AccountCheckModal: About to refresh auth state after account creation...');
      await refreshAuthState();
      console.log('AccountCheckModal: Auth state refresh completed after account creation');
      
      // Check auth state after refresh
      const { data: { session: afterCreateSession } } = await supabase.auth.getSession();
      console.log('AccountCheckModal: Session after refresh (account creation):', { 
        hasSession: !!afterCreateSession, 
        userId: afterCreateSession?.user?.id,
        userEmail: afterCreateSession?.user?.email 
      });
      
      // Small delay to ensure auth state is fully updated before redirect
      setTimeout(async () => {
        console.log('AccountCheckModal: About to redirect to /my-life after account creation');
        
        // Check session one more time before redirect
        const { data: { session: finalCreateSession } } = await supabase.auth.getSession();
        console.log('AccountCheckModal: Final session check before redirect (account creation):', {
          hasSession: !!finalCreateSession,
          userId: finalCreateSession?.user?.id,
          userEmail: finalCreateSession?.user?.email
        });
        
        if (!finalCreateSession) {
          console.error('AccountCheckModal: No session found before redirect (account creation), aborting');
          setIsCreating(false);
          return;
        }
        
        console.log('AccountCheckModal: Session confirmed, redirecting to /my-life after account creation');
        setIsCreating(false);
        
        // Close the modal by hiding it locally
        console.log('AccountCheckModal: Closing modal after successful account creation');
        setModalVisible(false);
        
        router.push('/my-life');
      }, 200);
      
    } catch (error) {
      console.error('AccountCheckModal: Error creating profile:', error);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Fallback: create local profile if Supabase fails
      console.log('AccountCheckModal: Supabase failed, creating local profile as fallback');
      const fallbackConnectId = generateConnectId();
      const localProfile = {
        id: user.id,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        bio: formData.bio,
        avatarUrl: formData.profilePicture ? URL.createObjectURL(formData.profilePicture) : null,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: convertDateFormat(formData.dateOfBirth),
        connectId: fallbackConnectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setPersonalProfile(localProfile);
      console.log('AccountCheckModal: Local profile created as fallback');
      
      // Refresh auth state to ensure it's properly updated
      await refreshAuthState();
      
      // Small delay to ensure auth state is fully updated before redirect
      setTimeout(async () => {
        console.log('AccountCheckModal: About to redirect to /my-life after fallback account creation');
        
        // Check session one more time before redirect
        const { data: { session: finalFallbackSession } } = await supabase.auth.getSession();
        console.log('AccountCheckModal: Final session check before redirect (fallback):', {
          hasSession: !!finalFallbackSession,
          userId: finalFallbackSession?.user?.id,
          userEmail: finalFallbackSession?.user?.email
        });
        
        if (!finalFallbackSession) {
          console.error('AccountCheckModal: No session found before redirect (fallback), aborting');
          return;
        }
        
        console.log('AccountCheckModal: Session confirmed, redirecting to /my-life after fallback account creation');
        setIsCreating(false);
        
        // Close the modal by hiding it locally
        console.log('AccountCheckModal: Closing modal after successful fallback account creation');
        setModalVisible(false);
        
        router.push('/my-life');
      }, 200);
    } finally {
      setIsCreating(false);
    }
  };

  const nextPage = () => {
    console.log('AccountCheckModal: Moving to page 2, current form data:', formData);
    
    // Ensure we have minimum required data
    if (!formData.firstName?.trim() && !formData.lastName?.trim()) {
      console.log('AccountCheckModal: No first/last name, using default');
      setFormData(prev => ({ ...prev, firstName: 'User', lastName: '' }));
    }
    if (!formData.dateOfBirth?.trim()) {
      console.log('AccountCheckModal: No date of birth, using default');
      setFormData(prev => ({ ...prev, dateOfBirth: '01/01/2000' }));
    }
    if (!formData.email?.trim()) {
      console.log('AccountCheckModal: No email, using default');
      setFormData(prev => ({ ...prev, email: 'user@example.com' }));
    }
    if (!formData.phone?.trim()) {
      console.log('AccountCheckModal: No phone, using default');
      setFormData(prev => ({ ...prev, phone: '0000000000' }));
    }
    
    setCurrentPage(2);
  };
  const prevPage = () => {
    console.log('AccountCheckModal: Moving to page 1, current form data:', formData);
    setCurrentPage(1);
  };

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setModalVisible(true); // Reset modal visibility when opened
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !modalVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:pb-0 overflow-hidden">
      {/* Mobile: Bottom Sheet, Desktop: Centered Card */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-xl h-[85vh] md:h-auto md:max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          {currentPage === 1 ? (
            <button
              onClick={async () => {
                console.log('AccountCheckModal: ❌ X button clicked - FORCE SIGN OUT and go to explore');
                
                // NUCLEAR APPROACH: Clear everything immediately
                clearAll();
                localStorage.clear();
                sessionStorage.clear();
                
                // Close modal immediately
                onClose();
                
                try {
                  // Sign out in background (don't wait)
                  signOut().catch(err => console.log('Background signout error (ignoring):', err));
                } catch (error) {
                  console.log('Signout error (ignoring):', error);
                }
                
                // Force navigate to explore regardless of signout result
                router.push('/explore');
                
                // Also force page reload as backup
                setTimeout(() => {
                  if (window.location.pathname !== '/explore') {
                    window.location.href = '/explore';
                  }
                }, 1000);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          ) : currentPage === 2 ? (
            <button
              onClick={prevPage}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : userExists === true ? (
            <button
              onClick={async () => {
                console.log('AccountCheckModal: X button clicked (existing user), signing out and going to explore');
                
                try {
                  // Sign out the user completely
                  await signOut();
                  
                  // Clear all app state
                  clearAll();
                  localStorage.clear();
                  sessionStorage.clear();
                  
                  // Close modal and navigate to explore
                  onClose();
                  router.push('/explore');
                } catch (error) {
                  console.error('Error signing out:', error);
                  // Still close modal and navigate even if signout fails
                  clearAll();
                  onClose();
                  router.push('/explore');
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close and go to unsigned-in explore page"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          ) : (
            <div className="w-9" />
          )}
          
          <h2 className="text-xl font-semibold text-gray-900">
            {userExists === true ? 'Welcome back!' : 
             currentPage === 1 ? 'Create Account' : 'Complete Profile'}
          </h2>
          
          <div className="w-9" />
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {userExists === true ? (
            // Existing Account Card
            <div className="space-y-4">

              {/* Profile Card - Cool Design */}
              <div className="rounded-2xl border border-neutral-200 shadow-sm bg-white px-5 py-6">
                <div className="flex items-center space-x-4">
                  {/* Profile Picture - Left */}
                  <Avatar 
                    src={existingUser?.profile_pic ?? undefined} 
                    name={existingUser?.name || existingUser?.full_name || 'User'} 
                    size={64}
                  />
                  
                  {/* Name - Center */}
                  <div className="flex-1 text-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {existingUser?.name || existingUser?.full_name || 'User'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full"
              >
                {isSigningIn ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Text below with create new account option */}
              <div className="text-center">
                {resetMessage ? (
                  <p className={`text-sm ${resetMessage.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                    {resetMessage}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Not my account?{' '}
                    <button
                      onClick={async () => {
                        // Sign out the user first to ensure they're unsigned in
                        try {
                          await supabase.auth.signOut();
                        } catch (error) {
                          console.error('Error signing out:', error);
                        }

                        // Clear local state
                        clearAll();

                        // Reset to initial login state if callback provided
                        if (onResetToInitialLogin) {
                          onResetToInitialLogin();
                        } else {
                          // Fallback: close modal and redirect
                          onClose();
                          router.push('/');
                        }
                      }}
                      className="text-gray-400 underline hover:text-gray-600 transition-colors"
                    >
                      Create new one
                    </button>
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Create Account Flow
            <>
              {currentPage === 1 ? (
                // Page 1: First Name + Last Name + DOB
                <div className="space-y-6">
                  {/* First Name and Last Name - Side by Side */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* First Name */}
                    <div className="relative">
                      <input
                        ref={firstNameRef}
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        onFocus={handleFirstNameFocus}
                        onBlur={handleFirstNameBlur}
                        placeholder=""
                        className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-500 focus:outline-none transition-colors bg-white ${(firstNameFocused || formData.firstName) ? 'pt-5 pb-3' : 'py-5'} text-transparent`}
                        style={{ 
                          caretColor: 'black',
                          fontSize: '16px',
                          lineHeight: '1.2',
                          fontFamily: 'inherit'
                        }}
                        required
                      />
                      
                      {/* Step 1: Initial state - only "First Name" label */}
                      {!firstNameFocused && !formData.firstName && (
                        <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                          First Name
                        </label>
                      )}
                      
                      {/* Step 2: Focused state - label moves up, placeholder appears */}
                      {firstNameFocused && !formData.firstName && (
                        <>
                          <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                            First Name
                          </label>
                          <div className="absolute left-4 top-6 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                            Your first name
                          </div>
                        </>
                      )}
                      
                      {/* Step 3: Typing state - actual name replaces placeholder */}
                      {formData.firstName && (
                        <>
                          <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                            First Name
                          </label>
                          <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                            {formData.firstName}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="relative">
                      <input
                        ref={lastNameRef}
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        onFocus={handleLastNameFocus}
                        onBlur={handleLastNameBlur}
                        placeholder=""
                        className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-500 focus:outline-none transition-colors bg-white ${(lastNameFocused || formData.lastName) ? 'pt-5 pb-3' : 'py-5'} text-transparent`}
                        style={{ 
                          caretColor: 'black',
                          fontSize: '16px',
                          lineHeight: '1.2',
                          fontFamily: 'inherit'
                        }}
                        required
                      />
                      
                      {/* Step 1: Initial state - only "Last Name" label */}
                      {!lastNameFocused && !formData.lastName && (
                        <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                          Last Name
                        </label>
                      )}
                      
                      {/* Step 2: Focused state - label moves up, placeholder appears */}
                      {lastNameFocused && !formData.lastName && (
                        <>
                          <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                            Last Name
                          </label>
                          <div className="absolute left-4 top-6 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                            Your last name
                          </div>
                        </>
                      )}
                      
                      {/* Step 3: Typing state - actual name replaces placeholder */}
                      {formData.lastName && (
                        <>
                          <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                            Last Name
                          </label>
                          <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                            {formData.lastName}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="relative">
                      <input
                        ref={dateOfBirthRef}
                      type="text"
                        value={formData.dateOfBirth}
                        onChange={(e) => {
                          let value = e.target.value;
                          // Only allow numbers and forward slashes
                          value = value.replace(/[^0-9/]/g, '');
                          
                          // Handle deletion - if user is deleting, don't auto-add slashes
                          const currentValue = formData.dateOfBirth;
                          const isDeleting = value.length < currentValue.length;
                          
                          if (!isDeleting) {
                            // Auto-format as user types (only when adding characters)
                            if (value.length === 2 && !value.includes('/')) {
                              value = value + '/';
                            } else if (value.length === 5 && value.split('/').length === 2) {
                              value = value + '/';
                            }
                          }
                          
                          // Limit to DD/MM/YYYY format
                          if (value.length > 10) {
                            value = value.substring(0, 10);
                          }
                          handleInputChange('dateOfBirth', value);
                        }}
                        onFocus={handleDateOfBirthFocus}
                        onBlur={handleDateOfBirthBlur}
                        placeholder=""
                        className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-500 focus:outline-none transition-colors bg-white ${(dateOfBirthFocused || formData.dateOfBirth) ? 'pt-5 pb-3' : 'py-5'} text-transparent`}
                        style={{ 
                          caretColor: 'black',
                          fontSize: '16px',
                          lineHeight: '1.2',
                          fontFamily: 'inherit'
                        }}
                        required
                      />
                      
                      {/* Step 1: Initial state - only "Date of birth" label */}
                      {!dateOfBirthFocused && !formData.dateOfBirth && (
                        <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                          Date of birth
                        </label>
                      )}
                      
                      {/* Step 2: Focused state - label moves up, DD/MM/YYYY appears */}
                      {dateOfBirthFocused && !formData.dateOfBirth && (
                        <>
                          <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                            Date of birth
                          </label>
                          {/* DD/MM/YYYY placeholder */}
                          <div className="absolute left-4 top-6 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                            DD/MM/YYYY
                          </div>
                        </>
                      )}
                      
                      {/* Step 3: Typing state - actual date replaces placeholder */}
                      {formData.dateOfBirth && (
                        <>
                          <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                            Date of birth
                          </label>
                          {/* Actual date content */}
                          <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                            {formData.dateOfBirth}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Render fields based on verification method - verified method at bottom */}
                  {(verificationMethod as string) === 'email' ? (
                    // Email verified - show phone first, then email
                    <>
                      <div>
                        {/* Connected Phone Input - Airbnb Style */}
                        <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                          {/* Country/Region Section */}
                          <div className="relative border-b border-gray-200">
                            <select 
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="w-full h-14 pl-4 pr-12 pt-5 pb-3 border-0 focus:ring-0 focus:border-0 focus:outline-none transition-colors bg-white appearance-none cursor-pointer"
                              onFocus={() => setCountryFocused(true)}
                              onBlur={() => setCountryFocused(false)}
                              disabled={(verificationMethod as string) === 'phone'}
                            >
                              <option value="+61">Australia (+61)</option>
                            </select>
                            {/* Custom dropdown arrow */}
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            {(countryFocused || countryCode) && (
                              <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                                Country / Region
                              </label>
                            )}
                          </div>

                          {/* Phone Number Section */}
                          <div className="relative">
                            <input
                              ref={phoneInputRef}
                              type="tel"
                              value={phoneFocused || phoneNumber ? formatPhoneNumber(phoneNumber) : ''}
                              onChange={handlePhoneChange}
                              onFocus={handlePhoneFocus}
                              onBlur={handlePhoneBlur}
                              placeholder=""
                              className={`w-full h-14 pl-12 pr-4 border-0 focus:ring-0 focus:border-0 focus:outline-none transition-colors bg-white ${(phoneFocused || phoneNumber) ? 'pt-5 pb-3' : 'py-5'} text-transparent`}
                              style={{ 
                                caretColor: 'black',
                                fontSize: '16px',
                                lineHeight: '1.2',
                                fontFamily: 'inherit'
                              }}
                              disabled={(verificationMethod as string) === 'phone'}
                              required
                            />
                            
                            {/* Step 1: Initial state - only "Phone number" label */}
                            {!phoneFocused && !phoneNumber && (
                              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                                Phone number
                              </label>
                            )}
                            
                            {/* Step 2: Focused state - label moves up, +61 and XXX XXX XXX appear */}
                            {phoneFocused && !phoneNumber && (
                              <>
                                <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                                  Phone number
                                </label>
                                {/* +61 prefix */}
                                <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                                  +61
                                </div>
                                {/* XXX XXX XXX to the right of +61 */}
                                <div className="absolute left-12 top-6 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                                  XXX XXX XXX
                                </div>
                              </>
                            )}
                            
                            {/* Step 3: Typing state - digits replace X's */}
                            {phoneNumber && (
                              <>
                                <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                                  Phone number
                                </label>
                                {/* +61 prefix */}
                                <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                                  +61
                                </div>
                                {/* Digits to the right of +61 */}
                                <div className="absolute left-12 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                                  {formatPhoneNumber(phoneNumber)}
                                </div>
                                {/* Verification status */}
                                {(verificationMethod as string) === 'phone' && (
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-green-600 pointer-events-none flex items-center gap-1">
                                    <span>✓</span>
                                    <span>Verified</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="relative">
                          <input
                            ref={emailRef}
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            onFocus={handleEmailFocus}
                            onBlur={handleEmailBlur}
                            placeholder=""
                            className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-500 focus:outline-none transition-colors bg-white ${(emailFocused || formData.email) ? 'pt-5 pb-3' : 'py-5'} text-transparent`}
                            style={{ 
                              caretColor: 'black',
                              fontSize: '16px',
                              lineHeight: '1.2',
                              fontFamily: 'inherit'
                            }}
                            disabled={(verificationMethod as string) === 'email'}
                            required
                          />
                          
                          {/* Step 1: Initial state - only "Email" label */}
                          {!emailFocused && !formData.email && (
                            <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                              Email
                            </label>
                          )}
                          
                          {/* Step 2: Focused state - label moves up */}
                          {(emailFocused || formData.email) && (
                            <>
                              <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                                Email
                              </label>
                              {/* Text content */}
                              <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                                {formData.email}
                              </div>
                              {/* Verification status */}
                              {formData.email && (verificationMethod as string) === 'email' && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-green-600 pointer-events-none flex items-center gap-1">
                                  <span>✓</span>
                                  <span>Verified</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    // Phone verified - show email first, then phone
                    <>
                      <div>
                        <div className="relative">
                          <input
                            ref={emailRef}
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            onFocus={handleEmailFocus}
                            onBlur={handleEmailBlur}
                            placeholder=""
                            className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-500 focus:outline-none transition-colors bg-white ${(emailFocused || formData.email) ? 'pt-5 pb-3' : 'py-5'} text-transparent`}
                            style={{ 
                              caretColor: 'black',
                              fontSize: '16px',
                              lineHeight: '1.2',
                              fontFamily: 'inherit'
                            }}
                            disabled={(verificationMethod as string) === 'email'}
                            required
                          />
                          
                          {/* Step 1: Initial state - only "Email" label */}
                          {!emailFocused && !formData.email && (
                            <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                              Email
                            </label>
                          )}
                          
                          {/* Step 2: Focused state - label moves up */}
                          {(emailFocused || formData.email) && (
                            <>
                              <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                                Email
                              </label>
                              {/* Text content */}
                              <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                                {formData.email}
                              </div>
                              {/* Verification status */}
                              {formData.email && (verificationMethod as string) === 'email' && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-green-600 pointer-events-none flex items-center gap-1">
                                  <span>✓</span>
                                  <span>Verified</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        {/* Connected Phone Input - Airbnb Style */}
                        <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                          {/* Country/Region Section */}
                          <div className="relative border-b border-gray-200">
                            <select 
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="w-full h-14 pl-4 pr-12 pt-5 pb-3 border-0 focus:ring-0 focus:border-0 focus:outline-none transition-colors bg-white appearance-none cursor-pointer"
                              onFocus={() => setCountryFocused(true)}
                              onBlur={() => setCountryFocused(false)}
                              disabled={(verificationMethod as string) === 'phone'}
                            >
                              <option value="+61">Australia (+61)</option>
                            </select>
                            {/* Custom dropdown arrow */}
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            {(countryFocused || countryCode) && (
                              <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                                Country / Region
                              </label>
                            )}
                          </div>

                          {/* Phone Number Section */}
                          <div className="relative">
                            <input
                              ref={phoneInputRef}
                              type="tel"
                              value={phoneFocused || phoneNumber ? formatPhoneNumber(phoneNumber) : ''}
                              onChange={handlePhoneChange}
                              onFocus={handlePhoneFocus}
                              onBlur={handlePhoneBlur}
                              placeholder=""
                              className={`w-full h-14 pl-12 pr-4 border-0 focus:ring-0 focus:border-0 focus:outline-none transition-colors bg-white ${(phoneFocused || phoneNumber) ? 'pt-5 pb-3' : 'py-5'} text-transparent`}
                              style={{ 
                                caretColor: 'black',
                                fontSize: '16px',
                                lineHeight: '1.2',
                                fontFamily: 'inherit'
                              }}
                              disabled={(verificationMethod as string) === 'phone'}
                              required
                            />
                            
                            {/* Step 1: Initial state - only "Phone number" label */}
                            {!phoneFocused && !phoneNumber && (
                              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                                Phone number
                              </label>
                            )}
                            
                            {/* Step 2: Focused state - label moves up, +61 and XXX XXX XXX appear */}
                            {phoneFocused && !phoneNumber && (
                              <>
                                <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                                  Phone number
                                </label>
                                {/* +61 prefix */}
                                <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                                  +61
                                </div>
                                {/* XXX XXX XXX to the right of +61 */}
                                <div className="absolute left-12 top-6 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                                  XXX XXX XXX
                                </div>
                              </>
                            )}
                            
                            {/* Step 3: Typing state - digits replace X's */}
                            {phoneNumber && (
                              <>
                                <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                                  Phone number
                                </label>
                                {/* +61 prefix */}
                                <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                                  +61
                                </div>
                                {/* Digits to the right of +61 */}
                                <div className="absolute left-12 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                                  {formatPhoneNumber(phoneNumber)}
                                </div>
                                {/* Verification status */}
                                {(verificationMethod as string) === 'phone' && (
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-green-600 pointer-events-none flex items-center gap-1">
                                    <span>✓</span>
                                    <span>Verified</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <Button
                    onClick={() => {
                      console.log('AccountCheckModal: Continue button clicked, form data:', formData);
                      nextPage();
                    }}
                    disabled={!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.dateOfBirth?.trim() || !formData.email?.trim() || !formData.phone?.trim()}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              ) : (
                // Page 2: Profile Pic + Bio
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Profile Picture
                      </label>
                    </div>
                    <ImagePicker
                      onChange={handleImageChange}
                      initialPreviewUrl={formData.profilePicture ? URL.createObjectURL(formData.profilePicture) : null}
                      shape="circle"
                      size={80}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <div className="relative">
                    <TextArea
                      placeholder="Tell us a bit about yourself..."
                      value={formData.bio}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 150) {
                          handleInputChange('bio', value);
                        }
                      }}
                      rows={4}
                      className="w-full pr-16"
                      maxLength={150}
                      />
                      {/* Character counter inside the textarea */}
                      <div className="absolute bottom-2 right-2 pointer-events-none">
                        <span className={`text-xs font-medium ${formData.bio.length > 135 ? 'text-orange-600' : 'text-gray-500'}`}>
                          {formData.bio.length}/150
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCreateAccount}
                    disabled={isCreating}
                    className="w-full"
                  >
                    {isCreating ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
