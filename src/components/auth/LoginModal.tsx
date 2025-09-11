"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { XMarkIcon, DevicePhoneMobileIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToSignUp }: LoginModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const { signIn } = useAuth();

  // Format phone number as user types (Australia +61) - 3-3-3 format
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 3) return phoneNumber;
    if (phoneNumberLength < 6) {
      return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`;
    }
    if (phoneNumberLength < 9) {
      return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
    }
    return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 9)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual SMS sending
      console.log('Sending verification code to:', phoneNumber);
      // For now, just simulate sending
      setTimeout(() => {
        setStep('verify');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to send verification code');
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual verification and account lookup
      console.log('Verifying code:', verificationCode, 'for phone:', phoneNumber);
      // For now, just simulate verification
      setTimeout(() => {
        // TODO: Check if account exists, if not redirect to signup
        onClose();
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Invalid verification code');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      onClose();
    }
    
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ height: '100dvh', width: '100vw', position: 'fixed', top: 0, left: 0 }}>
      {/* Dark backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ height: '100dvh', width: '100vw', position: 'fixed', top: 0, left: 0 }}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex flex-col justify-end md:flex md:items-center md:justify-center md:p-4 z-50" style={{ height: '100dvh', width: '100vw', position: 'fixed', top: 0, left: 0 }}>
        <div className="w-full bg-white rounded-t-3xl md:rounded-2xl md:shadow-2xl md:max-w-lg md:overflow-y-auto h-full md:h-auto" style={{ height: '100dvh', minHeight: '100dvh' }}>
        {/* Header */}
        <div className="flex items-center justify-center p-6 border-b border-gray-200 relative">
          <h2 className="text-xl font-semibold text-gray-900">Log in or sign up</h2>
          <button
            onClick={onClose}
            className="absolute right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pb-12">
          {step === 'input' ? (
            <div className="space-y-4">
              {/* Mobile Input */}
              <div className="flex focus-within:ring-2 focus-within:ring-black focus-within:border-black border border-gray-300 rounded-lg">
                {/* Country Code Card */}
                <div className="flex items-center px-4 py-4 border-r border-gray-300 rounded-l-lg bg-gray-50 text-gray-700 font-medium">
                  +61
                </div>
                {/* Phone Number Input */}
                <div className="relative flex-1">
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="w-full px-4 py-4 border-0 rounded-r-lg focus:outline-none text-base"
                    placeholder="4XX XXX XXX"
                    maxLength={11}
                  />
                  <DevicePhoneMobileIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Send Code Button */}
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="w-full bg-brand text-white py-4 px-4 rounded-lg font-medium hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
              >
                {loading ? 'Sending code...' : 'Send verification code'}
              </button>
            </div>
          ) : (
            // Verification Code Step
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter verification code</h3>
                <p className="text-sm text-gray-600">
                  We sent a 6-digit code to {phoneNumber}
                </p>
              </div>

              <div>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-base text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Verify Button */}
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-brand text-white py-4 px-4 rounded-lg font-medium hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
              >
                {loading ? 'Verifying...' : 'Verify code'}
              </button>

              {/* Resend Code */}
              <button
                type="button"
                onClick={() => setStep('input')}
                className="w-full text-sm text-gray-600 hover:text-gray-900 py-2"
              >
                Change phone number
              </button>
            </div>
          )}

          {/* Login Options - Only show on input step */}
          {step === 'input' && (
            <>
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Login Options */}
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    // Handle email login
                    const emailInput = prompt('Enter your email:');
                    if (emailInput) {
                      setEmail(emailInput);
                      // For now, just show password input
                      const passwordInput = prompt('Enter your password:');
                      if (passwordInput) {
                        setPassword(passwordInput);
                        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                      }
                    }
                  }}
                  className="w-full flex items-center justify-center px-4 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-base"
                >
                  <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-600" />
                  Continue with Email
                </button>

                <button className="w-full flex items-center justify-center px-4 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-base">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <button className="w-full flex items-center justify-center px-4 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-base">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2.026-.156-3.91 1.183-4.961 3.014z"/>
                  </svg>
                  Continue with Apple
                </button>
              </div>

              {/* Switch to Sign Up */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={onSwitchToSignUp}
                    className="text-brand hover:text-brand/80 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
