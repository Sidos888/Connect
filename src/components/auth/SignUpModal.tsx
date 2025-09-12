'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/authContext';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSetup: () => void;
}

export default function SignUpModal({ isOpen, onClose, onProfileSetup }: SignUpModalProps) {
  const { sendPhoneVerification, sendEmailVerification, verifyPhoneCode, verifyEmailCode, checkUserExists } = useAuth();
  
  const [step, setStep] = useState<'phone' | 'email' | 'verify' | 'account-found'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'phone' | 'email'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const fullPhoneNumber = `+61${phoneNumber.replace(/\s/g, '')}`;
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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let error;
      if (verificationMethod === 'phone') {
        const fullPhoneNumber = `+61${phoneNumber.replace(/\s/g, '')}`;
        const result = await verifyPhoneCode(fullPhoneNumber, verificationCode);
        error = result.error;
      } else {
        const result = await verifyEmailCode(email, verificationCode);
        error = result.error;
      }
      
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      
      // Check if user exists
      const phoneOrEmail = verificationMethod === 'phone' ? phoneNumber : email;
      const { exists } = await checkUserExists(
        verificationMethod === 'phone' ? phoneOrEmail : undefined,
        verificationMethod === 'email' ? phoneOrEmail : undefined
      );
      
      if (exists) {
        setStep('account-found');
      } else {
        onProfileSetup();
      }
    } catch {
      setError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'verify') {
      setStep(verificationMethod === 'phone' ? 'phone' : 'email');
    } else if (step === 'account-found') {
      setStep('verify');
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
    setVerificationCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pb-8 md:pb-0 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-2xl transform transition-all duration-300 ease-out h-[85vh] md:h-auto md:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="w-10" /> {/* Spacer */}
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'account-found' ? 'Account Found' : 'Log in or sign up'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pb-0">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              {/* Country/Region Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Country / Region</label>
                <div className="relative">
                  <select className="w-full h-14 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors">
                    <option value="+61">Australia (+61)</option>
                  </select>
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone number"
                  className="w-full h-14 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  required
                />
              </div>

              {/* Privacy Notice */}
              <p className="text-sm text-gray-600">
                We&apos;ll call or text to confirm your number. Standard message and data rates apply.
              </p>

              {/* Continue Button */}
              <button
                type="submit"
                disabled={loading || !phoneNumber}
                className="w-full bg-brand text-white py-4 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full flex items-center justify-center px-4 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-600" />
                Continue with email
              </button>
            </form>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-14 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  required
                />
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-brand text-white py-4 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full flex items-center justify-center px-4 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <DevicePhoneMobileIcon className="w-5 h-5 mr-3 text-gray-600" />
                Continue with phone
              </button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {/* Verification Code Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Enter verification code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full h-14 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-brand text-white py-4 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#FF6600' }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>

              {/* Resend Code */}
              <button
                type="button"
                onClick={() => {
                  if (verificationMethod === 'phone') {
                    const form = document.createElement('form');
                    handlePhoneSubmit({ preventDefault: () => {} } as React.FormEvent);
                  } else {
                    const form = document.createElement('form');
                    handleEmailSubmit({ preventDefault: () => {} } as React.FormEvent);
                  }
                }}
                className="w-full text-gray-600 hover:text-gray-800 transition-colors"
              >
                Resend code
              </button>
            </form>
          )}

          {step === 'account-found' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Found</h3>
                <p className="text-gray-600">
                  We found an account with this {verificationMethod === 'phone' ? 'phone number' : 'email'}.
                </p>
              </div>

              <button
                onClick={() => {
                  // Handle sign in logic here
                  handleClose();
                }}
                className="w-full bg-brand text-white py-4 rounded-lg font-medium hover:opacity-90 transition-colors"
                style={{ backgroundColor: '#FF6600' }}
              >
                Sign In
              </button>

              <button
                onClick={handleBack}
                className="w-full text-gray-600 hover:text-gray-800 transition-colors"
              >
                Use different {verificationMethod === 'phone' ? 'phone number' : 'email'}
              </button>
            </div>
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
  );
}