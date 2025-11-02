"use client";

import Avatar from "@/components/Avatar";
import { Pencil, Settings, X } from "lucide-react";

type Profile = {
  name?: string;
  avatarUrl?: string;
  bio?: string;
};

export default function CenteredProfileCard({
  profile,
  onClose,
  onEdit,
  onSettings,
  onShare,
  onOpenTimeline,
  onOpenHighlights,
  onOpenBadges,
  onOpenConnections,
}: {
  profile: Profile;
  onClose: () => void;
  onEdit: () => void;
  onSettings: () => void;
  onShare: () => void;
  onOpenTimeline: () => void;
  onOpenHighlights: () => void;
  onOpenBadges: () => void;
  onOpenConnections: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
      {/* Floating Action Buttons */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 pointer-events-auto"
          style={{
            borderRadius: '100px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
          }}
          aria-label="Close profile"
        >
          <X className="h-5 w-5 text-gray-900" />
        </button>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={onEdit}
            className="flex items-center justify-center w-10 h-10"
            style={{
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
            aria-label="Edit profile"
          >
            <Pencil className="h-5 w-5 text-gray-900" />
          </button>
          <button 
            onClick={onSettings}
            className="flex items-center justify-center w-10 h-10"
            style={{
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5 text-gray-900" />
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6" style={{ paddingTop: '80px' }}>
        {/* Profile Header - Centered */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <Avatar src={profile?.avatarUrl ?? undefined} name={profile?.name ?? 'User'} size={140} />
          </div>
          <button
            onClick={onShare}
            className="block mx-auto mb-3"
            style={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              padding: '10px 16px'
            }}
            aria-label="Open share profile"
          >
            <span className="text-3xl font-bold text-gray-900">{profile?.name ?? 'Your Name'}</span>
          </button>
          {profile?.bio ? <p className="text-gray-600 text-lg">{profile.bio}</p> : null}
        </div>

        {/* Grid of 4 Boxes */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            onClick={onOpenTimeline}
            className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] h-28 flex flex-col items-center justify-center gap-2"
            style={{ boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
          >
            <div className="text-4xl">🧭</div>
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">Timeline</span>
          </button>
          <button 
            onClick={onOpenHighlights}
            className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] h-28 flex flex-col items-center justify-center gap-2"
            style={{ boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
          >
            <div className="text-4xl">🌟</div>
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">Highlights</span>
          </button>
          <button 
            onClick={onOpenBadges}
            className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] h-28 flex flex-col items-center justify-center gap-2"
            style={{ boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
          >
            <div className="text-4xl">🏆</div>
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">Badges</span>
          </button>
          <button 
            onClick={onOpenConnections}
            className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] h-28 flex flex-col items-center justify-center gap-2"
            style={{ boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
          >
            <div className="text-4xl">👬</div>
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">Connections</span>
          </button>
        </div>
      </div>
    </div>
  );
}


