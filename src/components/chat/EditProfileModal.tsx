'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, ChevronLeft } from 'lucide-react';
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
  const { account, uploadAvatar } = useAuth();
  const { personalProfile, setPersonalProfile } = useAppStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  
  // Floating label states
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const dobRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (personalProfile || account) {
      const fullName = personalProfile.name || '';
      const nameParts = fullName.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      // Support both dob (accounts table), dateOfBirth (local), or account.dob
      setDob(
        (personalProfile as any)?.dob ||
        (personalProfile as any)?.dateOfBirth ||
        (account as any)?.dob ||
        ''
      );
      setBio((personalProfile as any)?.bio || (account as any)?.bio || '');
      // Support both avatarUrl (local), profile_pic (db), or account.profile_pic
      setProfilePic(
        (personalProfile as any)?.avatarUrl ||
        (personalProfile as any)?.profile_pic ||
        (account as any)?.profile_pic ||
        ''
      );
    }
  }, [personalProfile, account]);

  const handleSave = async () => {
    if (!account?.id) return;

    setSaving(true);
    setError('');

    try {
      // Combine first and last name with proper capitalization
      const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
      const fullName = `${formattedFirstName} ${formattedLastName}`.trim();

      // Upload profile picture to Supabase storage if a new file was selected
      let avatarUrl = profilePic; // Keep existing URL by default
      if (profilePicFile && uploadAvatar) {
        const { url, error: uploadError } = await uploadAvatar(profilePicFile);
        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          setError('Failed to upload profile picture. Please try again.');
          return;
        }
        avatarUrl = url || profilePic;
      }

      // Update profile in Supabase with the new avatar URL
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          name: fullName,
          dob: dob || null,
          bio: bio || null,
          profile_pic: avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError('Failed to update profile. Please try again.');
        return;
      }

      // Update local state (use the uploaded URL, not base64)
      setPersonalProfile({
        ...personalProfile,
        name: fullName,
        dateOfBirth: dob,
        dob: dob as any,
        bio: bio,
        avatarUrl: avatarUrl,
        profile_pic: avatarUrl as any,
      } as any);

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
      // Store the file for upload when saving
      setProfilePicFile(file);
      // Create a local preview URL
      setProfilePic(URL.createObjectURL(file));
    }
  };

  // Floating label handlers
  const handleFirstNameFocus = () => setFirstNameFocused(true);
  const handleFirstNameBlur = () => setFirstNameFocused(false);
  const handleLastNameFocus = () => setLastNameFocused(true);
  const handleLastNameBlur = () => setLastNameFocused(false);
  const handleBioFocus = () => setBioFocused(true);
  const handleBioBlur = () => setBioFocused(false);
  const handleDobFocus = () => setDobFocused(true);
  const handleDobBlur = () => setDobFocused(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:-translate-y-[1px]"
          style={{
            width: '40px',
            height: '40px',
            minWidth: '40px',
            minHeight: '40px',
            borderRadius: '100px',
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
          aria-label="Back to settings"
        >
          <ChevronLeft size={20} className="text-gray-900" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>
          Edit Personal Profile
        </h2>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-4 pb-6 overflow-y-auto">
        <div className="space-y-4">
          {/* 1. Profile Picture Section */}
          <div className="flex justify-center">
            <ImagePicker 
              initialPreviewUrl={profilePic || null}
              onChange={(_, url) => {
                setProfilePic(url || '');
                setShowPhotoUpload(false);
              }}
              size={96}
              shape="circle"
            />
          </div>

          {/* 2. First Name and Last Name - Side by Side */}
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
                onMouseEnter={(e) => {
                  if (!firstNameFocused) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!firstNameFocused) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }
                }}
                placeholder=""
                className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none bg-white rounded-lg transition-all duration-200 ${(firstNameFocused || firstName) ? 'pt-6 pb-2' : 'py-5'} text-black`}
                style={{ 
                  caretColor: 'black',
                  fontSize: '16px',
                  lineHeight: '1.2',
                  fontFamily: 'inherit',
                  border: '0.4px solid #E5E7EB',
                  borderRadius: '12px',
                  transform: firstNameFocused ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow: firstNameFocused 
                    ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                    : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
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
                  <div className="absolute left-4 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit', top: '26px' }}>
                    Your first name
                  </div>
                </>
              )}
              
              {/* Step 3: Typing state - label stays up */}
              {firstName && (
                  <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                    First Name
                  </label>
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
                onMouseEnter={(e) => {
                  if (!lastNameFocused) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!lastNameFocused) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }
                }}
                placeholder=""
                className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none bg-white rounded-lg transition-all duration-200 ${(lastNameFocused || lastName) ? 'pt-6 pb-2' : 'py-5'} text-black`}
                style={{ 
                  caretColor: 'black',
                  fontSize: '16px',
                  lineHeight: '1.2',
                  fontFamily: 'inherit',
                  border: '0.4px solid #E5E7EB',
                  borderRadius: '12px',
                  transform: lastNameFocused ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow: lastNameFocused 
                    ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                    : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
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
                  <div className="absolute left-4 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit', top: '26px' }}>
                    Your last name
                  </div>
                </>
              )}
              
              {/* Step 3: Typing state - label stays up */}
              {lastName && (
                  <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                    Last Name
                  </label>
              )}
            </div>
          </div>

          {/* 3. Bio Section with Floating Label */}
          <div className="relative">
            <textarea
              ref={bioRef}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={handleBioFocus}
              onBlur={handleBioBlur}
              onMouseEnter={(e) => {
                if (!bioFocused) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (!bioFocused) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }
              }}
              placeholder=""
              rows={3}
              maxLength={150}
              className={`w-full pl-4 pr-4 focus:ring-0 focus:outline-none bg-white rounded-lg transition-all duration-200 resize-none text-black ${(bioFocused || bio) ? 'pt-6 pb-2' : 'py-3'}`}
              style={{ 
                caretColor: 'black',
                fontSize: '16px',
                lineHeight: '1.4',
                fontFamily: 'inherit',
                border: '0.4px solid #E5E7EB',
                borderRadius: '12px',
                transform: bioFocused ? 'translateY(-1px)' : 'translateY(0)',
                boxShadow: bioFocused 
                  ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                  : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
              }}
            />
            
            {/* Step 1: Initial state - only "Bio" label */}
            {!bioFocused && !bio && (
              <label className="absolute left-4 top-4 text-base text-gray-500 pointer-events-none">
                Bio
              </label>
            )}
            
            {/* Step 2: Focused state - label moves up, placeholder appears */}
            {bioFocused && !bio && (
              <>
                  <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                  Bio
                </label>
                  <div className="absolute left-4 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.4', fontFamily: 'inherit', top: '24px' }}>
                  Tell us about yourself...
                </div>
              </>
            )}
            
              {/* Step 3: Typing state - label stays up */}
            {bio && (
                <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                  Bio
                </label>
            )}
            
            {/* Character counter */}
            <div className="absolute bottom-2 right-3">
              <span className={`text-xs font-medium ${bio.length > 135 ? 'text-orange-600' : 'text-gray-500'}`}>
                {bio.length}/150
              </span>
            </div>
          </div>

          {/* 4. Date of Birth Section */}
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
              onMouseEnter={(e) => {
                if (!dobFocused) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (!dobFocused) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }
              }}
              placeholder=""
              className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none bg-white rounded-lg transition-all duration-200 ${(dobFocused || dob) ? 'pt-6 pb-2' : 'py-5'} text-black`}
              style={{ 
                caretColor: 'black',
                fontSize: '16px',
                lineHeight: '1.2',
                fontFamily: 'inherit',
                border: '0.4px solid #E5E7EB',
                borderRadius: '12px',
                transform: dobFocused ? 'translateY(-1px)' : 'translateY(0)',
                boxShadow: dobFocused 
                  ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                  : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
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
                  <div className="absolute left-4 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit', top: '26px' }}>
                  DD/MM/YYYY
                </div>
              </>
            )}
            
            {/* Step 3: Typing state - label stays up */}
            {dob && (
                <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                  Date of birth
                </label>
            )}
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
      <div className="p-6">
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving || !firstName.trim()}
            className="px-8 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}