"use client";

import { useState, useEffect } from 'react';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';

interface DeleteAccountConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteAccountConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteAccountConfirmModalProps) {
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

  const handleConfirm = () => {
    // Close modal first (slide down), then call onConfirm
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      // Call confirm after modal closes to ensure clean state
      // Small delay ensures modal is fully unmounted before delete
      setTimeout(() => {
        onConfirm();
      }, 100);
    }, 300);
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
      {/* Backdrop - slight dim */}
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
          height: 'auto',
          minHeight: '200px',
          maxHeight: '50vh',
          // Match iOS screen corner radius (detected per device)
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
        {/* Content */}
        <div className="flex flex-col px-6 py-8">
          {/* Title */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Delete Account</h2>
          </div>
          
          {/* Message */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
