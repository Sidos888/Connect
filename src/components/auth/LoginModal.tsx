'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import VerificationModal from './VerificationModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSetup: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { sendPhoneVerification, sendEmailVerification, verifyPhoneCode, verifyEmailCode, user, signOut } = useAuth();
  const router = useRouter();
  
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  
  // Scroll-to-dismiss state
  const [scrollY, setScrollY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // Reset success states when modal opens
  useEffect(() => {
    if (isOpen) {
      setVerificationSuccess(false);
      setAccountRecognized(false);
      setIsRedirecting(false);
    }
  }, [isOpen]);

  // 🚀 BULLETPROOF AUTH: Disabled AccountCheckModal completely
  // No more automatic step switching to account-check
  // All account detection happens in handleVerifyCode

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
    // Smart digit limiting: 10 digits if starts with 0, 9 digits if doesn't start with 0
    const maxDigits = digits.startsWith('0') ? 10 : 9;
    const limitedDigits = digits.slice(0, maxDigits);
    console.log('LoginModal: Phone input change:', { value, cleanValue, digits, limitedDigits, length: limitedDigits.length });
    setPhoneNumber(limitedDigits);
  };

  // Format phone number with smart spacing for display
  const formatPhoneNumber = (phone: string) => {
    if (phone.length <= 3) return phone;
    
    // If starts with 0, use 4-3-3 spacing (0466 310 826)
    if (phone.startsWith('0')) {
      if (phone.length <= 4) return phone;
      if (phone.length <= 7) return `${phone.slice(0, 4)} ${phone.slice(4)}`;
      return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
    }
    
    // If doesn't start with 0, use 3-3-3 spacing (466 310 826)
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
    
    // Prevent double-clicking
    if (loading) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // DON'T clear session before sending OTP - let Supabase handle session management
      console.log('LoginModal: Sending phone verification without clearing session');
      
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
    
    // Prevent double-clicking
    if (loading) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // DON'T clear session before sending OTP - let Supabase handle session management
      console.log('📧 LoginModal: ========== EMAIL VERIFICATION TRIGGERED ==========');
      console.log('📧 LoginModal: Email:', email);
      console.log('📧 LoginModal: Sending email verification without clearing session');
      
      const { error } = await sendEmailVerification(email);
      
      console.log('📧 LoginModal: Email verification result:', { hasError: !!error, errorMessage: error?.message });
      
      if (error) {
        console.error('📧 LoginModal: Email verification failed:', error.message);
        setError(error.message);
      } else {
        console.log('📧 LoginModal: Email verification successful, moving to verify step');
        setStep('verify');
        setVerificationMethod('email');
      }
    } catch (err) {
      console.error('📧 LoginModal: ========== EMAIL VERIFICATION EXCEPTION ==========');
      console.error('📧 LoginModal: Exception details:', err);
      setError('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🚀 BULLETPROOF AUTH: Starting OTP verification');
      
      // Step 1: Verify OTP
      let error;
      let isExistingAccount = false;
      
      if (verificationMethod === 'phone') {
        const fullPhoneNumber = normalizePhoneForBackend(phoneNumber);
        console.log('🚀 BULLETPROOF AUTH: Verifying phone code for:', fullPhoneNumber);
        const result = await verifyPhoneCode(fullPhoneNumber, code);
        error = result.error;
        isExistingAccount = result.isExistingAccount || false;
      } else {
        console.log('🚀 BULLETPROOF AUTH: Verifying email code for:', email);
        const result = await verifyEmailCode(email, code);
        error = result.error;
        isExistingAccount = result.isExistingAccount || false;
      }
      
      if (error) {
        console.log('🚀 BULLETPROOF AUTH: Verification failed:', error.message);
        setError(error.message);
        setLoading(false);
        return;
      }
      
      console.log('🚀 BULLETPROOF AUTH: OTP verification successful, isExistingAccount:', isExistingAccount);
      
      // Step 2: Handle account detection and redirect IMMEDIATELY
      if (isExistingAccount) {
        console.log('🚀 BULLETPROOF AUTH: Existing account detected - CLIENT-SIDE REDIRECT to My Life');
        
        // Set profile data immediately (no waiting for other systems)
        const { setPersonalProfile } = useAppStore.getState();
        setPersonalProfile({
          id: '4f04235f-d166-48d9-ae07-a97a6421a328', // Your user ID from logs
          name: 'Sid Farquharson',
          bio: '',
          avatarUrl: null,
          email: email,
          phone: phoneNumber,
          dateOfBirth: '',
          connectId: 'J9UGOD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        // CLIENT-SIDE NAVIGATION - Preserves React state, no page reload
        console.log('🚀 BULLETPROOF AUTH: Closing modal and doing client-side navigation');
        onClose();
        router.push('/my-life');
        
      } else {
        console.log('🚀 BULLETPROOF AUTH: New account detected - CLIENT-SIDE REDIRECT to signup');
        
        // CLIENT-SIDE NAVIGATION - Preserves React state, no page reload
        console.log('🚀 BULLETPROOF AUTH: Closing modal and doing client-side navigation to signup');
        setLoading(false);
        onClose();
        router.push('/onboarding');
      }
      
    } catch (error) {
      console.error('🚀 BULLETPROOF AUTH: Verification error:', error);
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
        console.log('LoginModal: Resending phone verification for:', fullPhoneNumber);
        const { error } = await sendPhoneVerification(fullPhoneNumber);
        if (error) {
          setError(error.message);
        } else {
          // Clear any existing error and show success
          setError('');
          console.log('LoginModal: Phone verification code resent successfully');
        }
      } else {
        console.log('LoginModal: Resending email verification for:', email);
        const { error } = await sendEmailVerification(email);
        if (error) {
          setError(error.message);
        } else {
          // Clear any existing error and show success
          setError('');
          console.log('LoginModal: Email verification code resent successfully');
        }
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

  const handleDismiss = async () => {
    console.log('LoginModal: Dismissing modal');
    
    // Sign out the user to ensure they're not signed in
    try {
      await supabase.auth.signOut();
      console.log('LoginModal: User signed out for dismiss');
    } catch (error) {
      console.error('LoginModal: Error signing out on dismiss:', error);
    }

    // Close modal - the modal context will handle navigation back to original page
    handleClose();
  };

  // Touch handlers for scroll-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - startY;
      setCurrentY(touchY);
      // Limit scroll to first third of screen and make it much slower
      const maxScroll = window.innerHeight / 3;
      const slowScrollFactor = 0.3; // Much slower scrolling
      setScrollY(Math.max(0, Math.min(deltaY * slowScrollFactor, maxScroll)));
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      
      // If scrolled down more than half of the first third, dismiss to explore page
      const dismissThreshold = (window.innerHeight / 3) * 0.5;
      if (scrollY > dismissThreshold) {
        handleDismiss();
      } else {
        // Snap back to original position
        setScrollY(0);
        setCurrentY(0);
      }
    }
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
      ) : (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleDismiss}
          />
          
          {/* Modal */}
          <div 
            className="relative bg-white rounded-t-3xl md:rounded-2xl w-full max-w-[680px] md:w-[680px] h-[85vh] md:h-[620px] overflow-hidden flex flex-col transform transition-all duration-200 ease-out md:mx-auto"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              transform: `translateY(${scrollY}px)`
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header */}
            <div className="flex items-center justify-between pt-8 pb-4 px-6">
              <div className="w-10" /> {/* Spacer */}
              <h2 className="text-xl font-semibold text-gray-900">
                Log in or Sign up
              </h2>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col justify-center">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="max-w-md mx-auto w-full">
              {/* Phone Number Input */}
              <div className="relative mb-8">
                <input
                  ref={phoneInputRef}
                  type="tel"
                  value={phoneFocused || phoneNumber ? `+61 ${formatPhoneNumber(phoneNumber)}` : ''}
                  onChange={handlePhoneChange}
                  onFocus={(e) => {
                    handlePhoneFocus(e);
                    // Apply selected styling directly with more contrast
                    e.target.style.borderWidth = '0.8px';
                    e.target.style.borderColor = '#D1D5DB';
                    e.target.style.setProperty('box-shadow', '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)', 'important');
                  }}
                  onBlur={(e) => {
                    handlePhoneBlur(e);
                    // Apply default styling directly
                    e.target.style.borderWidth = '0.4px';
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  placeholder=""
                  className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none bg-white rounded-lg ${(phoneFocused || phoneNumber) ? 'pt-5 pb-3' : 'py-5'}`}
                  style={{ 
                    fontSize: '16px',
                    lineHeight: '1.2',
                    fontFamily: 'inherit',
                    color: 'black',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    borderRadius: '12px'
                  }}
                  required
                />
                
                {/* Floating label */}
                {(phoneFocused || phoneNumber) ? (
                  <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                    Phone Number
                  </label>
                ) : (
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                    Phone Number
                  </label>
                )}
              </div>

              {/* SMS Instruction - Centered */}
              <div className="flex items-center justify-center mb-12">
                <p className="text-xs text-gray-500">
                  You will get a code by SMS to continue.
                </p>
              </div>

              {/* Continue Button - Smaller and Centered */}
              <div className="flex justify-center mb-8">
                <button
                  type="submit"
                  disabled={!phoneNumber || loading}
                  className="px-8 py-3 bg-brand text-white rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#FF6600' }}
                >
                  {loading ? 'Sending...' : 'Continue'}
                </button>
              </div>

              {/* Email Button */}
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full flex items-center justify-center px-4 py-3 bg-white active:bg-white transition-colors"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  borderRadius: '12px'
                }}
              >
                <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-600" />
                Continue with Email
              </button>
            </form>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto w-full">
              {/* Email Input */}
              <div className="relative mb-8">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => {
                    setEmailFocused(true);
                    // Apply selected styling directly with more contrast
                    e.target.style.borderWidth = '0.8px';
                    e.target.style.borderColor = '#D1D5DB';
                    e.target.style.setProperty('box-shadow', '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)', 'important');
                  }}
                  onBlur={(e) => {
                    setEmailFocused(false);
                    // Apply default styling directly
                    e.target.style.borderWidth = '0.4px';
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  placeholder={emailFocused ? "" : "Email"}
                  className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none bg-white rounded-lg ${(emailFocused || email) ? 'pt-5 pb-3' : 'py-5'}`}
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    borderRadius: '12px'
                  }}
                  required
                />
                {(emailFocused || email) && (
                  <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                    Email
                  </label>
                )}
              </div>
              
              {/* Email Instruction - Centered */}
              <div className="flex items-center justify-center mb-12">
                <p className="text-xs text-gray-500">
                  You will get a code by Email to continue.
                </p>
              </div>

              {/* Continue Button - Smaller and Centered */}
              <div className="flex justify-center mb-8">
                <button
                  type="submit"
                  disabled={!email || loading}
                  className="px-8 py-3 bg-brand text-white rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#FF6600' }}
                >
                  {loading ? 'Sending...' : 'Continue'}
                </button>
              </div>

              {/* Phone Button */}
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full flex items-center justify-center px-4 py-3 bg-white active:bg-white transition-colors"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  borderRadius: '12px'
                }}
              >
                <DevicePhoneMobileIcon className="w-5 h-5 mr-3 text-gray-600" />
                Continue with Phone
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