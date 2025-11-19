"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, LucideIcon } from "lucide-react";
import Avatar from "@/components/Avatar";
import ProfileDropdown from "@/components/profile/ProfileDropdown";

interface ProfileCardProps {
  name: string;
  avatarUrl?: string | null;
  onClick?: () => void;
  onViewProfile: () => void;
  onEditProfile: () => void;
  onShareProfile?: () => void;
  avatarSize?: number;
  className?: string;
  customActionIcon?: LucideIcon;
  onCustomAction?: () => void;
}

export default function ProfileCard({
  name,
  avatarUrl,
  onClick,
  onViewProfile,
  onEditProfile,
  onShareProfile,
  avatarSize = 40,
  className = "",
  customActionIcon,
  onCustomAction
}: ProfileCardProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const clickedInsideMenu = !!(profileMenuRef.current && target && profileMenuRef.current.contains(target));
      const clickedButton = !!(profileMenuButtonRef.current && target && profileMenuButtonRef.current.contains(target));
      
      if (!clickedInsideMenu && !clickedButton) {
        setIsProfileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isProfileMenuOpen]);

  return (
    <div className={`relative ${className}`}>
      <div
        className="rounded-2xl bg-white px-5 py-4 grid items-center cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
        style={{
          gridTemplateColumns: `${avatarSize}px 1fr 40px`,
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
        onClick={onClick}
      >
        <div className="flex items-center">
          <Avatar
            src={avatarUrl ?? undefined}
            name={name}
            size={avatarSize}
          />
        </div>
        <div className="text-base font-semibold text-gray-900 text-center">
          {name}
        </div>
        <div
          className="flex justify-end"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {customActionIcon && onCustomAction ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCustomAction();
              }}
              className="flex items-center justify-center w-10 h-10"
              aria-label="Share profile"
            >
              {(() => {
                const Icon = customActionIcon;
                return <Icon className="h-5 w-5 text-gray-900" />;
              })()}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileMenuOpen((v) => !v);
              }}
              ref={profileMenuButtonRef}
              className="flex items-center justify-center w-10 h-10"
              aria-label="Open profile menu"
              aria-expanded={isProfileMenuOpen}
            >
              <MoreVertical className="h-5 w-5 text-gray-900" />
            </button>
          )}
        </div>
      </div>

      {/* Profile Dropdown - positioned slightly overlapping inside profile card */}
      {isProfileMenuOpen && (
        <div ref={profileMenuRef} className="absolute top-[calc(100%-8px)] right-0 z-[200]">
          <ProfileDropdown
            onClose={() => setIsProfileMenuOpen(false)}
            onViewProfile={() => {
              setIsProfileMenuOpen(false);
              onViewProfile();
            }}
            onEditProfile={() => {
              setIsProfileMenuOpen(false);
              onEditProfile();
            }}
            onShareProfile={onShareProfile ? () => {
              setIsProfileMenuOpen(false);
              onShareProfile();
            } : undefined}
          />
        </div>
      )}
    </div>
  );
}




