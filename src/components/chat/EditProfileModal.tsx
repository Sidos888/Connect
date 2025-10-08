'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';
import Input from '@/components/Input';
import ImagePicker from '@/components/ImagePicker';

interface EditProfileModalProps {
  onBack: () => void;
  onSave?: () => void;
}

export default function EditProfileModal({ onBack, onSave }: EditProfileModalProps) {
  const { account } = useAuth();
  const { personalProfile, setPersonalProfile } = useAppStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  
  // Floating label states
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const dobRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (personalProfile) {
      const fullName = personalProfile.name || '';
      const nameParts = fullName.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setDob(personalProfile.dob || '');
      setProfilePic(personalProfile.avatarUrl || '');
    }
  }, [personalProfile]);

  const handleSave = async () => {
    if (!account?.id) return;

    setSaving(true);
    setError('');

    try {
      // Combine first and last name with proper capitalization
      const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
      const fullName = `${formattedFirstName} ${formattedLastName}`.trim();

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          name: fullName,
          dob: dob || null,
          profile_pic: profilePic || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError('Failed to update profile. Please try again.');
        return;
      }

      // Update local state
      setPersonalProfile({
        ...personalProfile,
        name: fullName,
        dob: dob,
        avatarUrl: profilePic
      });

      // Call onSave callback if provided
      if (onSave) {
        onSave();
      }

      // Go back to settings
      onBack();

    } catch (err) {
      console.error('Error saving profile:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, we'll just store the file name
      // In a real implementation, you'd upload to Supabase Storage
      setProfilePic(URL.createObjectURL(file));
    }
  };

  // Floating label handlers
  const handleFirstNameFocus = () => setFirstNameFocused(true);
  const handleFirstNameBlur = () => setFirstNameFocused(false);
  const handleLastNameFocus = () => setLastNameFocused(true);
  const handleLastNameBlur = () => setLastNameFocused(false);
  const handleDobFocus = () => setDobFocused(true);
  const handleDobBlur = () => setDobFocused(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <button
          onClick={onBack}
          className="back-btn-circle"
          aria-label="Back to settings"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>
          Edit Profile
        </h2>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Profile Picture Card - mirrors onboarding ImagePicker */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="max-w-sm mx-auto">
              <ImagePicker 
                label="Profile Photo" 
                initialPreviewUrl={profilePic || null}
                onChange={(_, url) => {
                  setProfilePic(url || '');
                  setShowPhotoUpload(false);
                }}
                size={96}
                shape="circle"
              />
            </div>
          </div>

          {/* First Name and Last Name - Side by Side */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="max-w-sm mx-auto">
              <div className="mb-3">
                <h3 className="text-lg font-medium text-gray-900">Name</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* First Name */}
                <div className="relative">
                  <input
                    ref={firstNameRef}
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onFocus={handleFirstNameFocus}
                    onBlur={handleFirstNameBlur}
                    placeholder=""
                    className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-500 focus:outline-none transition-colors bg-white ${(firstNameFocused || firstName) ? 'pt-5 pb-3' : 'py-5'} text-transparent`}
                    style={{ 
                      caretColor: 'black',
                      fontSize: '16px',
                      lineHeight: '1.2',
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                  
                  {/* Step 1: Initial state - only "First Name" label */}
                  {!firstNameFocused && !firstName && (
                    <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                      First Name
                    </label>
                  )}
                  
                  {/* Step 2: Focused state - label moves up, placeholder appears */}
                  {firstNameFocused && !firstName && (
                    <>
                      <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                        First Name
                      </label>
                      <div className="absolute left-4 top-6 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                        Your first name
                      </div>
                    </>
                  )}
                  
                  {/* Step 3: Typing state - actual name replaces placeholder */}
                  {firstName && (
                    <>
                      <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                        First Name
                      </label>
                      <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                        {firstName}
                      </div>
                    </>
                  )}
                </div>

                {/* Last Name */}
                <div className="relative">
                  <input
                    ref={lastNameRef}
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onFocus={handleLastNameFocus}
                    onBlur={handleLastNameBlur}
                    placeholder=""
                    className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-500 focus:outline-none transition-colors bg-white ${(lastNameFocused || lastName) ? 'pt-5 pb-3' : 'py-5'} text-transparent`}
                    style={{ 
                      caretColor: 'black',
                      fontSize: '16px',
                      lineHeight: '1.2',
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                  
                  {/* Step 1: Initial state - only "Last Name" label */}
                  {!lastNameFocused && !lastName && (
                    <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                      Last Name
                    </label>
                  )}
                  
                  {/* Step 2: Focused state - label moves up, placeholder appears */}
                  {lastNameFocused && !lastName && (
                    <>
                      <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                        Last Name
                      </label>
                      <div className="absolute left-4 top-6 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                        Your last name
                      </div>
                    </>
                  )}
                  
                  {/* Step 3: Typing state - actual name replaces placeholder */}
                  {lastName && (
                    <>
                      <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                        Last Name
                      </label>
                      <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                        {lastName}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Date of Birth Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="max-w-sm mx-auto">
              <div className="mb-3">
                <h3 className="text-lg font-medium text-gray-900">Date of Birth</h3>
                {dob && (
                  <p className="text-sm text-gray-600">Current: {new Date(dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                )}
              </div>
              <div className="relative">
                <input
                  ref={dobRef}
                  type="text"
                  value={dob ? new Date(dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : ''}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Only allow numbers and forward slashes
                    value = value.replace(/[^0-9/]/g, '');
                    
                    // Handle deletion - if user is deleting, don't auto-add slashes
                    const currentValue = dob ? new Date(dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '';
                    const isDeleting = value.length < currentValue.length;
                    
                    if (!isDeleting) {
                      // Auto-format as user types (only when adding characters)
                      if (value.length === 2 && !value.includes('/')) {
                        value = value + '/';
                      } else if (value.length === 5 && value.split('/').length === 2) {
                        value = value + '/';
                      }
                    }
                    
                    // Limit to DD/MM/YYYY format
                    if (value.length > 10) {
                      value = value.substring(0, 10);
                    }
                    
                    // Convert DD/MM/YYYY to YYYY-MM-DD for storage
                    if (value.length === 10) {
                      const parts = value.split('/');
                      if (parts.length === 3) {
                        const [day, month, year] = parts;
                        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        setDob(isoDate);
                      }
                    } else {
                      setDob('');
                    }
                  }}
                  onFocus={handleDobFocus}
                  onBlur={handleDobBlur}
                  placeholder=""
                  className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-500 focus:outline-none transition-colors bg-white ${(dobFocused || dob) ? 'pt-5 pb-3' : 'py-5'} text-transparent`}
                  style={{ 
                    caretColor: 'black',
                    fontSize: '16px',
                    lineHeight: '1.2',
                    fontFamily: 'inherit'
                  }}
                  required
                />
                
                {/* Step 1: Initial state - only "Date of birth" label */}
                {!dobFocused && !dob && (
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                    Date of birth
                  </label>
                )}
                
                {/* Step 2: Focused state - label moves up, DD/MM/YYYY appears */}
                {dobFocused && !dob && (
                  <>
                    <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                      Date of birth
                    </label>
                    {/* DD/MM/YYYY placeholder */}
                    <div className="absolute left-4 top-6 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                      DD/MM/YYYY
                    </div>
                  </>
                )}
                
                {/* Step 3: Typing state - actual date replaces placeholder */}
                {dob && (
                  <>
                    <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                      Date of birth
                    </label>
                    {/* Actual date content */}
                    <div className="absolute left-4 top-6 text-black pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit' }}>
                      {new Date(dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving || !firstName.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
