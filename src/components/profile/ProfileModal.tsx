"use client";

import { useState, useEffect } from 'react';
import { X, QrCode, Plus } from 'lucide-react';
import ProfileCard from '@/components/profile/ProfileCard';
import { useRouter } from 'next/navigation';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  avatarUrl?: string | null;
  onViewProfile: () => void;
  onShareProfile: () => void;
  onAddBusiness?: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  name,
  avatarUrl,
  onViewProfile,
  onShareProfile,
  onAddBusiness
}: ProfileModalProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45); // Default to 45px

  useEffect(() => {
    if (isOpen) {
      // Mount modal and trigger slide-up animation
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      // Trigger slide-down animation before unmounting
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match transition duration
    }
  }, [isOpen]);

  // Detect device corner radius on mount
  useEffect(() => {
    getDeviceCornerRadius().then(radius => {
      setCornerRadius(radius);
    });
  }, []);

  if (!shouldRender) return null;

  const handleClose = () => {
    // Trigger slide-down animation
    setIsVisible(false);
    // Close modal after animation completes
    setTimeout(() => {
      onClose();
    }, 300); // Match transition duration
  };

  const handleProfileCardClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Navigate immediately (like Add Business does)
    onViewProfile();
    // Then close modal with slide-down animation
    handleClose();
  };

  const handleQrCodeClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Navigate immediately (like Add Business does)
    onShareProfile();
    // Then close modal with slide-down animation
    handleClose();
  };

  const handleAddBusiness = () => {
    if (onAddBusiness) {
      onAddBusiness();
    } else {
      router.push('/create-business');
    }
    // Then close modal with slide-down animation
    handleClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      onClick={(e) => {
        // Close modal if clicking anywhere outside the modal content
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Backdrop - slight dim, no blur */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isVisible ? 1 : 0
        }}
        onClick={handleClose}
      />
      
      {/* Modal - slides up from bottom */}
      <div 
        className="relative bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
        onClick={(e) => {
          // Prevent clicks inside modal from closing it
          e.stopPropagation();
        }}
        style={{
          width: 'calc(100% - 16px)',
          maxWidth: '500px',
          marginTop: '20px',
          marginBottom: '8px',
          height: '50vh',
          // Match iOS screen corner radius (detected per device)
          // This ensures even spacing from screen edges
          borderTopLeftRadius: `${cornerRadius}px`,
          borderTopRightRadius: `${cornerRadius}px`,
          borderBottomLeftRadius: `${cornerRadius}px`,
          borderBottomRightRadius: `${cornerRadius}px`,
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center" style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px', minHeight: '60px' }}>
          <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>Account</h2>
          <button
            onClick={handleClose}
            className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              right: '24px', // Match modal side padding
              top: '24px', // Match modal top padding
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
            <X size={20} className="text-gray-900" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 flex-1 flex flex-col justify-start"
          style={{
            paddingTop: '32px',
          }}
        >
          <div className="w-full max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
            <ProfileCard
              name={name}
              avatarUrl={avatarUrl}
              onClick={() => handleProfileCardClick()}
              onViewProfile={onViewProfile}
              onEditProfile={() => {}}
              avatarSize={40}
              customActionIcon={QrCode}
              onCustomAction={() => handleQrCodeClick()}
            />
          </div>

          {/* Spacing before separator */}
          <div style={{ height: '20px' }} />

          {/* Separator */}
          <div className="w-full max-w-sm mx-auto" style={{ height: '1px', backgroundColor: '#E5E7EB' }} />

          {/* Spacing after separator */}
          <div style={{ height: '20px' }} />

          {/* Add Business Card */}
          <button
            onClick={handleAddBusiness}
            className="w-full max-w-sm mx-auto rounded-2xl bg-white transition-all duration-200 hover:-translate-y-[1px] flex items-center justify-between px-5 py-4"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow',
              minHeight: '72px' // Match ProfileCard height (40px avatar + 16px top padding + 16px bottom padding)
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            <span className="text-base font-semibold text-gray-900">Add Business</span>
            <Plus size={20} className="text-gray-900" />
          </button>
        </div>
      </div>
    </div>
  );
}

