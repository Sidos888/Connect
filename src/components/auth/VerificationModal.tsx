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
  error = ''
}: VerificationModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;
    
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newCode.every(digit => digit !== '') && newCode.length === 6) {
      onVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:pb-0 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Mobile: Bottom Sheet, Desktop: Centered Card */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-xl">
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
            <p className="text-sm text-gray-600 mb-1">Code sent to</p>
            <p className="text-sm text-gray-900 font-medium">
              {verificationMethod === 'phone' ? `+61 ${phoneOrEmail.slice(0, 3)} ${phoneOrEmail.slice(3, 6)} ${phoneOrEmail.slice(6, 9)}` : phoneOrEmail}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 6 Digit Input Boxes */}
          <div className="flex justify-center gap-2 md:gap-4 mb-8 px-4">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={() => setActiveIndex(index)}
                className={`
                  w-12 h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-bold border-2 rounded-xl
                  focus:outline-none focus:ring-0 transition-all duration-150 bg-white
                  ${activeIndex === index
                    ? 'border-brand ring-2 ring-brand/20'
                    : digit
                    ? 'border-gray-300'
                    : 'border-gray-200'
                  }
                `}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading || code.join('').length !== 6}
              className={`
                w-full h-14 rounded-lg font-semibold text-white transition-all
                ${code.join('').length === 6 && !loading
                  ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                  : 'bg-gray-300 cursor-not-allowed'
                }
              `}
            >
              {loading ? 'Verifying...' : 'Continue'}
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
        </div>
      </div>
    </div>
  );
}
