'use client';

import { useState, useEffect } from 'react';
import { X, ArrowLeft, User, ChevronLeft } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import ImagePicker from '@/components/ImagePicker';
import { useAuth } from '@/lib/authContext';
import { useAppStore } from '@/lib/store';
import { createClient } from '@supabase/supabase-js';
import { generateUniqueConnectId, generateConnectId } from '@/lib/connectId';

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
  const { user, checkUserExists, supabase, uploadAvatar, linkPhoneToAccount, linkEmailToAccount } = useAuth();
  const { setPersonalProfile } = useAppStore();
  
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
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [existingUser, setExistingUser] = useState<{ id: string; full_name?: string; email?: string; phone?: string; avatar_url?: string; bio?: string; date_of_birth?: string; created_at: string; updated_at: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    bio: '',
    profilePicture: null as File | null
  });

  // Pre-populate the verified contact method
  useEffect(() => {
    if (verificationValue) {
      setFormData(prev => ({
        ...prev,
        [verificationMethod === 'email' ? 'email' : 'phone']: verificationValue
      }));
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
      const { exists, userData, error } = await checkUserExists(
        verificationMethod === 'phone' ? verificationValue : undefined,
        verificationMethod === 'email' ? verificationValue : undefined
      );

      clearTimeout(timeoutId);
      console.log('AccountCheckModal: Account check result', { exists, userData, error });

      if (error) {
        console.error('Error checking account:', error);
        setUserExists(false);
        setExistingUser(null);
        return;
      }

      setUserExists(exists);
      setExistingUser(userData || null);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error checking account:', error);
      setUserExists(false);
      setExistingUser(null);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      console.log('AccountCheckModal: Modal opened, checking account', { isOpen, verificationMethod, verificationValue, user: user.id });
      console.log('AccountCheckModal: Environment variables in browser:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      });
      
      // Re-enable account checking now that Supabase is set up
      checkAccountExists();
    }
  }, [isOpen, user, verificationMethod, verificationValue]);

  const handleSignIn = async () => {
    try {
      // User is already authenticated after verification
      console.log('AccountCheckModal: User signing in with existing account', existingUser);
      
      if (existingUser) {
        // Link the missing phone/email to the existing account
        if (verificationMethod === 'phone' && !existingUser.phone) {
          console.log('AccountCheckModal: Linking phone to existing account');
          await linkPhoneToAccount(verificationValue);
        } else if (verificationMethod === 'email' && !existingUser.email) {
          console.log('AccountCheckModal: Linking email to existing account');
          await linkEmailToAccount(verificationValue);
        }
        
        // Load the existing user's profile into local state
        const profile = {
          id: existingUser.id,
          name: existingUser.full_name || '',
          bio: existingUser.bio || '',
          avatarUrl: existingUser.avatar_url,
          email: existingUser.email || verificationValue,
          phone: existingUser.phone || verificationValue,
          dateOfBirth: existingUser.date_of_birth || '',
          connectId: existingUser.connect_id || '',
          createdAt: existingUser.created_at,
          updatedAt: existingUser.updated_at
        };
        
        console.log('AccountCheckModal: Loading existing profile:', profile);
        setPersonalProfile(profile);
      }
      
      console.log('AccountCheckModal: Profile loaded, closing modal and redirecting');
      onClose();
      
      // Redirect to main app
      window.location.href = '/';
    } catch (error) {
      console.error('AccountCheckModal: Error signing in:', error);
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
        name: formData.fullName,
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
      window.location.href = '/';
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
        full_name: formData.fullName,
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
        .insert([profileData])
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
        name: formData.fullName,
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
      
      // Close modal and redirect
      onClose();
      window.location.href = '/';
      
    } catch (error) {
      console.error('AccountCheckModal: Error creating profile:', error);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Fallback: create local profile if Supabase fails
      console.log('AccountCheckModal: Supabase failed, creating local profile as fallback');
      const fallbackConnectId = generateConnectId();
      const localProfile = {
        id: user.id,
        name: formData.fullName,
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
      
      // Close modal and redirect
      onClose();
      window.location.href = '/';
    } finally {
      setIsCreating(false);
    }
  };

  const nextPage = () => {
    console.log('AccountCheckModal: Moving to page 2, current form data:', formData);
    
    // Ensure we have minimum required data
    if (!formData.fullName?.trim()) {
      console.log('AccountCheckModal: No full name, using default');
      setFormData(prev => ({ ...prev, fullName: 'User' }));
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          {currentPage === 1 && userExists === false ? (
            <button
              onClick={onClose}
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
                // Sign out the user first to ensure they're unsigned in
                try {
                  await supabase.auth.signOut();
                } catch (error) {
                  console.error('Error signing out:', error);
                }
                
                // Clear local state
                setPersonalProfile(null);
                
                // Close modal and redirect to explore page
                onClose();
                window.location.href = '/';
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
            {userExists === true ? 'Is this your account?' : 
             currentPage === 1 ? 'Create Account' : 'Complete Profile'}
          </h2>
          
          <div className="w-9" />
        </div>

        <div className="p-6">
          {userExists === true ? (
            // Existing Account Card
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {existingUser?.avatar_url ? (
                      <img
                        src={existingUser.avatar_url}
                        alt={existingUser.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-orange-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center">
                    <h3 className="text-base font-semibold text-gray-900">
                      {existingUser?.full_name || 'User'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                onClick={handleSignIn}
                className="w-full"
              >
                Sign In
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
                          window.location.href = '/';
                        }
                      }}
                      className="text-blue-600 underline hover:text-blue-800 transition-colors"
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
                // Page 1: Full Name + DOB
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <Input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={formData.dateOfBirth}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Only allow numbers and forward slashes
                        value = value.replace(/[^0-9/]/g, '');
                        // Auto-format as user types
                        if (value.length === 2 && !value.includes('/')) {
                          value = value + '/';
                        } else if (value.length === 5 && value.split('/').length === 2) {
                          value = value + '/';
                        }
                        // Limit to DD/MM/YYYY format
                        if (value.length > 10) {
                          value = value.substring(0, 10);
                        }
                        handleInputChange('dateOfBirth', value);
                      }}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: DD/MM/YYYY (e.g., 12/08/2004)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email {verificationMethod === 'email' && <span className="text-green-600">✓</span>}
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full"
                      disabled={verificationMethod === 'email'}
                    />
                    {verificationMethod === 'email' && (
                      <p className="text-xs text-green-600 mt-1">✓ Verified via email</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number {verificationMethod === 'phone' && <span className="text-green-600">✓</span>}
                    </label>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full"
                      disabled={verificationMethod === 'phone'}
                    />
                    {verificationMethod === 'phone' && (
                      <p className="text-xs text-green-600 mt-1">✓ Verified via SMS</p>
                    )}
                  </div>
                  
                  {/* 2FA Explanation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>🔒 Enhanced Security:</strong> We need both your email and phone number to provide you with the best security and account recovery options.
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => {
                      console.log('AccountCheckModal: Continue button clicked, form data:', formData);
                      nextPage();
                    }}
                    disabled={!formData.fullName?.trim() || !formData.dateOfBirth?.trim() || !formData.email?.trim() || !formData.phone?.trim()}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              ) : (
                // Page 2: Profile Pic + Bio
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
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
                    <TextArea
                      placeholder="Tell us a bit about yourself..."
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={3}
                      className="w-full"
                    />
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
