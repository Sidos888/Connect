"use client";

import React from 'react';
import Avatar from '../Avatar';
import { Check } from 'lucide-react';

interface UserListItemProps {
  contact: {
    id: string;
    name: string;
    profile_pic?: string;
    profilePic?: string;
    connect_id?: string;
    connectId?: string;
    type: 'person' | 'business';
    is_blocked?: boolean;
  };
  isSelected: boolean;
  onToggle: (contactId: string) => void;
  disabled?: boolean;
}

export default function UserListItem({ 
  contact, 
  isSelected, 
  onToggle, 
  disabled = false 
}: UserListItemProps) {
  const handleClick = () => {
    if (!disabled && !contact.is_blocked) {
      onToggle(contact.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`
        bg-white rounded-2xl border border-gray-200 shadow-sm p-4 py-5 relative min-h-[60px] cursor-pointer transition-colors
        ${disabled || contact.is_blocked 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-gray-50'
        }
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled || contact.is_blocked ? -1 : 0}
      role="checkbox"
      aria-checked={isSelected}
      aria-disabled={disabled || contact.is_blocked}
      aria-label={`${isSelected ? 'Selected' : 'Select'} ${contact.name}`}
    >
      {/* Avatar - positioned absolutely on the left */}
      <div 
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          borderWidth: '0.5px',
          borderStyle: 'solid',
          borderColor: 'rgba(0, 0, 0, 0.08)'
        }}
      >
        {contact.profile_pic || contact.profilePic ? (
          <img 
            src={contact.profile_pic || contact.profilePic} 
            alt={contact.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <span className="text-gray-500 text-lg font-medium">
            {contact.name?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name - centered */}
      <div className="w-full text-center flex items-center justify-center h-full">
        <h3 className="text-base font-semibold text-gray-900">{contact.name}</h3>
      </div>

      {/* Select Button - positioned absolutely on the right */}
      <div className={`
        absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded border flex items-center justify-center transition-all duration-200
        ${isSelected 
          ? 'bg-orange-500 border-orange-500 shadow-sm' 
          : 'border-gray-300 hover:border-gray-400 bg-white'
        }
        ${disabled || contact.is_blocked ? 'opacity-50' : ''}
      `}>
        {isSelected && (
          <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
        )}
      </div>
    </div>
  );
}
