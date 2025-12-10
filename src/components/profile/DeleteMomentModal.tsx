"use client";

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';

interface DeleteMomentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  momentTitle?: string;
}

export default function DeleteMomentModal({
  isOpen,
  onClose,
  onConfirm,
  momentTitle,
}: DeleteMomentModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }
  }, [isOpen]);

  // Detect device corner radius on mount
  useEffect(() => {
    getDeviceCornerRadius().then(radius => {
      setCornerRadius(radius);
    });
  }, []);

  // Handle close
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Handle confirm delete
  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center pointer-events-none"
      style={{
        pointerEvents: shouldRender ? 'auto' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-300 ease-out"
        style={{
          opacity: isVisible ? 0.5 : 0,
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: 'calc(100% - 16px)',
          maxWidth: '500px',
          marginTop: '20px',
          marginBottom: '8px',
          height: 'auto',
          minHeight: '200px',
          borderTopLeftRadius: `${cornerRadius}px`,
          borderTopRightRadius: `${cornerRadius}px`,
          borderBottomLeftRadius: `${cornerRadius}px`,
          borderBottomRightRadius: `${cornerRadius}px`,
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          pointerEvents: 'auto'
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center" style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px', minHeight: '60px' }}>
          <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>Delete Moment</h2>
          <button
            onClick={handleClose}
            className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              right: '24px',
              top: '24px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
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
            <X size={18} className="text-gray-900" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col px-6 pb-6">
          {/* Confirmation Text */}
          <div className="flex-1 flex items-center justify-center" style={{ minHeight: '80px', paddingTop: '16px', paddingBottom: '16px' }}>
            <p className="text-base text-gray-900 text-center">
              Are you sure you want to delete this moment{momentTitle ? ` "${momentTitle}"` : ''}? This action cannot be undone.
            </p>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="w-full rounded-xl transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              padding: '16px',
              background: '#EF4444',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
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
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}





