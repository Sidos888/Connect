"use client";

import { useState, useEffect, useRef } from 'react';
import { X, UserMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import { useAuth } from '@/lib/authContext';
import { connectionsService } from '@/lib/connectionsService';

interface RemoveFriendSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userId?: string;
  chatId?: string;
  onRemoveSuccess?: () => void; // Optional callback when friend is successfully removed
}

export default function RemoveFriendSlideModal({
  isOpen,
  onClose,
  userName,
  userId,
  chatId,
  onRemoveSuccess,
}: RemoveFriendSlideModalProps) {
  const router = useRouter();
  const { account } = useAuth();
  const queryClient = useQueryClient();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // Two-step confirmation
  const [cornerRadius, setCornerRadius] = useState<number>(45);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('🔵 RemoveFriendSlideModal: isOpen changed to:', isOpen, 'userName:', userName, 'userId:', userId);
    if (isOpen) {
      console.log('🔵 RemoveFriendSlideModal: Opening modal, userName:', userName, 'userId:', userId);
      setShouldRender(true);
      setShowConfirm(false); // Reset confirm state when opening
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setShowConfirm(false); // Reset confirm state when closing
      setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }
  }, [isOpen, userName, userId]);

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

  // Handle remove friend
  const handleRemoveFriend = async () => {
    if (!account?.id || !userId || isRemoving) return;

    setIsRemoving(true);
    try {
      console.log('Removing friend connection between', account.id, 'and', userId);
      
      // Remove the friend connection
      const { error: removeError } = await connectionsService.removeFriend(account.id, userId);
      
      if (removeError) {
        console.error('Error removing friend connection:', removeError);
        alert('Failed to remove friend. Please try again.');
        setIsRemoving(false);
        return;
      }

      console.log('Friend removed successfully');
      
      // Invalidate React Query caches to refresh connections and chats
      console.log('Invalidating React Query caches...');
      await queryClient.invalidateQueries({ queryKey: ['connections', account.id] });
      await queryClient.invalidateQueries({ queryKey: ['chats', 'list'] });
      await queryClient.invalidateQueries({ queryKey: ['chats'] });
      // Invalidate suggested-friends so they can be added back
      await queryClient.invalidateQueries({ queryKey: ['suggested-friends', account.id] });
      // Invalidate friend-requests to refresh any pending requests
      await queryClient.invalidateQueries({ queryKey: ['friend-requests', account.id] });
      // Invalidate connection status queries
      await queryClient.invalidateQueries({ queryKey: ['connection-status'] });
      console.log('Cache invalidation complete');
      
      // Close the modal
      handleClose();
      
      // If onRemoveSuccess callback is provided, call it (for profile page updates)
      // Otherwise, navigate back to inbox (for chat settings)
      if (onRemoveSuccess) {
        setTimeout(() => {
          onRemoveSuccess();
        }, 300);
      } else {
        // Navigate back to inbox after a short delay
        setTimeout(() => {
          router.push('/chat');
        }, 300);
      }
      
    } catch (error) {
      console.error('Error in handleRemoveFriend:', error);
      alert('Failed to remove friend. Please try again.');
      setIsRemoving(false);
    }
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
    console.log('🔵 RemoveFriendSlideModal: Not rendering (shouldRender is false)');
    return null;
  }

  console.log('🔵 RemoveFriendSlideModal: Rendering modal, isVisible:', isVisible, 'userName:', userName, 'userId:', userId, 'showConfirm:', showConfirm);

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
          height: '50vh',
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
          <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>Remove Friend</h2>
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
          {!showConfirm ? (
            <>
              {/* Initial Remove Friend Option */}
              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    background: 'white',
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
                  <div className="w-6 h-6 flex items-center justify-center">
                    <UserMinus size={20} className="text-gray-900" />
                  </div>
                  <span className="text-base text-gray-900 font-medium">Remove Friend</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Confirmation Text */}
              <div className="flex-1 flex items-center justify-center">
                <p className="text-base text-gray-900 text-center">
                  Are you sure you want to remove {userName} as a friend?
                </p>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleRemoveFriend}
                disabled={isRemoving || !userId}
                className="w-full rounded-xl transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
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
                  if (!isRemoving && userId) {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                {isRemoving ? 'Removing...' : 'Confirm'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}





