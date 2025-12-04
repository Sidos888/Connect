"use client";

import Avatar from "@/components/Avatar";
import { Pencil, Settings, MoreVertical, Users, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageSystem";
import { useEffect, useState, useRef } from "react";

type Profile = {
  id?: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  friendsCount?: number;
  followingCount?: number;
};

export default function ProfilePage({
  profile,
  isOwnProfile = true,
  onClose,
  onEdit,
  onSettings,
  onShare,
  onOpenTimeline,
  onOpenHighlights,
  onOpenBadges,
  onOpenConnections,
  onThreeDotsMenu,
  showBackButton = false,
}: {
  profile: Profile;
  isOwnProfile?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onSettings?: () => void;
  onShare?: () => void;
  onOpenTimeline?: () => void;
  onOpenHighlights?: () => void;
  onOpenBadges?: () => void;
  onOpenConnections?: () => void;
  onThreeDotsMenu?: () => void;
  showBackButton?: boolean;
}) {
  // Platform detection for responsive padding
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset scroll position to top whenever component mounts or profile changes
  useEffect(() => {
    if (contentRef.current) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }, 0);
    }
  }, [profile?.id]);

  // Build action buttons for PageHeader
  const actionButtons = isOwnProfile && onEdit && onSettings ? [
    {
      icon: <Pencil className="h-5 w-5 text-gray-900" />,
      onClick: onEdit,
      label: "Edit profile"
    },
    {
      icon: <Settings className="h-5 w-5 text-gray-900" />,
      onClick: onSettings,
      label: "Open settings"
    }
  ] : !isOwnProfile && onThreeDotsMenu ? [
    {
      icon: <MoreVertical className="h-5 w-5 text-gray-900" />,
      onClick: onThreeDotsMenu,
      label: "More options"
    }
  ] : undefined;

  const contentPaddingTop = isMobile ? '140px' : '104px';

  return (
    <div 
      className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto bg-white lg:rounded-3xl w-full lg:max-w-[680px] lg:w-[680px] h-screen lg:h-[620px] overflow-hidden flex flex-col lg:shadow-2xl transform transition-all duration-300 ease-out scale-100"
      style={{ '--saved-content-padding-top': contentPaddingTop } as React.CSSProperties}
    >
      <PageHeader
        title="Profile"
        backButton
        backIcon={showBackButton ? "arrow" : "close"}
        onBack={onClose}
        actions={actionButtons}
      />

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto lg:overflow-hidden px-4 lg:px-8 pb-8 scrollbar-hide" style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="max-w-md mx-auto">
          {/* Profile Picture - Top Left Aligned */}
          <div className="flex justify-start mb-4 mt-8">
            <Avatar src={profile?.avatarUrl ?? undefined} name={profile?.name ?? 'User'} size={96} />
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {profile?.name ?? (isOwnProfile ? 'Your Name' : 'User')}
          </h1>

          {/* Bio */}
          {profile?.bio && (
            <p className="text-base text-gray-600 mb-4">{profile.bio}</p>
          )}

          {/* Friends • Following */}
          <button
            onClick={onOpenConnections}
            className="mb-6 text-sm text-gray-600"
          >
            <span className="font-semibold">{profile?.friendsCount ?? 0} Friends</span>
            <span className="mx-2">•</span>
            <span className="font-semibold">{profile?.followingCount ?? 0} Following</span>
          </button>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              className="flex-1 bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-3 px-4 text-sm font-medium text-gray-900 transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              Button 1
            </button>
            <button
              className="flex-1 bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-3 px-4 text-sm font-medium text-gray-900 transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              Button 2
            </button>
            <button
              className="flex-1 bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-3 px-4 text-sm font-medium text-gray-900 transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              Button 3
            </button>
          </div>

          {/* Grey Line Separator */}
          <div className="h-[0.4px] bg-gray-300 mb-6" />

          {/* Pills - Life, Highlights, Badges */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={onOpenTimeline}
              className="flex items-center gap-1.5 bg-white rounded-full border-[0.4px] border-[#E5E7EB] py-2 px-4 transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              <span className="text-sm font-semibold text-gray-900">Life</span>
              <span className="text-xs text-gray-500">10</span>
            </button>

            <button
              onClick={onOpenHighlights}
              className="flex items-center gap-1.5 bg-white rounded-full border-[0.4px] border-[#E5E7EB] py-2 px-4 transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              <span className="text-sm font-semibold text-gray-900">Highlights</span>
              <span className="text-xs text-gray-500">10</span>
            </button>

            <button
              onClick={onOpenBadges}
              className="flex items-center gap-1.5 bg-white rounded-full border-[0.4px] border-[#E5E7EB] py-2 px-4 transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              <span className="text-sm font-semibold text-gray-900">Badges</span>
              <span className="text-xs text-gray-500">10</span>
            </button>
          </div>

          {/* Placeholder Content */}
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Content will appear here...</p>
          </div>
        </div>
      </div>

      {/* Bottom Blur */}
      <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
        <div className="absolute bottom-0 left-0 right-0" style={{
          height: '80px',
          background: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0) 100%)'
        }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '20px', backdropFilter: 'blur(0.5px)', WebkitBackdropFilter: 'blur(0.5px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '20px', height: '20px', backdropFilter: 'blur(0.3px)', WebkitBackdropFilter: 'blur(0.3px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '40px', height: '20px', backdropFilter: 'blur(0.15px)', WebkitBackdropFilter: 'blur(0.15px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '60px', height: '20px', backdropFilter: 'blur(0.05px)', WebkitBackdropFilter: 'blur(0.05px)' }} />
      </div>
    </div>
  );
}


