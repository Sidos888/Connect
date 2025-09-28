"use client";

import React from 'react';
import Avatar from '../Avatar';
import { X } from 'lucide-react';

interface AvatarChipProps {
  contact: {
    id: string;
    name: string;
    profile_pic?: string;
    profilePic?: string;
    type: 'person' | 'business';
  };
  onRemove: (contactId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarChip({ 
  contact, 
  onRemove, 
  size = 'md' 
}: AvatarChipProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-3 py-2 pr-2">
      <Avatar
        src={contact.profile_pic || contact.profilePic}
        name={contact.name}
        size={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
        className="flex-shrink-0"
      />
      <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
        {contact.name}
      </span>
      <button
        onClick={() => onRemove(contact.id)}
        className={`${iconSizes[size]} text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 rounded-full hover:bg-gray-200 p-0.5`}
        aria-label={`Remove ${contact.name}`}
      >
        <X className="h-full w-full" />
      </button>
    </div>
  );
}
