"use client";

import Avatar from "@/components/Avatar";
import { Pencil, Settings, MoreVertical } from "lucide-react";
import { PageHeader } from "@/components/layout/PageSystem";
import { useEffect, useState } from "react";

type Profile = {
  id?: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
};

export default function UnifiedProfileCard({
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
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const contentPaddingTop = isMobile ? '180px' : '104px';

  return (
    <div 
      className="bg-white lg:rounded-3xl w-full lg:max-w-[680px] lg:w-[680px] h-full lg:h-[620px] overflow-hidden flex flex-col lg:shadow-2xl transform transition-all duration-300 ease-out scale-100 relative"
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
      <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide flex flex-col" style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {/* Profile Header - Centered */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <Avatar src={profile?.avatarUrl ?? undefined} name={profile?.name ?? 'User'} size={100} />
          </div>
          <button
            onClick={onShare || (() => {})}
            className="block mx-auto mb-2 transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              padding: '8px 14px',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            aria-label="Open share profile"
            disabled={!onShare}
          >
            <span className="text-2xl font-bold text-gray-900">{profile?.name ?? (isOwnProfile ? 'Your Name' : 'User')}</span>
          </button>
          {profile?.bio ? <p className="text-gray-600 text-base">{profile.bio}</p> : null}
        </div>

        {/* Grid of 4 Boxes */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onOpenTimeline || (() => {})}
            className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] h-28 flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            disabled={!onOpenTimeline}
          >
            <div className="text-4xl">🧭</div>
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">Timeline</span>
          </button>
          <button 
            onClick={onOpenHighlights || (() => {})}
            className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] h-28 flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            disabled={!onOpenHighlights}
          >
            <div className="text-4xl">🌟</div>
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">Highlights</span>
          </button>
          <button 
            onClick={onOpenBadges || (() => {})}
            className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] h-28 flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            disabled={!onOpenBadges}
          >
            <div className="text-4xl">🏆</div>
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">Badges</span>
          </button>
          <button 
            onClick={onOpenConnections || (() => {})}
            className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] h-28 flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            disabled={!onOpenConnections}
          >
            <div className="text-4xl">👬</div>
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">Connections</span>
          </button>
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
