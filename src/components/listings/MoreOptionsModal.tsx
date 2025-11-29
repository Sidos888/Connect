"use client";

import { useState, useEffect } from 'react';
import { MessageCircle, Calendar, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import { useChatService } from '@/lib/chatProvider';
import { useAuth } from '@/lib/authContext';

interface MoreOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostId: string | null; // The host_id from the listing
  userRole: 'host' | 'participant' | 'viewer'; // User's role in the listing
  onAddToCalendar?: () => void;
}

export default function MoreOptionsModal({
  isOpen,
  onClose,
  hostId,
  userRole,
  onAddToCalendar
}: MoreOptionsModalProps) {
  const router = useRouter();
  const chatService = useChatService();
  const { account } = useAuth();
  
  // Don't show "Contact Host" if user is the host
  const showContactHost = userRole !== 'host' && hostId && account && hostId !== account.id;
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45);

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

  if (!shouldRender) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleContactHost = async () => {
    console.log('🔍 handleContactHost called:', { hostId, hasChatService: !!chatService, hasAccount: !!account, accountId: account?.id });
    
    if (!hostId) {
      console.error('❌ Cannot contact host: missing hostId');
      alert('Host information not available.');
      return;
    }
    
    if (!chatService) {
      console.error('❌ Cannot contact host: chatService not available');
      alert('Chat service not available. Please try again.');
      return;
    }
    
    if (!account) {
      console.error('❌ Cannot contact host: account not available');
      alert('Please log in to contact the host.');
      return;
    }

    // Don't allow contacting yourself
    if (hostId === account.id) {
      console.log('⚠️ Cannot contact yourself');
      return;
    }

    try {
      console.log('📨 Creating direct chat with host:', hostId);
      // Create or find existing direct chat with the host
      const { chat, error } = await chatService.createDirectChat(hostId);
      
      if (error) {
        console.error('❌ Error creating direct chat with host:', error);
        alert('Failed to open chat. Please try again.');
        return;
      }

      if (chat) {
        console.log('✅ Chat created/found:', chat.id);
        // Navigate to the chat page
        router.push(`/chat/individual?chat=${chat.id}`);
        handleClose();
      } else {
        console.error('❌ No chat returned from createDirectChat');
        alert('Failed to open chat. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error in handleContactHost:', error);
      alert('Failed to open chat. Please try again.');
    }
  };

  const handleAddToCalendar = () => {
    // Placeholder for now
    console.log('Add to Calendar clicked');
    if (onAddToCalendar) {
      onAddToCalendar();
    }
    handleClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isVisible ? 1 : 0
        }}
        onClick={handleClose}
      />
      
      {/* Modal Card */}
      <div 
        className="relative bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: 'calc(100% - 16px)',
          maxWidth: '500px',
          marginTop: '20px',
          marginBottom: '8px',
          borderTopLeftRadius: `${cornerRadius}px`,
          borderTopRightRadius: `${cornerRadius}px`,
          borderBottomLeftRadius: `${cornerRadius}px`,
          borderBottomRightRadius: `${cornerRadius}px`,
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center" style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px', minHeight: '60px' }}>
          <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>More Options</h2>
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

        {/* Options */}
        <div className="flex-1 flex flex-col overflow-y-auto" style={{ padding: '0 24px 24px 24px' }}>
          {/* Contact Host - Only show if user is not the host */}
          {showContactHost && (
            <button
              onClick={handleContactHost}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 hover:-translate-y-[1px] text-left focus:outline-none"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                minHeight: '72px',
                cursor: 'pointer',
                willChange: 'transform, box-shadow'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{
                  width: '40px',
                  height: '40px',
                }}
              >
                <MessageCircle size={20} className="text-gray-900" />
              </div>
              <span className="text-base font-medium text-gray-900">Contact Host</span>
            </button>
          )}

          {/* Add to Calendar */}
          <button
            onClick={handleAddToCalendar}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 hover:-translate-y-[1px] text-left mt-3 focus:outline-none"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              minHeight: '72px',
              cursor: 'pointer',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{
                width: '40px',
                height: '40px',
              }}
            >
              <Calendar size={20} className="text-gray-900" />
            </div>
            <span className="text-base font-medium text-gray-900">Add to Calendar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
