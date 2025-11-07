"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useAuth } from "@/lib/authContext";
import { useAppStore } from "@/lib/store";
import { formatNameForDisplay } from "@/lib/utils";
import ImagePicker from "@/components/ImagePicker";

export interface EditPersonalDetailsRef {
  save: () => Promise<void>;
  hasChanges: boolean;
}

const EditPersonalDetails = forwardRef<EditPersonalDetailsRef, {
  onSaveComplete?: () => void;
  onSave?: () => Promise<void>;
  loading?: boolean;
}>(function EditPersonalDetails({ onSaveComplete, onSave, loading }, ref) {
  const { account, updateProfile, uploadAvatar } = useAuth();
  const { personalProfile, setPersonalProfile } = useAppStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading ?? internalLoading;
  
  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    dob: "",
    avatarUrl: ""
  });
  const [hasChanges, setHasChanges] = useState(false);
  
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
      const fName = nameParts[0] || "";
      const lName = nameParts.slice(1).join(' ') || "";
      const bioVal = account.bio || "";
      const dobVal = account.dob || "";
      const avatarVal = account.profile_pic || "";
      
      setFirstName(fName);
      setLastName(lName);
      setBio(bioVal);
      setDob(dobVal);
      setAvatarUrl(avatarVal);
      
      // Store original values
      setOriginalValues({
        firstName: fName,
        lastName: lName,
        bio: bioVal,
        dob: dobVal,
        avatarUrl: avatarVal
      });
    }
  }, [account]);

  // Check for changes
  useEffect(() => {
    const changed = 
      firstName !== originalValues.firstName ||
      lastName !== originalValues.lastName ||
      bio !== originalValues.bio ||
      dob !== originalValues.dob ||
      avatarUrl !== originalValues.avatarUrl ||
      profilePictureFile !== null;
    
    setHasChanges(changed);
  }, [firstName, lastName, bio, dob, avatarUrl, profilePictureFile, originalValues]);

  const handleImageChange = (file: File | null, dataUrl: string | null) => {
    setProfilePictureFile(file);
    // Only update avatarUrl with dataUrl for preview - don't use it for saving
    if (dataUrl) {
      setAvatarUrl(dataUrl);
    }
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave();
      return;
    }

    if (!account?.id) return;
    setInternalLoading(true);
    try {
      // Upload profile picture to Supabase Storage if changed
      let finalAvatarUrl = account.profile_pic; // Use existing URL if no change
      if (profilePictureFile && uploadAvatar) {
        console.log('📸 Uploading new profile picture to Supabase Storage...');
        const { url, error: uploadError } = await uploadAvatar(profilePictureFile);
        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          alert('Failed to upload profile picture. Please try again.');
          setInternalLoading(false);
          return;
        }
        finalAvatarUrl = url || account.profile_pic;
        console.log('✅ Profile picture uploaded:', finalAvatarUrl);
      }

      // Combine first and last name
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (!fullName) {
        alert('Please enter your name.');
        setInternalLoading(false);
        return;
      }

      console.log('💾 Preparing to save profile...');
      console.log('💾 Name:', formatNameForDisplay(fullName));
      console.log('💾 Bio:', bio);
      console.log('💾 DOB:', dob);
      console.log('💾 Avatar URL:', finalAvatarUrl);
      
      const { error } = await updateProfile({
        name: formatNameForDisplay(fullName),
        bio,
        dob: dob || null,
        profile_pic: finalAvatarUrl || null
      });

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
        setInternalLoading(false);
        return;
      }

      // Success! Update local store
      setPersonalProfile({
        ...personalProfile,
        name: formatNameForDisplay(fullName),
        bio,
        avatarUrl: finalAvatarUrl || personalProfile?.avatarUrl
      });

      console.log('✅ Profile updated successfully');
      
      // Always complete successfully if we get here
      setInternalLoading(false);

      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (e) {
      console.error('Error updating profile:', e);
      alert('Failed to update profile. Please try again.');
      setInternalLoading(false);
    }
  };

  // Expose save method and hasChanges via ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
    hasChanges
  }));

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" style={{
      paddingTop: 'var(--saved-content-padding-top, 104px)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
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
            {(firstNameFocused || firstName) && (
              <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
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
            {(lastNameFocused || lastName) && (
              <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
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
            rows={3}
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
          {(bioFocused || bio) && (
            <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
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
          {(dobFocused || dob) && (
            <label className="absolute left-4 top-1.5 text-xs text-gray-500 pointer-events-none">
              Date of Birth
            </label>
          )}
        </div>

        </div>
    </div>
  );
});

export default EditPersonalDetails;

