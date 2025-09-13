'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/authContext';
import VerificationModal from './VerificationModal';
import AccountCheckModal from './AccountCheckModal';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSetup: () => void;
}

export default function SignUpModal({ isOpen, onClose }: SignUpModalProps) {
  const { sendPhoneVerification, sendEmailVerification, verifyPhoneCode, verifyEmailCode, signOut } = useAuth();
  
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


  // Airbnb phone input system - 3 steps
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove all non-digits and spaces, then remove spaces
    const digits = value.replace(/[^\d]/g, '');
    // Limit to 9 digits
    const limitedDigits = digits.slice(0, 9);
    setPhoneNumber(limitedDigits);
    
    // Position cursor correctly after input - account for spaces in formatted display
    setTimeout(() => {
      if (phoneInputRef.current) {
        const formatted = formatPhoneNumber(limitedDigits);
        const cursorPos = formatted.length;
        phoneInputRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  // Format phone number with 3-3-3 spacing
  const formatPhoneNumber = (phone: string) => {
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `${phone.slice(0, 3)} ${phone.slice(3)}`;
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
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


  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\s/g, '')}`;
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
        const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\s/g, '')}`;
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
      
      // Show account check modal
      setVerificationValue(verificationMethod === 'phone' ? phoneNumber : email);
      setStep('account-check');
    } catch {
      setError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      if (verificationMethod === 'phone') {
        await sendPhoneVerification(phoneNumber);
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
        />
      ) : step === 'account-check' ? (
        <AccountCheckModal
          isOpen={isOpen}
          onClose={async () => {
            // Sign out from Supabase to clean up partial authentication
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out during modal close:', error);
            }
            
            setStep('phone');
            onClose();
          }}
          verificationMethod={verificationMethod}
          verificationValue={verificationValue}
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

              {/* Phone Number Input - Airbnb Style */}
              <div className="relative">
                <input
                  ref={phoneInputRef}
                  type="tel"
                  value={phoneFocused || phoneNumber ? formatPhoneNumber(phoneNumber) : ''}
                  onChange={handlePhoneChange}
                  onFocus={handlePhoneFocus}
                  onBlur={handlePhoneBlur}
                  placeholder=""
                  className={`w-full h-14 pl-16 pr-4 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-600 focus:outline-none transition-colors bg-white ${(phoneFocused || phoneNumber) ? 'pt-5 pb-3' : 'py-5'} text-transparent`}
                  style={{ 
                    caretColor: 'black',
                    fontSize: '16px',
                    lineHeight: '1.2',
                    fontFamily: 'inherit'
                  }}
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
                    <div className="absolute left-16 top-6 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
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
                    <div className="absolute left-16 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                      {formatPhoneNumber(phoneNumber)}
                    </div>
                  </>
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
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
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