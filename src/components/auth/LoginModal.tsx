'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import VerificationModal from './VerificationModal';
import AccountCheckModal from './AccountCheckModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSetup: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { sendPhoneVerification, sendEmailVerification, verifyPhoneCode, verifyEmailCode, user, signOut } = useAuth();
  
  const [step, setStep] = useState<'phone' | 'email' | 'verify' | 'account-check'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'phone' | 'email'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [countryFocused, setCountryFocused] = useState(false);
  const [countryCode, setCountryCode] = useState('+61');
  const [verificationValue, setVerificationValue] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [accountRecognized, setAccountRecognized] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Reset success states when modal opens
  useEffect(() => {
    if (isOpen) {
      setVerificationSuccess(false);
      setAccountRecognized(false);
    }
  }, [isOpen]);

  // Check if user is already authenticated when modal opens
  useEffect(() => {
    if (isOpen && user && !verificationSuccess) {
      console.log('LoginModal: User already authenticated, skipping to AccountCheckModal');
      console.log('LoginModal: User data:', { 
        id: user.id, 
        email: user.email, 
        phone: user.phone,
        userMetadata: user.user_metadata 
      });
      
      setStep('account-check');
      // Set verification method and value from user's auth data
      if (user.phone) {
        setVerificationMethod('phone');
        setVerificationValue(user.phone);
        console.log('LoginModal: Using phone verification:', user.phone);
      } else if (user.email) {
        setVerificationMethod('email');
        setVerificationValue(user.email);
        console.log('LoginModal: Using email verification:', user.email);
      } else {
        // Fallback to email if no phone/email in user object
        setVerificationMethod('email');
        setVerificationValue('sidfarquharson@gmail.com'); // Use a fallback email from logs
        console.log('LoginModal: Using fallback email verification');
      }
    }
  }, [isOpen, user, verificationSuccess]);

  // Simplified phone input system - handles both 0466310826 and 466310826 formats
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Ensure +61 prefix is always present
    if (!value.startsWith('+61')) {
      // If user deleted the +61, restore it
      if (phoneInputRef.current) {
        phoneInputRef.current.value = '+61 ';
        phoneInputRef.current.setSelectionRange(4, 4);
      }
      return;
    }
    
    // Remove +61 prefix and spaces to get just the digits
    const cleanValue = value.replace(/^\+61\s*/, '').replace(/\s/g, '');
    // Remove all non-digits
    const digits = cleanValue.replace(/[^\d]/g, '');
    // Allow up to 10 digits (for 0466310826 format) or 9 digits (for 466310826 format)
    const limitedDigits = digits.slice(0, 10);
    console.log('LoginModal: Phone input change:', { value, cleanValue, digits, limitedDigits, length: limitedDigits.length });
    setPhoneNumber(limitedDigits);
  };

  // Format phone number with 3-3-3 spacing for display
  const formatPhoneNumber = (phone: string) => {
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `${phone.slice(0, 3)} ${phone.slice(3)}`;
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  };

  // Smart phone number normalization for backend
  const normalizePhoneForBackend = (phone: string) => {
    console.log('normalizePhoneForBackend: Input:', { phone, length: phone.length });
    
    // Remove all non-digit characters to get just the numbers
    const digits = phone.replace(/[^\d]/g, '');
    console.log('normalizePhoneForBackend: Digits only:', { digits, length: digits.length });
    
    // If starts with 0, remove it and add +61
    if (digits.startsWith('0')) {
      const result = `+61${digits.slice(1)}`;
      console.log('normalizePhoneForBackend: Starts with 0, result:', result);
      return result;
    }
    // If doesn't start with 0, just add +61
    else {
      const result = `+61${digits}`;
      console.log('normalizePhoneForBackend: Does not start with 0, result:', result);
      return result;
    }
  };

  const handlePhoneFocus = () => {
    setPhoneFocused(true);
    // Position cursor after +61 when focused
    setTimeout(() => {
      if (phoneInputRef.current) {
        const currentValue = phoneInputRef.current.value;
        if (currentValue.startsWith('+61 ')) {
          // Position cursor after "+61 "
          phoneInputRef.current.setSelectionRange(4, 4);
        }
      }
    }, 10);
  };

  const handlePhoneBlur = () => {
    setPhoneFocused(false);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Clear existing session to force fresh OTP verification
      console.log('LoginModal: Clearing existing session before OTP request');
      await signOut();
      
      const fullPhoneNumber = normalizePhoneForBackend(phoneNumber);
      console.log('LoginModal: Normalized phone number:', { input: phoneNumber, normalized: fullPhoneNumber });
      const { error } = await sendPhoneVerification(fullPhoneNumber);
      
      if (error) {
        setError(error.message);
      } else {
        setStep('verify');
        setVerificationMethod('phone');
      }
    } catch {
      setError('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Clear existing session to force fresh OTP verification
      console.log('LoginModal: Clearing existing session before OTP request');
      await signOut();
      
      const { error } = await sendEmailVerification(email);
      
      if (error) {
        setError(error.message);
      } else {
        setStep('verify');
        setVerificationMethod('email');
      }
    } catch {
      setError('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setLoading(true);
    setError('');
    
    try {
      let error;
      let isExistingAccount = false;
      
      if (verificationMethod === 'phone') {
        const fullPhoneNumber = normalizePhoneForBackend(phoneNumber);
        console.log('LoginModal: Verifying phone code for:', fullPhoneNumber);
        const result = await verifyPhoneCode(fullPhoneNumber, code);
        error = result.error;
        isExistingAccount = result.isExistingAccount || false;
      } else {
        const result = await verifyEmailCode(email, code);
        error = result.error;
        isExistingAccount = result.isExistingAccount || false;
      }
      
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      
      console.log('LoginModal: Verification successful, isExistingAccount:', isExistingAccount);
      setVerificationValue(verificationMethod === 'phone' ? phoneNumber : email);
      
      if (isExistingAccount) {
        console.log('LoginModal: Existing account detected, showing success state on verification screen');
        // For existing accounts, show success state on verification screen
        setVerificationSuccess(true);
        setAccountRecognized(true);
        setError(''); // Clear any errors
        setLoading(false); // Stop loading immediately
        
        setTimeout(() => {
          console.log('LoginModal: Now showing AccountCheckModal for existing account');
          setStep('account-check');
        }, 2000); // Stay longer to show "Account recognized" state
      } else {
        console.log('LoginModal: New account, staying on verification screen longer');
        // For new accounts, stay on verification screen longer
        setTimeout(() => {
          console.log('LoginModal: Now showing AccountCheckModal after delay');
          setStep('account-check');
          setLoading(false);
        }, 3000);
      }
    } catch {
      setError('Invalid verification code');
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      if (verificationMethod === 'phone') {
        const fullPhoneNumber = normalizePhoneForBackend(phoneNumber);
        console.log('LoginModal: Resending to normalized phone:', { input: phoneNumber, normalized: fullPhoneNumber });
        await sendPhoneVerification(fullPhoneNumber);
      } else {
        await sendEmailVerification(email);
      }
    } catch {
      setError('Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'verify') {
      setStep(verificationMethod === 'phone' ? 'phone' : 'email');
    }
  };

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setStep('phone');
    setPhoneNumber('');
    setEmail('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {step === 'verify' ? (
        <VerificationModal
          isOpen={isOpen}
          onClose={onClose}
          onVerify={handleVerifyCode}
          onResend={handleResendCode}
          onBack={handleBack}
          verificationMethod={verificationMethod}
          phoneOrEmail={verificationMethod === 'phone' ? phoneNumber : email}
          loading={loading}
          error={error}
          verificationSuccess={verificationSuccess}
          accountRecognized={accountRecognized}
        />
      ) : step === 'account-check' ? (
        <AccountCheckModal
          isOpen={isOpen}
          onClose={async () => {
            console.log('LoginModal: onClose called');
            // Check session directly instead of user state to avoid timing issues
            const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
            console.log('LoginModal: Session check in onClose:', { 
              hasSession: !!session, 
              userId: session?.user?.id,
              userEmail: session?.user?.email 
            });
            
            if (!session) {
              console.log('LoginModal: No session found, but NOT signing out - preserving user state');
            } else {
              console.log('LoginModal: Session found, NOT signing out');
            }
            
            setStep('phone');
            onClose();
          }}
          verificationMethod={verificationMethod}
          verificationValue={verificationValue}
          onResetToInitialLogin={async () => {
            // NOT signing out - preserving user state during reset
            console.log('LoginModal: Resetting modal state but preserving user authentication');
            
            // Reset to initial phone step and clear form data
            setStep('phone');
            setPhoneNumber('');
            setEmail('');
            setError('');
            setVerificationValue('');
          }}
        />
      ) : (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:pb-0 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-2xl transform transition-all duration-300 ease-out h-[85vh] md:h-auto md:max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="w-10" /> {/* Spacer */}
              <h2 className="text-xl font-semibold text-gray-900">
                Log in or sign up
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-3">
              {/* Country/Region Dropdown */}
              <div className="relative">
                <div className="relative">
                  <select 
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full h-14 pl-4 pr-12 pt-5 pb-3 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-600 focus:outline-none transition-colors bg-white appearance-none cursor-pointer"
                    onFocus={() => setCountryFocused(true)}
                    onBlur={() => setCountryFocused(false)}
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
              </div>

              {/* Phone Number Input - Simplified with visible text */}
              <div className="relative">
                <input
                  ref={phoneInputRef}
                  type="tel"
                  value={phoneFocused || phoneNumber ? `+61 ${formatPhoneNumber(phoneNumber)}` : ''}
                  onChange={handlePhoneChange}
                  onFocus={handlePhoneFocus}
                  onBlur={handlePhoneBlur}
                  placeholder=""
                  className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-600 focus:outline-none transition-colors bg-white ${(phoneFocused || phoneNumber) ? 'pt-5 pb-3' : 'py-5'}`}
                  style={{ 
                    fontSize: '16px',
                    lineHeight: '1.2',
                    fontFamily: 'inherit',
                    color: 'black'
                  }}
                  required
                />
                
                {/* Floating label */}
                {(phoneFocused || phoneNumber) ? (
                  <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                    Phone number
                  </label>
                ) : (
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                    Phone number
                  </label>
                )}
              </div>

              {/* SMS Instruction */}
              <p className="text-xs text-gray-500 mt-3">
                You will get a code by SMS to continue.
              </p>

              {/* Continue Button */}
              <button
                type="submit"
                disabled={loading || !phoneNumber}
                className="w-full bg-brand text-white py-3 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#FF6600' }}
              >
                {loading ? 'Sending...' : 'Continue'}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Email Button */}
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-600" />
                Continue with email
              </button>
            </form>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder={emailFocused ? "" : "Email"}
                  className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-600 focus:outline-none transition-colors bg-white ${(emailFocused || email) ? 'pt-5 pb-3' : 'py-5'}`}
                  required
                />
                {(emailFocused || email) && (
                  <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                    Email
                  </label>
                )}
              </div>
              
              {/* Email Instruction */}
              <p className="text-xs text-gray-500 mt-2">
                You will get a code by Email to continue.
              </p>

              {/* Continue Button */}
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-brand text-white py-3 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#FF6600' }}
              >
                {loading ? 'Sending...' : 'Continue'}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Phone Button */}
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <DevicePhoneMobileIcon className="w-5 h-5 mr-3 text-gray-600" />
                Continue with phone
              </button>
            </form>
          )}



              {/* Error Message */}
              {error && (
                <div className="mt-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}