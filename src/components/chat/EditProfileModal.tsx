'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';

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
          {/* Profile Picture Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                {profilePic ? (
                  <img 
                    src={profilePic} 
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-medium text-3xl">
                    {firstName.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                className="text-black underline text-sm font-medium hover:text-gray-700"
              >
                Edit
              </button>
            </div>
            
            {/* Photo Upload Section */}
            {showPhotoUpload && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label
                  htmlFor="profile-pic"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700 font-medium">Choose Photo</span>
                  <input
                    id="profile-pic"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* First Name Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">First Name</h3>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-base"
                placeholder="Enter your first name"
              />
            </div>
          </div>

          {/* Last Name Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Last Name</h3>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-base"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          {/* Date of Birth Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Date of Birth</h3>
              {dob ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Current: {new Date(dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <input
                    type="date"
                    value={dob ? new Date(dob).toISOString().split('T')[0] : ''}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-base"
                  />
                </div>
              ) : (
                <input
                  type="date"
                  value={dob ? new Date(dob).toISOString().split('T')[0] : ''}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-base"
                />
              )}
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
