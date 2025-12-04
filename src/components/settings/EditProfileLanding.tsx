"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/authContext";
import { formatNameForDisplay } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import { PageHeader } from "@/components/layout/PageSystem";
import { Check, X, Lock } from "lucide-react";
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';

export default function EditProfileLanding({
  name,
  avatarUrl,
  onBack,
  onOpenLinks,
  onOpenPersonalDetails,
  onOpenTimeline,
  onOpenHighlights,
  backIcon = 'arrow'
}: {
  name?: string;
  avatarUrl?: string;
  onBack: () => void;
  onOpenLinks: () => void;
  onOpenPersonalDetails: () => void;
  onOpenTimeline: () => void;
  onOpenHighlights: () => void;
  backIcon?: 'arrow' | 'close';
}) {
  const { account, updateProfile, uploadAvatar } = useAuth();
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  
  // Change detection
  const [hasChanges, setHasChanges] = useState(false);
  
  // Floating label states
  const [nameFocused, setNameFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);
  
  // Modal states
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [visibilityModalVisible, setVisibilityModalVisible] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45);
  
  const nameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load initial data
  useEffect(() => {
    if (account) {
      setFullName(account.name || "");
      setBio(account.bio || "");
      setPreviewUrl(account.profile_pic || "");
      setIsPublic((account as any).profile_visibility === 'public');
    }
  }, [account]);
  
  // Detect changes
  useEffect(() => {
    const nameChanged = fullName.trim() !== (account?.name || "");
    const bioChanged = bio !== (account?.bio || "");
    const photoChanged = !!avatarFile;
    
    setHasChanges(nameChanged || bioChanged || photoChanged);
  }, [fullName, bio, avatarFile, account]);

  // Visibility modal animation
  useEffect(() => {
    if (showVisibilityModal) {
      setTimeout(() => setVisibilityModalVisible(true), 10);
    } else {
      setVisibilityModalVisible(false);
    }
  }, [showVisibilityModal]);

  // Detect device corner radius
  useEffect(() => {
    getDeviceCornerRadius().then(radius => {
      setCornerRadius(radius);
    });
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!account?.id || !hasChanges) return;
    
    setLoading(true);
    try {
      // Upload avatar if changed
      let finalAvatarUrl = previewUrl;
      if (avatarFile && uploadAvatar) {
        const { url, error: uploadError } = await uploadAvatar(avatarFile);
        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          alert('Failed to upload profile picture');
          setLoading(false);
          return;
        }
        finalAvatarUrl = url || previewUrl;
      }

      // Update profile
      const { error } = await updateProfile({
        name: formatNameForDisplay(fullName.trim()),
        bio: bio.trim(),
        profile_pic: finalAvatarUrl,
        profile_visibility: isPublic ? 'public' : 'private',
      });

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile');
      } else {
        // Reset change detection
        setAvatarFile(null);
        setHasChanges(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  return (
    <div 
      className="bg-white lg:rounded-3xl w-full lg:max-w-[680px] lg:w-[680px] h-full lg:h-[620px] overflow-hidden flex flex-col lg:shadow-2xl transform transition-all duration-300 ease-out scale-100 relative"
      style={{ '--saved-content-padding-top': isMobile ? '140px' : '104px' } as React.CSSProperties}
          >
      <PageHeader
        title="Edit Profile"
        backButton
        backIcon={backIcon}
        onBack={onBack}
        actions={hasChanges ? [
          {
            icon: (
              <div 
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: '#FF6B35',
                  boxShadow: '0 2px 8px rgba(255, 107, 53, 0.25), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Check size={20} strokeWidth={2.5} className="text-white" />
              </div>
            ),
            onClick: handleSave,
            label: "Save changes"
          }
        ] : undefined}
      />

      {/* Content */}
      <div className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide" style={{
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        paddingBottom: '32px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="max-w-md mx-auto" style={{ padding: '2px' }}>
        {/* Profile Photo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3">
            <Avatar 
              src={previewUrl || undefined} 
              name={fullName || 'User'} 
              size={96} 
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-gray-900"
          >
            Edit
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* General Section */}
        <h3 className="text-base font-semibold text-gray-900 mb-4">General</h3>

        {/* Name Input Card */}
        <div className="mb-4" style={{ padding: '2px' }}>
          <div
            className="relative bg-white rounded-2xl transition-all duration-200"
            style={{ 
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              transform: nameFocused ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: nameFocused 
                ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              if (!nameFocused) {
                e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!nameFocused) {
                e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
          >
            <label
              htmlFor="fullName"
              className="absolute left-4 transition-all duration-200 pointer-events-none"
              style={{
                top: nameFocused || fullName ? '10px' : '50%',
                transform: nameFocused || fullName ? 'translateY(0)' : 'translateY(-50%)',
                fontSize: nameFocused || fullName ? '11px' : '17px',
                color: '#9CA3AF',
                fontWeight: nameFocused || fullName ? 500 : 400,
              }}
            >
              Name
            </label>
            <input
              ref={nameRef}
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              className="w-full bg-transparent border-none outline-none px-4 text-gray-900"
              style={{
                paddingTop: fullName ? '28px' : '14px',
                paddingBottom: fullName ? '10px' : '14px',
                fontSize: '17px',
                height: '56px',
              }}
              autoCapitalize="words"
            />
          </div>
            </div>

        {/* Bio TextArea Card */}
        <div className="mb-4" style={{ padding: '2px' }}>
          <div
            className="relative bg-white rounded-2xl transition-all duration-200"
            style={{ 
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
          >
            <label
              htmlFor="bio"
              className="absolute left-4 transition-all duration-200 pointer-events-none"
              style={{
                top: bioFocused || bio ? '10px' : '50%',
                transform: bioFocused || bio ? 'translateY(0)' : 'translateY(-50%)',
                fontSize: bioFocused || bio ? '11px' : '17px',
                color: '#9CA3AF',
                fontWeight: bioFocused || bio ? 500 : 400,
              }}
            >
              Bio
            </label>
            <textarea
              ref={bioRef}
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={() => setBioFocused(true)}
              onBlur={() => setBioFocused(false)}
              rows={3}
              className="w-full bg-transparent border-none outline-none px-4 text-gray-900 resize-none edit-profile-bio"
              style={{
                paddingTop: bio ? '28px' : '14px',
                paddingBottom: '10px',
                fontSize: '17px',
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Visibility Card - Clickable */}
          <button
          onClick={() => setShowVisibilityModal(true)}
          className="w-full bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] px-5 py-4 mb-8 flex items-center justify-between transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
          <span className="text-sm font-medium text-gray-900">Visibility</span>
          <span className="text-sm text-gray-400">{isPublic ? 'Public' : 'Private'}</span>
          </button>

        {/* Separator Line */}
        <div className="h-[0.4px] bg-gray-300 mb-8" style={{ marginTop: '32px' }} />

        {/* Links Placeholder */}
        <div
          className="bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] px-5 py-4 mb-3 flex items-center justify-between"
            style={{ 
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">Links</span>
            <span className="text-sm text-gray-400">1</span>
          </div>
          <div className="w-6 h-6 rounded border-[0.4px] border-gray-300" />
        </div>

        {/* Life Placeholder */}
        <div
          className="bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] px-5 py-4 mb-3 flex items-center justify-between"
          style={{
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">Life</span>
            <span className="text-sm text-gray-400">4</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-6 h-6 rounded border-[0.4px] border-gray-300" />
            ))}
          </div>
        </div>

        {/* Highlights Placeholder */}
        <div
          className="bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] px-5 py-4 mb-3 flex items-center justify-between"
          style={{
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">Highlights</span>
            <span className="text-sm text-gray-400">4</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-6 h-6 rounded border-[0.4px] border-gray-300" />
            ))}
          </div>
            </div>
        </div>
      </div>

      {/* Bottom Blur */}
      <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
        <div className="absolute bottom-0 left-0 right-0" style={{
          height: '80px',
          background: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0) 100%)'
        }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '20px', backdropFilter: 'blur(0.5px)', WebkitBackdropFilter: 'blur(0.5px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '20px', height: '20px', backdropFilter: 'blur(0.3px)', WebkitBackdropFilter: 'blur(0.3px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '40px', height: '20px', backdropFilter: 'blur(0.15px)', WebkitBackdropFilter: 'blur(0.15px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '60px', height: '20px', backdropFilter: 'blur(0.05px)', WebkitBackdropFilter: 'blur(0.05px)' }} />
      </div>

      {/* Visibility Modal - Exact match to Account modal */}
      {showVisibilityModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVisibilityModal(false);
            }
          }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 transition-opacity duration-300 ease-out"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              opacity: visibilityModalVisible ? 1 : 0
            }}
            onClick={() => setShowVisibilityModal(false)}
          />
          
          {/* Modal */}
          <div 
            className="relative bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'calc(100% - 16px)',
              maxWidth: '500px',
              marginTop: '20px',
              marginBottom: '8px',
              height: '50vh',
              borderTopLeftRadius: `${cornerRadius}px`,
              borderTopRightRadius: `${cornerRadius}px`,
              borderBottomLeftRadius: `${cornerRadius}px`,
              borderBottomRightRadius: `${cornerRadius}px`,
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              transform: visibilityModalVisible ? 'translateY(0)' : 'translateY(100%)',
            }}
          >
            {/* Header - Exact match to ProfileModal */}
            <div className="relative flex items-center justify-center" style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px', minHeight: '60px' }}>
              <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>Visibility</h2>
              <button
                onClick={() => setShowVisibilityModal(false)}
                className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  right: '24px',
                  top: '24px',
                  width: '44px',
                  height: '44px',
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
              >
                <X size={20} className="text-gray-900" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 flex-1 overflow-y-auto scrollbar-hide"
              style={{
                paddingTop: 'calc(32px * 1.3)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {/* Public Option */}
              <button
                onClick={() => {
                  setIsPublic(true);
                }}
                className="w-full text-left p-4 rounded-xl mb-3 transition-all bg-white hover:bg-gray-50"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isPublic ? 'border-[#FF6600] bg-[#FF6600]' : 'border-gray-300 bg-white'
                  }`}
                  style={{
                    borderWidth: '2px',
                  }}
                  >
                    {isPublic && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 mb-1">
                      <div className="flex items-center gap-2">
                        <span>Public</span>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 10H18M10 2C11.3132 4.57536 12.0156 7.41233 12 10.25C12.0156 13.0877 11.3132 15.9246 10 18.5C8.6868 15.9246 7.98438 13.0877 8 10.25C7.98438 7.41233 8.6868 4.57536 10 2Z" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    <div className="text-sm font-normal text-gray-600 leading-relaxed">
                      Visible to everyone on Connect
                    </div>
                  </div>
                  {/* Profile text on the right */}
                  <div className="flex-shrink-0 ml-2 flex items-center">
                    <span className="text-sm font-medium text-gray-500">Profile</span>
                  </div>
                </div>
              </button>

              {/* Private Option */}
              <button
                onClick={() => {
                  setIsPublic(false);
                }}
                className="w-full text-left p-4 rounded-xl transition-all bg-white hover:bg-gray-50"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    !isPublic ? 'border-[#FF6600] bg-[#FF6600]' : 'border-gray-300 bg-white'
                  }`}
                  style={{
                    borderWidth: '2px',
                  }}
                  >
                    {!isPublic && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 mb-1">
                      <div className="flex items-center gap-2">
                        <span>Private</span>
                        <Lock size={16} className="text-gray-900" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="text-sm font-normal text-gray-600 leading-relaxed">
                      Only visible to your friends
                    </div>
                  </div>
                  {/* Profile text on the right */}
                  <div className="flex-shrink-0 ml-2 flex items-center">
                    <span className="text-sm font-medium text-gray-500">Profile</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 flex items-center justify-center">
              <button
                onClick={() => setShowVisibilityModal(false)}
                className="text-base font-semibold transition-colors flex items-center justify-center"
                style={{
                  width: '120px',
                  height: '40px',
                  borderRadius: '100px',
                  backgroundColor: '#FF6600',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E55A00';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF6600';
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
