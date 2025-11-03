'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import VerificationModal from './VerificationModal';
import AccountCheckModal from './AccountCheckModal';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSetup: () => void;
}

export default function SignUpModal({ isOpen, onClose }: SignUpModalProps) {
  const { sendPhoneVerification, sendEmailVerification, verifyPhoneCode, verifyEmailCode, signOut } = useAuth();
  
  // Detect device type and set default step
  const [isMobile, setIsMobile] = useState(false);
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
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);


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
    console.log('SignUpModal: Phone input change:', { value, cleanValue, digits, limitedDigits, length: limitedDigits.length });
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
    console.log('SignUpModal normalizePhoneForBackend: Input:', { phone, length: phone.length });
    
    // Remove all non-digit characters to get just the numbers
    const digits = phone.replace(/[^\d]/g, '');
    console.log('SignUpModal normalizePhoneForBackend: Digits only:', { digits, length: digits.length });
    
    // If starts with 0, remove it and add +61
    if (digits.startsWith('0')) {
      const result = `+61${digits.slice(1)}`;
      console.log('SignUpModal normalizePhoneForBackend: Starts with 0, result:', result);
      return result;
    }
    // If doesn't start with 0, just add +61
    else {
      const result = `+61${digits}`;
      console.log('SignUpModal normalizePhoneForBackend: Does not start with 0, result:', result);
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
      const fullPhoneNumber = normalizePhoneForBackend(phoneNumber);
      console.log('SignUpModal: Normalized phone number:', { input: phoneNumber, normalized: fullPhoneNumber });
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
      if (verificationMethod === 'phone') {
        const fullPhoneNumber = normalizePhoneForBackend(phoneNumber);
        console.log('SignUpModal: Verifying phone code for:', fullPhoneNumber);
        const result = await verifyPhoneCode(fullPhoneNumber, code);
        error = result.error;
      } else {
        const result = await verifyEmailCode(email, code);
        error = result.error;
      }
      
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      
      console.log('SignUpModal: Verification successful, staying on verification screen for 3 seconds...');
      setVerificationValue(verificationMethod === 'phone' ? phoneNumber : email);
      
      // Keep user on verification screen for 3 seconds to show success state
      // This prevents the brief flash to signup form before AccountCheckModal
      setTimeout(() => {
        console.log('SignUpModal: Now showing AccountCheckModal after delay');
        setStep('account-check');
        setLoading(false);
      }, 3000);
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
        console.log('SignUpModal: Resending to normalized phone:', { input: phoneNumber, normalized: fullPhoneNumber });
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

  // Detect device type and set default step
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      
      // Set default step based on device type
      if (mobile) {
        setStep('phone'); // Mobile defaults to phone
      } else {
        setStep('email'); // Web defaults to email
      }
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Reset success states when modal opens and auto-focus
  useEffect(() => {
    if (isOpen) {
      // Reset to default step based on device type
      if (isMobile) {
        setStep('phone');
        // Auto-focus phone field on mobile only
        setTimeout(() => {
          if (phoneInputRef.current) {
            phoneInputRef.current.focus();
          }
        }, 100);
      } else {
        setStep('email');
        // Don't auto-focus email field on web - let user click to activate
      }
    }
  }, [isOpen, isMobile]);

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
    // Reset to default step based on device type
    if (isMobile) {
      setStep('phone');
    } else {
      setStep('email');
    }
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
        />
      ) : step === 'account-check' ? (
        <AccountCheckModal
          isOpen={isOpen}
          onClose={async () => {
            console.log('SignUpModal: onClose called');
            // Check session directly instead of user state to avoid timing issues
            const { data: { session } } = await supabase.auth.getSession();
            console.log('SignUpModal: Session check in onClose:', { 
              hasSession: !!session, 
              userId: session?.user?.id,
              userEmail: session?.user?.email 
            });
            
            if (!session) {
              console.log('SignUpModal: No session found, but NOT signing out - preserving user state');
            } else {
              console.log('SignUpModal: Session found, NOT signing out');
            }
            
            setStep('phone');
            onClose();
          }}
          verificationMethod={verificationMethod}
          verificationValue={verificationValue}
        />
      ) : (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <div 
            className="relative bg-white rounded-t-3xl md:rounded-2xl w-full max-w-[680px] md:w-[680px] h-[85vh] md:h-[620px] overflow-hidden flex flex-col transform transition-all duration-300 ease-out"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="w-10" /> {/* Spacer */}
              <h2 className="text-xl font-semibold text-gray-900">
                Log in or sign up
              </h2>
              <button
                onClick={handleClose}
                className="action-btn-circle transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5 text-gray-900" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col justify-center">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4 max-w-md mx-auto w-full">
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
                  className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none bg-white rounded-lg transition-all duration-200 ${(phoneFocused || phoneNumber) ? 'pt-5 pb-3' : 'py-5'}`}
                  style={{ 
                    fontSize: '16px',
                    lineHeight: '1.2',
                    fontFamily: 'inherit',
                    color: 'black',
                    border: '0.4px solid #E5E7EB',
                    borderRadius: '12px',
                    transform: phoneFocused ? 'translateY(-1px)' : 'translateY(0)',
                    boxShadow: phoneFocused
                      ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                      : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
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
                disabled={!phoneNumber}
                className="w-full bg-brand text-white py-3 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#FF6600' }}
              >
                Continue
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
                className="w-full flex items-center justify-center px-4 py-3 bg-white transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  borderRadius: '12px',
                  willChange: 'transform, box-shadow'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-600" />
                Continue with email
              </button>
            </form>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-md mx-auto w-full">
              {/* Email Input */}
              <div className="relative">
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder={emailFocused ? "" : "Email"}
                  className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none bg-white rounded-lg transition-all duration-200 ${(emailFocused || email) ? 'pt-5 pb-3' : 'py-5'}`}
                  style={{ 
                    fontSize: '16px',
                    lineHeight: '1.2',
                    fontFamily: 'inherit',
                    color: 'black',
                    border: '0.4px solid #E5E7EB',
                    borderRadius: '12px',
                    transform: emailFocused ? 'translateY(-1px)' : 'translateY(0)',
                    boxShadow: emailFocused
                      ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                      : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
                  }}
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
                disabled={!email}
                className="w-full bg-brand text-white py-3 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#FF6600' }}
              >
                Continue
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
                className="w-full flex items-center justify-center px-4 py-3 bg-white transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  borderRadius: '12px',
                  willChange: 'transform, box-shadow'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                <DevicePhoneMobileIcon className="w-5 h-5 mr-3 text-gray-600" />
                Continue with phone
              </button>
            </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}