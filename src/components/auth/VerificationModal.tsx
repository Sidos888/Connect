"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

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
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Scroll-to-dismiss state
  const [scrollY, setScrollY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [initialViewportHeight, setInitialViewportHeight] = useState(0);

  // Capture initial viewport height when modal opens
  useEffect(() => {
    if (isOpen) {
      setInitialViewportHeight(window.innerHeight);
    }
  }, [isOpen]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      setIsVerifying(false);
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

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
        setIsVerifying(true);
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
      setIsVerifying(true);
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
    await onResend();
    setCode(['', '', '', '', '', '']);
    setActiveIndex(0);
    setIsVerifying(false);
    inputRefs.current[0]?.focus();
  };

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle dismiss - sign out and return to original page
  const handleDismiss = async () => {
    console.log('VerificationModal: Dismissing modal');
    
    // Sign out the user to ensure they're not signed in
    try {
      const { default: supabase } = await import('@/lib/supabaseClient');
      await supabase.auth.signOut();
      console.log('VerificationModal: User signed out for dismiss');
    } catch (error) {
      console.error('VerificationModal: Error signing out on dismiss:', error);
    }

    // Close modal - the modal context will handle navigation back to original page
    onClose();
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
      // Use initial viewport height for consistent scroll behavior with/without keyboard
      const viewportHeight = initialViewportHeight || window.innerHeight;
      const maxScroll = viewportHeight / 3;
      const slowScrollFactor = 0.3; // Much slower scrolling
      setScrollY(Math.max(0, Math.min(deltaY * slowScrollFactor, maxScroll)));
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      
      // Use initial viewport height for consistent scroll behavior with/without keyboard
      const viewportHeight = initialViewportHeight || window.innerHeight;
      const dismissThreshold = (viewportHeight / 3) * 0.5;
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:pb-0 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Mobile: Bottom Sheet, Desktop: Centered Card */}
      <div 
        className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-2xl transform transition-all duration-200 ease-out h-[85vh] md:h-auto md:max-h-[95vh] overflow-hidden"
        style={{
          transform: `translateY(${scrollY}px)`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <button
            onClick={onBack}
            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Verify</h2>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-8">
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
                <p className="text-sm text-gray-900 font-medium">
                  {verificationMethod === 'phone' ? `+61 ${phoneOrEmail.slice(0, 3)} ${phoneOrEmail.slice(3, 6)} ${phoneOrEmail.slice(6, 9)}` : phoneOrEmail}
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
                  setIsVerifying(true);
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
                onFocus={() => setActiveIndex(index)}
                className={`
                  w-12 h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-bold border-[3px] rounded-xl
                  focus:outline-none focus:ring-0 transition-all duration-75 bg-white
                  ${activeIndex === index
                    ? '!border-black'
                    : 'border-gray-300'
                  }
                `}
                style={{ 
                  caretColor: 'transparent',
                  borderColor: activeIndex === index 
                    ? '#000000' 
                    : '#d1d5db'
                }}
              />
            ))}
          </div>
          )}

          {/* Action Buttons - Hide when verification successful */}
          {!verificationSuccess && (
          <div className="space-y-3">
            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading || isVerifying || code.join('').length !== 6}
              className={`
                w-full h-14 rounded-lg font-semibold text-white transition-all duration-75
                ${code.join('').length === 6 && !loading && !isVerifying
                  ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                  : 'bg-gray-300 cursor-not-allowed'
                }
              `}
            >
              {isVerifying ? 'Verifying...' : loading ? 'Verifying...' : 'Continue'}
            </button>

            {/* Resend Button */}
            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 text-sm"
              >
                Resend code
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
