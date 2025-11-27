"use client";

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
import { chatKeys } from '@/lib/chatQueries';

interface LeaveGroupSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  chatId: string;
}

export default function LeaveGroupSlideModal({
  isOpen,
  onClose,
  groupName,
  chatId,
}: LeaveGroupSlideModalProps) {
  const router = useRouter();
  const { account } = useAuth();
  const chatService = useChatService();
  const queryClient = useQueryClient();
  const [isLeaving, setIsLeaving] = useState(false);
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

  // Handle leave group
  const handleLeaveGroup = async () => {
    if (!account?.id || !chatService || !chatId || isLeaving) return;

    setIsLeaving(true);
    try {
      console.log('Leaving group:', chatId);
      
      // Remove the user from the group
      const { error: leaveError } = await chatService.leaveGroup(chatId, account.id);
      
      if (leaveError) {
        console.error('Error leaving group:', leaveError);
        alert('Failed to leave group. Please try again.');
        setIsLeaving(false);
        return;
      }

      console.log('Successfully left group');
      
      // Invalidate React Query caches to refresh chats
      await queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: chatKeys.all });
      if (chatId) {
        await queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      }
      
      // Close the modal
      handleClose();
      
      // Navigate back to inbox after a short delay
      setTimeout(() => {
        router.push('/chat');
      }, 300);
      
    } catch (error) {
      console.error('Error in handleLeaveGroup:', error);
      alert('Failed to leave group. Please try again.');
      setIsLeaving(false);
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
          <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>Leave Group</h2>
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
            <X size={18} className="text-gray-900" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col px-6 pb-6">
          {/* Confirmation Text */}
          <div className="flex-1 flex items-center justify-center">
            <p className="text-base text-gray-900 text-center">
              Are you sure you want to leave {groupName}?
            </p>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleLeaveGroup}
            disabled={isLeaving || !chatId}
            className="w-full transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              padding: '16px',
              background: '#EF4444',
              color: 'white',
              fontSize: '16px',
              fontWeight: '700',
              borderRadius: '60px',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              if (!isLeaving && chatId) {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            {isLeaving ? 'Leaving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
