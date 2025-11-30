"use client";

import { Settings } from "lucide-react";
import { BellIcon } from "@/components/icons";

interface MenuTopActionsProps {
  onSettingsClick: () => void;
  onNotificationsClick: () => void;
}

export default function MenuTopActions({ onSettingsClick, onNotificationsClick }: MenuTopActionsProps) {
  return (
    <div
      className="flex items-center transition-all duration-200 hover:-translate-y-[1px]"
      style={{
        width: '88px', // Double the normal button width (44px * 2)
        height: '44px',
        borderRadius: '100px',
        background: 'rgba(255, 255, 255, 0.96)',
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
        willChange: 'transform, box-shadow',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
      }}
    >
      {/* Settings Icon - Left Side */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSettingsClick();
        }}
        className="flex items-center justify-center flex-1 h-full"
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Settings size={20} className="text-gray-900" strokeWidth={2.5} />
      </button>
      {/* Notifications Icon - Right Side */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNotificationsClick();
        }}
        className="flex items-center justify-center flex-1 h-full"
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <BellIcon size={22} className="text-gray-900" style={{ strokeWidth: 2.5 }} />
      </button>
    </div>
  );
}

