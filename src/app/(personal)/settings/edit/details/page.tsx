"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useAppStore } from "@/lib/store";
import { ChevronLeftIcon } from "@/components/icons";
import { formatNameForDisplay } from "@/lib/utils";
import ImagePicker from "@/components/ImagePicker";

export default function EditPersonalDetailsPage() {
  const router = useRouter();
  const { account, updateProfile, uploadAvatar } = useAuth();
  const { personalProfile, setPersonalProfile } = useAppStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Floating label states
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const dobRef = useRef<HTMLInputElement>(null);
  
  // Load current account data
  useEffect(() => {
    if (account) {
      const fullName = account.name || "";
      const nameParts = fullName.split(' ');
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(' ') || "");
      setBio(account.bio || "");
      setDob(account.dob || "");
      setAvatarUrl(account.profile_pic || "");
    }
  }, [account]);

  // Hide bottom nav on mobile
  useEffect(() => {
    const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
    if (bottomNav) {
      (bottomNav as HTMLElement).style.display = 'none';
      (bottomNav as HTMLElement).style.visibility = 'hidden';
      (bottomNav as HTMLElement).style.opacity = '0';
      (bottomNav as HTMLElement).style.transform = 'translateY(100%)';
    }
    document.body.style.paddingBottom = '0';
    return () => {
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
        (bottomNav as HTMLElement).style.visibility = '';
        (bottomNav as HTMLElement).style.opacity = '';
        (bottomNav as HTMLElement).style.transform = '';
      }
      document.body.style.paddingBottom = '';
    };
  }, []);

  const handleImageChange = (file: File | null, dataUrl: string | null) => {
    setProfilePictureFile(file);
    if (dataUrl) setAvatarUrl(dataUrl);
  };

  const handleSave = async () => {
    if (!account?.id) return;
    setLoading(true);
    try {
      // Upload profile picture if changed
      let finalAvatarUrl = avatarUrl;
      if (profilePictureFile && uploadAvatar) {
        const { url, error: uploadError } = await uploadAvatar(profilePictureFile);
        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          alert('Failed to upload profile picture. Please try again.');
          setLoading(false);
          return;
        }
        finalAvatarUrl = url || avatarUrl;
      }

      // Combine first and last name
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (!fullName) {
        alert('Please enter your name.');
        setLoading(false);
        return;
      }

      const { error } = await updateProfile({
        name: formatNameForDisplay(fullName),
        bio,
        dob: dob || null,
        profile_pic: finalAvatarUrl || null
      });

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
        return;
      }

      setPersonalProfile({
        ...personalProfile,
        name: formatNameForDisplay(fullName),
        bio,
        avatarUrl: finalAvatarUrl || personalProfile?.avatarUrl
      });

      router.back();
    } catch (e) {
      console.error('Error updating profile:', e);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col lg:max-w-2xl lg:mx-auto">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="relative w-full h-14 flex items-center justify-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '56px' }}>
          <button
            onClick={() => router.back()}
            className="absolute left-0 action-btn-circle"
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block', color: '#111827' }}>Personal Details</h1>
        </div>
      </div>

      {/* Content – Connect card style with sliding labels */}
      <div className="flex-1 flex flex-col px-4 py-4 lg:px-8 overflow-y-auto">
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center justify-center py-1">
            <ImagePicker onChange={handleImageChange} initialPreviewUrl={avatarUrl || null} shape="circle" size={120} />
          </div>

          {/* First/Last name with floating labels */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input
                ref={firstNameRef}
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onFocus={() => setFirstNameFocused(true)}
                onBlur={() => setFirstNameFocused(false)}
                placeholder=""
                className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-2xl focus:ring-0 focus:border-gray-500 focus:outline-none transition-all bg-white text-black ${(firstNameFocused || firstName) ? 'pt-6 pb-2' : 'py-5'}`}
                style={{ 
                  fontSize: '16px', 
                  lineHeight: '1.2', 
                  fontFamily: 'inherit',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 2px 6px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="words"
                required
              />
              {!firstNameFocused && !firstName && (
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">First Name</label>
              )}
              {(firstNameFocused || firstName) && (
                <label className="absolute left-4 text-xs text-gray-500 pointer-events-none transition-all" style={{ top: '6px' }}>First Name</label>
              )}
              {firstNameFocused && !firstName && (
                <div className="absolute left-4 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit', top: '26px' }}>Your first name</div>
              )}
            </div>

            <div className="relative">
              <input
                ref={lastNameRef}
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onFocus={() => setLastNameFocused(true)}
                onBlur={() => setLastNameFocused(false)}
                placeholder=""
                className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-2xl focus:ring-0 focus:border-gray-500 focus:outline-none transition-all bg-white text-black ${(lastNameFocused || lastName) ? 'pt-6 pb-2' : 'py-5'}`}
                style={{ 
                  fontSize: '16px', 
                  lineHeight: '1.2', 
                  fontFamily: 'inherit',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 2px 6px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="words"
                required
              />
              {!lastNameFocused && !lastName && (
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">Last Name</label>
              )}
              {(lastNameFocused || lastName) && (
                <label className="absolute left-4 text-xs text-gray-500 pointer-events-none transition-all" style={{ top: '6px' }}>Last Name</label>
              )}
              {lastNameFocused && !lastName && (
                <div className="absolute left-4 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit', top: '26px' }}>Your last name</div>
              )}
            </div>
          </div>

          {/* Bio with floating label */}
          <div className="relative">
            <textarea
              ref={bioRef}
              value={bio}
              onChange={(e) => { const v = e.target.value; if (v.length <= 150) setBio(v); }}
              onFocus={() => setBioFocused(true)}
              onBlur={() => setBioFocused(false)}
              placeholder=""
              rows={3}
              maxLength={150}
              className={`w-full pl-4 pr-4 border border-gray-300 rounded-2xl focus:ring-0 focus:border-gray-500 focus:outline-none transition-all bg-white resize-none text-black ${(bioFocused || bio) ? 'pt-6 pb-8' : 'py-3'}`}
              style={{ 
                fontSize: '16px', 
                lineHeight: '1.4', 
                fontFamily: 'inherit',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 2px 6px rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            />
            {!bioFocused && !bio && (
              <label className="absolute left-4 top-4 text-base text-gray-500 pointer-events-none">Bio</label>
            )}
            {(bioFocused || bio) && (
              <label className="absolute left-4 text-xs text-gray-500 pointer-events-none transition-all" style={{ top: '6px' }}>Bio</label>
            )}
            {bioFocused && !bio && (
              <div className="absolute left-4 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.4', fontFamily: 'inherit', top: '24px' }}>Tell us about yourself...</div>
            )}
            <div className="absolute bottom-2 right-3">
              <span className={`text-xs font-medium ${bio.length > 135 ? 'text-orange-600' : 'text-gray-500'}`}>{bio.length}/150</span>
            </div>
          </div>

          {/* DOB with floating label */}
          <div className="relative">
            <input
              ref={dobRef}
              type="text"
              value={dob ? new Date(dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : ''}
              onChange={(e) => {
                let value = e.target.value.replace(/[^0-9/]/g, '');
                const current = dob ? new Date(dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '';
                const isDeleting = value.length < current.length;
                if (!isDeleting) {
                  if (value.length === 2 && !value.includes('/')) value = value + '/';
                  else if (value.length === 5 && value.split('/').length === 2) value = value + '/';
                }
                if (value.length > 10) value = value.substring(0, 10);
                if (value.length === 10) {
                  const parts = value.split('/');
                  if (parts.length === 3) {
                    const [day, month, year] = parts;
                    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    setDob(iso);
                  }
                } else {
                  setDob('');
                }
              }}
              onFocus={() => setDobFocused(true)}
              onBlur={() => setDobFocused(false)}
              placeholder=""
              className={`w-full h-14 pl-4 pr-4 border border-gray-300 rounded-2xl focus:ring-0 focus:border-gray-500 focus:outline-none transition-all bg-white text-black ${(dobFocused || dob) ? 'pt-6 pb-2' : 'py-5'}`}
              style={{ 
                fontSize: '16px', 
                lineHeight: '1.2', 
                fontFamily: 'inherit',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 2px 6px rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              required
            />
            {!dobFocused && !dob && (
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">Date of birth</label>
            )}
            {(dobFocused || dob) && (
              <label className="absolute left-4 text-xs text-gray-500 pointer-events-none transition-all" style={{ top: '6px' }}>Date of birth</label>
            )}
            {dobFocused && !dob && (
              <div className="absolute left-4 text-gray-400 pointer-events-none" style={{ fontSize: '16px', lineHeight: '1.2', fontFamily: 'inherit', top: '26px' }}>DD/MM/YYYY</div>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="mt-auto pt-6 pb-4">
          <div className="flex justify-center">
            <button onClick={handleSave} disabled={loading || !firstName.trim() || !lastName.trim()} className="w-[42%] lg:w-[90%] px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

