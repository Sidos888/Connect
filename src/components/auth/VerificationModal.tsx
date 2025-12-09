"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, X } from "lucide-react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  verificationMethod: 'phone' | 'email';
  phoneOrEmail: string;
  loading?: boolean;
  error?: string;
  verificationSuccess?: boolean;
  accountRecognized?: boolean;
}

export default function VerificationModal({ 
  isOpen, 
  onClose, 
  onVerify, 
  onResend, 
  onBack,
  verificationMethod,
  phoneOrEmail,
  loading = false,
  error = '',
  verificationSuccess = false,
  accountRecognized = false
}: VerificationModalProps) {
  
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
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Resend countdown timer
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  // Removed scroll-to-dismiss for full-page modal

  // Focus first input when modal opens and reset countdown
  useEffect(() => {
    if (isOpen) {
      if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
      }
      // Reset countdown when modal opens
      setResendCountdown(30);
      setCanResend(false);
    }
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (!isOpen || canResend) return;

    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [isOpen, resendCountdown, canResend]);

  const handleInputChange = (index: number, value: string) => {
    console.log('VerificationModal: Input change', { index, value, currentCode: code });
    
    // Handle mobile SMS autofill - if we get multiple digits, treat it as a paste
    if (value.length > 1) {
      console.log('VerificationModal: Multiple digits detected, handling as autofill');
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newCode = [...code];
      
      for (let i = 0; i < digits.length && i < 6; i++) {
        newCode[i] = digits[i];
      }
      
      setCode(newCode);
      
      // Focus the next empty input or the last one
      const nextEmptyIndex = newCode.findIndex(digit => digit === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      setActiveIndex(focusIndex);
      
      // Auto-verify if all 6 digits are filled
      if (newCode.every(digit => digit !== '') && newCode.length === 6) {
        console.log('VerificationModal: All digits entered via autofill, auto-verifying instantly');
        onVerify(newCode.join('')); // Instant verification
      } else {
        // Focus the appropriate input after autofill
        setTimeout(() => {
          inputRefs.current[focusIndex]?.focus();
        }, 50);
      }
      return;
    }
    
    // Only allow digits for single character input
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    console.log('VerificationModal: Updated code', newCode);

    // Auto-focus next input
    if (value && index < 5) {
      setTimeout(() => {
        setActiveIndex(index + 1);
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }

    // Auto-verify when all digits are entered
    if (newCode.every(digit => digit !== '') && newCode.length === 6) {
      console.log('VerificationModal: All digits entered, auto-verifying instantly');
      onVerify(newCode.join('')); // Instant verification
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    console.log('VerificationModal: Key down', { key: e.key, index });
    
    if (e.key === 'Backspace') {
      if (code[index]) {
        // If current input has value, clear it
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      } else if (index > 0) {
        // Move to previous input
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    } else if (/^\d$/.test(e.key)) {
      // Handle direct number key press
      e.preventDefault();
      handleInputChange(index, e.key);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i];
    }
    
    setCode(newCode);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(digit => digit === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    setActiveIndex(focusIndex);
    inputRefs.current[focusIndex]?.focus();
  };


  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      onVerify(fullCode);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    await onResend();
    setCode(['', '', '', '', '', '']);
    setActiveIndex(0);
    inputRefs.current[0]?.focus();
    
    // Restart countdown
    setResendCountdown(30);
    setCanResend(false);
  };

  // Prevent body scrolling when modal is open
  useEffect(() => {
    console.log('🔐 VerificationModal: isOpen changed', { isOpen });
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log('🔐 VerificationModal: Modal is open, body scroll locked');
    } else {
      document.body.style.overflow = 'unset';
      console.log('🔐 VerificationModal: Modal is closed, body scroll unlocked');
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Log when component renders
  useEffect(() => {
    console.log('🔐 VerificationModal: Component rendered', { 
      isOpen, 
      verificationMethod, 
      phoneOrEmail: phoneOrEmail ? '***' : 'empty',
      loading,
      error
    });
  }, [isOpen, verificationMethod, phoneOrEmail, loading, error]);

  // Removed handleDismiss and scroll-to-dismiss handlers for full-page modal
  // User can close via X button or back button

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center overflow-hidden">
      {/* Backdrop - removed for full page modal */}
      
      {/* Modal - Full Page */}
      <div 
        className="relative bg-white w-full h-full overflow-y-auto flex flex-col"
        style={{
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
        }}
      >
        {/* Header */}
        <div className="px-4" style={{ 
          paddingTop: typeof window !== 'undefined' && window.innerWidth < 1024 ? 'max(env(safe-area-inset-top), 70px)' : '32px',
          paddingBottom: '16px',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Inner container matching PageHeader structure */}
          <div className="relative w-full" style={{ 
            width: '100%', 
            minHeight: '44px',
            pointerEvents: 'auto'
          }}>
            {/* Left: Back Button */}
            <div className="absolute left-0 flex items-center gap-3" style={{ 
              top: '0', 
              height: '44px' 
            }}>
              <button
                onClick={onBack}
                className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-gray-900" strokeWidth={2} />
              </button>
            </div>

            {/* Center: Title */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ 
              top: '0', 
              height: '44px' 
            }}>
              <h2 className="text-xl font-semibold text-gray-900">Verify</h2>
            </div>

            {/* Right: X Button */}
            <div className="absolute right-0 flex items-center gap-3" style={{ 
              top: '0', 
              height: '44px' 
            }}>
              <button
                onClick={onClose}
                className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
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
                <X size={18} className="text-gray-900" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 lg:px-8 flex flex-col justify-center relative" style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)'
        }}>
          <div className="text-center mb-8 max-w-md mx-auto w-full">
            {verificationSuccess && accountRecognized ? (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Account recognized!</p>
                <p className="text-sm text-gray-600">Preparing your account...</p>
              </>
            ) : verificationSuccess ? (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Verification successful!</p>
                <p className="text-sm text-gray-600">Setting up your account...</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-1">Code sent to</p>
                <p className="text-lg text-gray-900 font-semibold">
                  {verificationMethod === 'phone' ? `+61 ${formatPhoneNumber(phoneOrEmail)}` : phoneOrEmail}
                </p>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Hidden SMS autofill input for better mobile support */}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            className="absolute opacity-0 pointer-events-none"
            style={{ left: '-9999px' }}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length > 0) {
                console.log('VerificationModal: SMS autofill detected via hidden input:', value);
                // Handle as autofill
                const digits = value.slice(0, 6).split('');
                const newCode = ['', '', '', '', '', ''];
                
                for (let i = 0; i < digits.length; i++) {
                  newCode[i] = digits[i];
                }
                
                setCode(newCode);
                
                // Auto-verify if all 6 digits are filled
                if (newCode.every(digit => digit !== '') && newCode.length === 6) {
                  console.log('VerificationModal: All digits entered via SMS autofill, auto-verifying instantly');
                  onVerify(newCode.join('')); // Instant verification
                }
                
                // Clear the hidden input
                e.target.value = '';
              }
            }}
          />

          {/* 6 Digit Input Boxes - Hide when verification successful */}
          {!verificationSuccess && (
          <div className="flex justify-center gap-3 md:gap-4 mb-8 px-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={(e) => {
                  setActiveIndex(index);
                  // Apply selected styling directly using setProperty with !important
                  e.target.style.setProperty('border-width', '0.8px', 'important');
                  e.target.style.setProperty('border-color', '#D1D5DB', 'important');
                  e.target.style.setProperty('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)', 'important');
                  e.target.style.setProperty('transform', 'translateY(-1px)', 'important');
                }}
                onBlur={(e) => {
                  // Apply default styling directly
                  e.target.style.setProperty('border-width', '0.4px', 'important');
                  e.target.style.setProperty('border-color', '#E5E7EB', 'important');
                  e.target.style.setProperty('box-shadow', '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)', 'important');
                  e.target.style.setProperty('transform', 'translateY(0)', 'important');
                }}
                onMouseEnter={(e) => {
                  if (activeIndex !== index) {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeIndex !== index) {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }
                }}
                className="w-12 h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-bold focus:outline-none focus:ring-0 transition-all duration-200 bg-white hover:-translate-y-[1px]"
                style={{ 
                  caretColor: 'transparent',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  borderRadius: '12px',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
                }}
              />
            ))}
          </div>
          )}

          {/* Verify Button - Hide when verification successful */}
          {!verificationSuccess && (
            <div className="flex justify-center mb-8">
              <button
                onClick={handleVerify}
                disabled={code.join('').length !== 6 || loading}
                className={`
                  px-8 py-3 rounded-lg font-semibold text-white transition-all duration-75
                  ${code.join('').length === 6 && !loading
                    ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                    : 'bg-gray-300 cursor-not-allowed'
                  }
                `}
                style={{ backgroundColor: code.join('').length === 6 && !loading ? '#FF6600' : undefined }}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-1 w-full h-full min-h-[1.5rem]">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          )}

          {/* Resend Button */}
          {!verificationSuccess && (
            <div className="text-center mt-6">
              <button
                onClick={handleResend}
                disabled={!canResend}
                className={`text-sm transition-colors ${
                  canResend 
                    ? 'text-gray-900 hover:text-gray-700 cursor-pointer' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {canResend ? 'Resend code' : `Resend code in ${resendCountdown}s`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}