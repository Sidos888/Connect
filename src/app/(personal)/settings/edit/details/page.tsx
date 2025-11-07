"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useAppStore } from "@/lib/store";
import { formatNameForDisplay } from "@/lib/utils";
import ImagePicker from "@/components/ImagePicker";
import MobilePage from "@/components/layout/MobilePage";
import PageHeader from "@/components/layout/PageHeader";

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
    <MobilePage>
      <PageHeader 
        title="Personal Details"
        backButton
        backIcon="arrow"
        onBack={() => router.back()}
      />

      <div 
        className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide"
        style={{
          paddingTop: 'var(--saved-content-padding-top, 140px)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div className="space-y-6 max-w-screen-sm mx-auto">
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
                className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none transition-all bg-white text-black rounded-2xl ${(firstNameFocused || firstName) ? 'pt-6 pb-2' : 'py-5'}`}
                style={{ 
                  fontSize: '16px', 
                  lineHeight: '1.2', 
                  fontFamily: 'inherit',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  transform: firstNameFocused ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow: firstNameFocused
                    ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                    : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
                }}
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
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="words"
                required
              />
            {/* Floating label when focused or filled */}
            {(firstNameFocused || firstName) && (
              <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                First Name
              </label>
            )}
            {/* Default centered label when empty and unfocused */}
            {!firstNameFocused && !firstName && (
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                First Name
              </label>
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
                className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none transition-all bg-white text-black rounded-2xl ${(lastNameFocused || lastName) ? 'pt-6 pb-2' : 'py-5'}`}
                style={{ 
                  fontSize: '16px', 
                  lineHeight: '1.2', 
                  fontFamily: 'inherit',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  transform: lastNameFocused ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow: lastNameFocused
                    ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                    : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
                }}
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
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="words"
              />
              {/* Floating label when focused or filled */}
              {(lastNameFocused || lastName) && (
                <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                  Last Name
                </label>
              )}
              {/* Default centered label when empty and unfocused */}
              {!lastNameFocused && !lastName && (
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                  Last Name
                </label>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="relative">
            <textarea
              ref={bioRef}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={() => setBioFocused(true)}
              onBlur={() => setBioFocused(false)}
              placeholder=""
              maxLength={150}
              rows={4}
              className={`w-full pl-4 pr-16 focus:ring-0 focus:outline-none transition-all bg-white text-black resize-none rounded-2xl ${(bioFocused || bio) ? 'pt-6 pb-2' : 'py-5'}`}
              style={{ 
                fontSize: '16px', 
                lineHeight: '1.5', 
                fontFamily: 'inherit',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                transform: bioFocused ? 'translateY(-1px)' : 'translateY(0)',
                boxShadow: bioFocused
                  ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                  : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
              }}
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
              spellCheck={false}
            />
            {/* Floating label when focused or filled */}
            {(bioFocused || bio) && (
              <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                Bio
              </label>
            )}
            {/* Default centered label when empty and unfocused */}
            {!bioFocused && !bio && (
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                Bio
              </label>
            )}
            <div className="absolute bottom-2 right-2 pointer-events-none">
              <span className={`text-xs font-medium ${bio.length > 135 ? 'text-orange-600' : 'text-gray-500'}`}>
                {bio.length}/150
              </span>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="relative">
            <input
              ref={dobRef}
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              onFocus={() => setDobFocused(true)}
              onBlur={() => setDobFocused(false)}
              placeholder=""
              className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none transition-all bg-white text-black rounded-2xl ${(dobFocused || dob) ? 'pt-6 pb-2' : 'py-5'}`}
              style={{ 
                fontSize: '16px', 
                lineHeight: '1.2', 
                fontFamily: 'inherit',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                transform: dobFocused ? 'translateY(-1px)' : 'translateY(0)',
                boxShadow: dobFocused
                  ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                  : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
              }}
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
            />
            {/* Floating label when focused or filled */}
            {(dobFocused || dob) && (
              <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
                Date of Birth
              </label>
            )}
            {/* Default centered label when empty and unfocused */}
            {!dobFocused && !dob && (
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500 pointer-events-none">
                Date of Birth
              </label>
            )}
          </div>
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading || !firstName.trim()}
            className="w-full h-12 bg-brand text-white rounded-2xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#FF6600' }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </MobilePage>
  );
}

