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
  const { user, checkUserExists, supabase, uploadAvatar, linkPhoneToAccount, linkEmailToAccount, refreshAuthState } = useAuth();
  const { setPersonalProfile } = useAppStore();
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
      supabase.auth.getUser().then(({ data: { user: currentUser }, error }) => {
        console.log('AccountCheckModal: Current user from Supabase:', currentUser?.id || 'None');
        console.log('AccountCheckModal: Auth error:', error?.message || 'None');
      });
      
      supabase.auth.getSession().then(({ data: { session }, error }) => {
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
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [existingUser, setExistingUser] = useState<{ id: string; full_name?: string; email?: string; phone?: string; avatar_url?: string; bio?: string; date_of_birth?: string; created_at: string; updated_at: string } | null>(null);
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
        [verificationMethod === 'email' ? 'email' : 'phone']: verificationValue
      }));
      
      // If phone verification, extract the phone number digits for the Airbnb input
      if (verificationMethod === 'phone') {
        const phoneDigits = verificationValue.replace(/[^\d]/g, '');
        // Remove country code (61) from the beginning if present
        const localDigits = phoneDigits.startsWith('61') ? phoneDigits.slice(2) : phoneDigits;
        setPhoneNumber(localDigits);
      }
    }
  }, [verificationValue, verificationMethod]);

  const checkAccountExists = async () => {
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
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('AccountCheckModal: Account check timeout, assuming new account');
      setUserExists(false);
      setExistingUser(null);
    }, 5000);

    try {
      console.log('AccountCheckModal: Calling checkUserExists with:', {
        verificationMethod,
        verificationValue,
        phone: verificationMethod === 'phone' ? verificationValue : undefined,
        email: verificationMethod === 'email' ? verificationValue : undefined
      });
      
      const { exists, userData, error, multipleAccountsFound } = await checkUserExists(
        verificationMethod === 'phone' ? verificationValue : undefined,
        verificationMethod === 'email' ? verificationValue : undefined
      );

      clearTimeout(timeoutId);
      console.log('AccountCheckModal: Account check result', { exists, userData, error, multipleAccountsFound });

      if (error) {
        console.error('Error checking account:', error);
        setUserExists(false);
        setExistingUser(null);
        return;
      }

      // Handle multiple accounts found
      if (multipleAccountsFound) {
        console.warn('AccountCheckModal: Multiple accounts detected for this contact method');
        // For now, proceed with the most recent account, but log the issue
        console.log('AccountCheckModal: Proceeding with most recent account:', userData?.id);
      }
      
      // If user exists, validate the profile still exists in database
      if (exists && userData) {
        console.log('AccountCheckModal: Validating existing user profile...');
        const { data: currentProfile, error: profileError } = await supabase
          .from('profiles')
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
          setUserExists(true);
          setExistingUser(userData);
        }
      } else {
        setUserExists(exists);
        setExistingUser(userData || null);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error checking account:', error);
      setUserExists(false);
      setExistingUser(null);
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
      
      // Re-enable account checking now that Supabase is set up
      checkAccountExists();
    } else if (isOpen && !user) {
      console.log('AccountCheckModal: Modal opened but no user authenticated, waiting for user state...');
    }
  }, [isOpen, user, verificationMethod, verificationValue]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      // User is already authenticated after verification
      console.log('AccountCheckModal: User signing in with existing account', existingUser);
      console.log('AccountCheckModal: Current user state:', { user: user?.id, hasUser: !!user });
      
      // Validate session exists - retry if needed (session might take a moment to propagate)
      let currentSession = null;
      let sessionAttempts = 0;
      const maxSessionAttempts = 5;
      
      while (!currentSession && sessionAttempts < maxSessionAttempts) {
        const { data: { session } } = await supabase.auth.getSession();
        currentSession = session;
        sessionAttempts++;
        
        console.log(`AccountCheckModal: Session check attempt ${sessionAttempts}/${maxSessionAttempts}:`, {
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          userEmail: currentSession?.user?.email
        });
        
        if (!currentSession && sessionAttempts < maxSessionAttempts) {
          console.log('AccountCheckModal: Session not ready, waiting 300ms before retry...');
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      if (!currentSession) {
        console.error('AccountCheckModal: No active session found after all attempts! This indicates a critical auth issue.');
        setError('Authentication session not established. Please try signing in again.');
        setIsSigningIn(false);
        return;
      }
      
      console.log('AccountCheckModal: ✅ Session validated successfully');
      
      if (existingUser) {
        // For existing accounts, just close the modal and let ProtectedRoute handle the profile loading
        console.log('AccountCheckModal: Existing account sign-in, closing modal and letting ProtectedRoute handle profile');
        
        // Link the missing phone/email to the existing account if needed
        if (verificationMethod === 'phone' && !existingUser.phone) {
          console.log('AccountCheckModal: Linking phone to existing account');
          await linkPhoneToAccount(verificationValue);
        } else if (verificationMethod === 'email' && !existingUser.email) {
          console.log('AccountCheckModal: Linking email to existing account');
          await linkEmailToAccount(verificationValue);
        }
        
        console.log('AccountCheckModal: Closing modal for existing account sign-in');
        
        // Double-check that the profile data is stored for ProtectedRoute
        if (typeof window !== 'undefined') {
          const storedProfile = (window as any).__CONNECT_EXISTING_PROFILE__;
          console.log('AccountCheckModal: Checking stored profile before closing:', storedProfile);
          
          if (!storedProfile) {
            console.log('AccountCheckModal: No stored profile found, storing existing user data...');
            const { data: { session } } = await supabase.auth.getSession();
            window.__CONNECT_EXISTING_PROFILE__ = {
              ...existingUser,
              id: session?.user?.id || existingUser.id
            };
            console.log('AccountCheckModal: Stored profile data:', window.__CONNECT_EXISTING_PROFILE__);
          }
        }
        
        // Verify session is stable before closing
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        console.log('AccountCheckModal: Final session check before closing:', {
          hasSession: !!finalSession,
          userId: finalSession?.user?.id,
          userEmail: finalSession?.user?.email
        });
        
        if (!finalSession) {
          console.error('AccountCheckModal: Session lost before closing modal!');
          setIsSigningIn(false);
          return;
        }
        
        // User state will be preserved by AuthContext, safe to close modal
        console.log('AccountCheckModal: Closing modal - user state will be preserved by AuthContext');
        setIsSigningIn(false);
        onClose();
        return;
      }
      
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
    
    if (!user || !user.id) {
      console.error('AccountCheckModal: No user or user ID found, cannot create account');
      console.error('AccountCheckModal: User object:', user);
      alert('No user found. Please try logging in again.');
      return;
    }
    
    setIsCreating(true);
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('AccountCheckModal: Operation timeout, using fallback');
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
      router.push('/');
    }, 10000); // 10 second timeout
    
    try {
      // Upload avatar if provided
      let avatarUrl = null;
      if (formData.profilePicture) {
        console.log('AccountCheckModal: Uploading avatar...');
        const { url, error: uploadError } = await uploadAvatar(formData.profilePicture);
        if (uploadError) {
          console.error('AccountCheckModal: Avatar upload failed:', uploadError);
          // Continue without avatar rather than failing completely
        } else {
          avatarUrl = url;
          console.log('AccountCheckModal: Avatar uploaded successfully:', avatarUrl);
        }
      }
      
      // Generate unique connect_id with timeout
      console.log('AccountCheckModal: Generating unique connect_id');
      const connectIdPromise = generateUniqueConnectId(supabase);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connect ID generation timeout')), 5000)
      );
      
      const connectId = await Promise.race([connectIdPromise, timeoutPromise]);
      console.log('AccountCheckModal: Generated connect_id:', connectId);
      
      // Create profile in Supabase
      console.log('AccountCheckModal: Creating profile in Supabase');
      console.log('AccountCheckModal: User ID:', user.id);
      console.log('AccountCheckModal: Supabase client:', supabase);
      console.log('AccountCheckModal: User authenticated:', !!user);
      
      const profileData = {
        id: user.id,
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        date_of_birth: convertDateFormat(formData.dateOfBirth),
        email: formData.email,
        phone: formData.phone,
          bio: formData.bio,
        avatar_url: avatarUrl,
        connect_id: connectId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
        .from('profiles')
        .upsert([profileData], { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('AccountCheckModal: Supabase error:', error);
        throw error;
      }

      console.log('AccountCheckModal: Profile created in Supabase:', data);
      
      // Clear timeout since we succeeded
      clearTimeout(timeoutId);
      
      // Also save to local state for immediate use
      const localProfile = {
        id: user.id,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        bio: formData.bio,
        avatarUrl: formData.profilePicture ? URL.createObjectURL(formData.profilePicture) : null,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: convertDateFormat(formData.dateOfBirth),
        connectId: connectId,
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
          {currentPage === 1 && userExists === false ? (
            <button
              onClick={async () => {
                // NOT signing out - preserving user state
                console.log('AccountCheckModal: Exiting but preserving user authentication');
                
                // Clear local state
                setPersonalProfile(null);
                
                // Close modal
                onClose();
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
                // NOT signing out - preserving user state during account creation
                console.log('AccountCheckModal: Creating account but preserving user authentication');
                
                // Clear local state
                setPersonalProfile(null);
                
                // Close modal and redirect to explore page
                onClose();
                router.push('/');
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
                    src={existingUser?.avatar_url ?? undefined} 
                    name={existingUser?.full_name || 'User'} 
                    size={64}
                  />
                  
                  {/* Name - Center */}
                  <div className="flex-1 text-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {existingUser?.full_name || 'User'}
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
                        setPersonalProfile(null);

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
                  {verificationMethod === 'email' ? (
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
                              disabled={verificationMethod === 'phone'}
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
                              disabled={verificationMethod === 'phone'}
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
                                {verificationMethod === 'phone' && (
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
                            disabled={verificationMethod === 'email'}
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
                              {formData.email && verificationMethod === 'email' && (
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
                            disabled={verificationMethod === 'email'}
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
                              {formData.email && verificationMethod === 'email' && (
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
                              disabled={verificationMethod === 'phone'}
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
                              disabled={verificationMethod === 'phone'}
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
                                {verificationMethod === 'phone' && (
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
