"use client";

import { useState } from "react";
import { Eye, Pencil, Upload } from "lucide-react";

interface ProfileDropdownProps {
  onClose: () => void;
  onViewProfile: () => void;
  onEditProfile: () => void;
  onShareProfile?: () => void;
}

export default function ProfileDropdown({ 
  onClose, 
  onViewProfile, 
  onEditProfile,
  onShareProfile
}: ProfileDropdownProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[99]"
        onClick={onClose}
      />
      
      {/* Menu Card - Parent controls all positioning */}
      <div
        role="menu"
        aria-label="Profile actions"
        className="relative z-[101] bg-white rounded-xl p-3"
        style={{
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Menu items */}
        <div className="space-y-1">
          <button
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:-translate-y-[1px] hover:scale-[1.02] cursor-pointer"
          >
            <Eye size={20} className="text-gray-900" />
            <span className="text-gray-900 font-medium text-base">View</span>
          </button>
          <button
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              onEditProfile();
            }}
            className="w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:-translate-y-[1px] hover:scale-[1.02] cursor-pointer"
          >
            <Pencil size={20} className="text-gray-900" />
            <span className="text-gray-900 font-medium text-base">Edit</span>
          </button>
          {onShareProfile && (
            <button
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onShareProfile();
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:-translate-y-[1px] hover:scale-[1.02] cursor-pointer"
            >
              <Upload size={20} className="text-gray-900" />
              <span className="text-gray-900 font-medium text-base">Share</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}


