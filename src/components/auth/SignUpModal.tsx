"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { XMarkIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function SignUpModal({ isOpen, onClose, onSwitchToLogin }: SignUpModalProps) {
  const [step, setStep] = useState<'input' | 'verify' | 'account-found' | 'profile'>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'phone' | 'email'>('phone');
  const [isNewUser, setIsNewUser] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const { signUp, updateProfile, sendPhoneVerification, sendEmailVerification, verifyPhoneCode, verifyEmailCode, checkUserExists } = useAuth();

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
      const fullPhoneNumber = `+61${phoneNumber.replace(/\s/g, '')}`;
      console.log('Original phoneNumber:', phoneNumber);
      console.log('Formatted fullPhoneNumber:', fullPhoneNumber);
      
      const { error } = await sendPhoneVerification(fullPhoneNumber);
      
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setStep('verify');
        setVerificationMethod('phone');
        setLoading(false);
      }
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
      console.log('Verifying code:', verificationCode, 'for method:', verificationMethod);
      
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
      
      // Check if user already exists
      const phoneOrEmail = verificationMethod === 'phone' ? phoneNumber : email;
      const { exists } = await checkUserExists(
        verificationMethod === 'phone' ? phoneOrEmail : undefined,
        verificationMethod === 'email' ? phoneOrEmail : undefined
      );
      
      console.log('User exists check result:', exists);
      
      if (exists) {
        setStep('account-found');
      } else {
        setIsNewUser(true);
        setShowProfileSetup(true);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Invalid verification code');
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await sendEmailVerification(email);
    
    if (error) {
      setError(error.message);
    } else {
      setStep('verify');
      setVerificationMethod('email');
    }
    
    setLoading(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await updateProfile(name, avatarUrl || undefined);
    
    if (error) {
      setError(error.message);
    } else {
      onClose();
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    setStep('input');
    setPhoneNumber('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setName('');
    setAvatarUrl('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Dark backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex flex-col justify-end md:flex md:items-center md:justify-center md:p-4 z-50">
        <div className="w-full bg-white rounded-t-3xl md:rounded-2xl md:shadow-2xl md:max-w-md md:overflow-y-auto h-[85vh] md:h-auto pt-12 md:pt-0">
          <div className="md:max-h-[60vh] md:overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-center p-6 border-b border-gray-200 relative">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'input' ? 'Log in or sign up' : step === 'verify' ? 'Enter verification code' : 'Create your profile'}
          </h2>
          <button
            onClick={handleClose}
            className="absolute right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pb-12">
          {step === 'input' && (
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
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter verification code</h3>
                <p className="text-sm text-gray-600">
                  We sent a 6-digit code to {verificationMethod === 'phone' ? phoneNumber : email}
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
                Change {verificationMethod === 'phone' ? 'phone number' : 'email'}
              </button>
            </div>
          )}

          {step === 'account-found' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Found</h3>
                <p className="text-sm text-gray-600">
                  We found an existing account with this {verificationMethod === 'phone' ? 'phone number' : 'email'}
                </p>
              </div>

              <button
                onClick={onSwitchToLogin}
                className="w-full bg-brand text-white py-4 px-4 rounded-lg font-medium hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors text-base"
              >
                Sign In
              </button>

              <button
                onClick={() => setStep('input')}
                className="w-full text-sm text-gray-600 hover:text-gray-900 py-2"
              >
                Use different {verificationMethod === 'phone' ? 'phone number' : 'email'}
              </button>
            </div>
          )}

          {/* Sign Up Options - Only show on input step */}
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

              {/* Email Sign Up Option */}
              <div>
                <button 
                  onClick={() => {
                    // Handle email verification
                    const emailInput = prompt('Enter your email:');
                    if (emailInput) {
                      setEmail(emailInput);
                      handleEmailSubmit({ preventDefault: () => {} } as React.FormEvent);
                    }
                  }}
                  className="w-full flex items-center justify-center px-4 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-base"
                >
                  <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-600" />
                  Continue with Email
                </button>
              </div>

              {/* Switch to Login */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={onSwitchToLogin}
                    className="text-brand hover:text-brand/80 font-medium"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </>
          )}


          {step === 'profile' && (
            <>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Name Input */}
                <div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-base"
                    placeholder="Full Name"
                    required
                  />
                </div>

                {/* Avatar URL Input */}
                <div>
                  <input
                    id="avatarUrl"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-base"
                    placeholder="Profile Photo URL (optional)"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand text-white py-4 px-4 rounded-lg font-medium hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
                >
                  {loading ? 'Creating profile...' : 'Complete signup'}
                </button>
              </form>
            </>
          )}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
