"use client";

import { Settings } from "lucide-react";
import { BellIcon } from "@/components/icons";
import { useUnreadNotificationsCount } from "@/lib/notificationsQueries";
import { useAuth } from "@/lib/authContext";

interface MenuTopActionsProps {
  onSettingsClick: () => void;
  onNotificationsClick: () => void;
}

export default function MenuTopActions({ onSettingsClick, onNotificationsClick }: MenuTopActionsProps) {
  const { user } = useAuth();
  const { data: unreadNotificationsCount = 0 } = useUnreadNotificationsCount(user?.id || null);
  return (
    <div
      className="flex items-center transition-all duration-200 hover:-translate-y-[1px] relative"
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
        overflow: 'visible', // Changed from 'hidden' to 'visible' so badge isn't clipped
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
        className="flex items-center justify-center flex-1 h-full relative"
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <BellIcon size={22} className="text-gray-900" style={{ strokeWidth: 2.5 }} />
      </button>
      {/* Badge - Positioned relative to parent container so it's not clipped - Exact same styling as TabBar badges */}
      {unreadNotificationsCount > 0 && (
        <span
          className="absolute flex items-center justify-center"
          style={{
            top: '-4px', // Match TabBar positioning exactly
            right: '-4px', // Match TabBar positioning exactly
            width: '20px', // Same size as chat notification dot
            height: '20px', // Same size as chat notification dot
            minWidth: '20px', // Same size as chat notification dot
            borderRadius: '50%',
            backgroundColor: '#EF4444', // red-500
            color: 'white',
            fontSize: '10px',
            fontWeight: '600',
            padding: '0 4px',
            border: '2px solid white',
            boxShadow: '0 0 0 1px rgba(255, 255, 255, 1)', // Stronger white shadow to prevent red bleed
            zIndex: 100, // High z-index to ensure it's on top
            lineHeight: '1',
            pointerEvents: 'none', // Don't block clicks on the button
            isolation: 'isolate', // Create new stacking context to prevent bleed
          }}
        >
          {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
        </span>
      )}
    </div>
  );
}

