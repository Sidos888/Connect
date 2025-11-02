"use client";

import Avatar from "@/components/Avatar";
import { Pencil, Settings, X, MoreVertical, ArrowLeft } from "lucide-react";

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
  return (
    <div className="bg-white lg:rounded-3xl w-full lg:max-w-[680px] lg:w-[680px] h-full lg:h-[620px] overflow-hidden flex flex-col lg:shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
      {/* Floating Action Buttons */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 pointer-events-auto transition-all duration-200 hover:-translate-y-[1px]"
          style={{
            borderRadius: '100px',
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
          aria-label={showBackButton ? "Back" : "Close profile"}
        >
          {showBackButton ? (
            <ArrowLeft className="h-5 w-5 text-gray-900" />
          ) : (
            <X className="h-5 w-5 text-gray-900" />
          )}
        </button>
        
        {isOwnProfile ? (
          <div className="flex items-center gap-2 pointer-events-auto">
            <button 
              onClick={onEdit}
              className="flex items-center justify-center w-10 h-10 transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                borderRadius: '100px',
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
              aria-label="Edit profile"
            >
              <Pencil className="h-5 w-5 text-gray-900" />
            </button>
            <button 
              onClick={onSettings}
              className="flex items-center justify-center w-10 h-10 transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                borderRadius: '100px',
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
              aria-label="Open settings"
            >
              <Settings className="h-5 w-5 text-gray-900" />
            </button>
          </div>
        ) : (
          <button 
            onClick={onThreeDotsMenu || (() => {})}
            className="flex items-center justify-center w-10 h-10 pointer-events-auto transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              borderRadius: '100px',
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
            aria-label="More options"
            disabled={!onThreeDotsMenu}
          >
            <MoreVertical className="h-5 w-5 text-gray-900" />
          </button>
        )}
      </div>

      {/* Content - Mobile: top-aligned with proper spacing, Desktop: centered */}
      <div 
        className="flex-1 flex flex-col lg:justify-center px-6 overflow-hidden" 
        style={{ 
          paddingTop: '70px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))'
        }}
      >
        {/* Profile Header - Centered */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <Avatar src={profile?.avatarUrl ?? undefined} name={profile?.name ?? 'User'} size={120} />
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
    </div>
  );
}

