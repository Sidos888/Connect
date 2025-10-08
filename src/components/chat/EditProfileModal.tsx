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
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (personalProfile) {
      setName(personalProfile.name || '');
      setDob(personalProfile.dob || '');
      setProfilePic(personalProfile.avatarUrl || '');
    }
  }, [personalProfile]);

  const handleSave = async () => {
    if (!account?.id) return;

    setSaving(true);
    setError('');

    try {
      // Format name with proper capitalization
      const formattedName = name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          name: formattedName,
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
        name: formattedName,
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
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                {profilePic ? (
                  <img 
                    src={profilePic} 
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-medium text-3xl">
                    {name.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <label
                htmlFor="profile-pic"
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
                <input
                  id="profile-pic"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
              </label>
            </div>
            <button
              onClick={() => document.getElementById('profile-pic')?.click()}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              Change Photo
            </button>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter your name"
            />
          </div>

          {/* Date of Birth Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              value={dob ? new Date(dob).toISOString().split('T')[0] : ''}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
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
          disabled={saving || !name.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
