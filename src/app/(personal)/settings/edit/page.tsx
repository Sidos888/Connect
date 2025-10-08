"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useAppStore } from "@/lib/store";
import { ChevronLeftIcon } from "@/components/icons";
import { formatNameForDisplay } from "@/lib/utils";

export default function EditProfilePage() {
  const router = useRouter();
  const { account, updateProfile } = useAuth();
  const { personalProfile, setPersonalProfile } = useAppStore();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name || "");
      setBio(account.bio || "");
      setDob(account.dob || "");
      setAvatarUrl(account.profile_pic || "");
    }
  }, [account]);

  const handleSave = async () => {
    if (!account?.id) return;
    
    setLoading(true);
    try {
      // Update the account in the database
      const { error } = await updateProfile({
        name: formatNameForDisplay(name),
        bio,
        dob: dob || null
      });

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
        return;
      }

      // Update local state
      setPersonalProfile({
        ...personalProfile,
        name: formatNameForDisplay(name),
        bio,
        avatarUrl: avatarUrl || personalProfile?.avatarUrl
      });

      // Navigate back to settings
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-200">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Back to settings"
        >
          <span className="back-btn-circle">
            <ChevronLeftIcon className="h-5 w-5" />
          </span>
        </button>
        <h1 className="text-xl font-semibold text-gray-900 text-center flex-1">Edit Profile</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-medium text-3xl">
                  {name.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Tell us about yourself"
            />
          </div>

          {/* Date of Birth Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              value={dob ? new Date(dob).toISOString().split('T')[0] : ''}
              onChange={(e) => setDob(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-auto pt-6">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
