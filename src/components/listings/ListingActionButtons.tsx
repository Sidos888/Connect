"use client";

import { UserPlus, MessageCircle, Settings, MoreVertical } from 'lucide-react';

interface ListingActionButtonsProps {
  userRole: 'host' | 'participant' | 'viewer';
  listingId: string;
  onManage?: () => void;
}

export default function ListingActionButtons({ 
  userRole, 
  listingId,
  onManage 
}: ListingActionButtonsProps) {
  // Only show action buttons for hosts
  if (userRole !== 'host') {
    return null;
  }

  // Common button styling function
  const getButtonStyles = (isClickable: boolean) => ({
    cursor: isClickable ? 'pointer' : 'default',
    willChange: 'transform, box-shadow' as const
  });

  const getIconContainerStyles = () => ({
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    borderWidth: '0.4px',
    borderColor: '#E5E7EB',
    borderStyle: 'solid' as const,
    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
    willChange: 'transform, box-shadow' as const
  });

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const iconContainer = e.currentTarget.querySelector('div');
    if (iconContainer) {
      iconContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const iconContainer = e.currentTarget.querySelector('div');
    if (iconContainer) {
      iconContainer.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 my-6">
      {/* Invite Button - Not clickable but looks normal */}
      <button
        className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
        style={getButtonStyles(false)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Not functional yet
        }}
      >
        <div 
          className="flex items-center justify-center bg-white"
          style={getIconContainerStyles()}
        >
          <UserPlus size={24} className="text-gray-900" />
        </div>
        <span className="text-xs font-medium text-gray-900">Invite</span>
      </button>

      {/* Chat Button - Not clickable but looks normal */}
      <button
        className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
        style={getButtonStyles(false)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Not functional yet
        }}
      >
        <div 
          className="flex items-center justify-center bg-white"
          style={getIconContainerStyles()}
        >
          <MessageCircle size={24} className="text-gray-900" />
        </div>
        <span className="text-xs font-medium text-gray-900">Chat</span>
      </button>

      {/* Manage Button - Clickable */}
      <button
        onClick={onManage}
        className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
        style={getButtonStyles(true)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="flex items-center justify-center bg-white"
          style={getIconContainerStyles()}
        >
          <Settings size={24} className="text-gray-900" />
        </div>
        <span className="text-xs font-medium text-gray-900">Manage</span>
      </button>

      {/* More Button - Not clickable but looks normal */}
      <button
        className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
        style={getButtonStyles(false)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Not functional yet
        }}
      >
        <div 
          className="flex items-center justify-center bg-white"
          style={getIconContainerStyles()}
        >
          <MoreVertical size={24} className="text-gray-900" />
        </div>
        <span className="text-xs font-medium text-gray-900">More</span>
      </button>
    </div>
  );
}

