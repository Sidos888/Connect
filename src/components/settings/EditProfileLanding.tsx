"use client";

import Avatar from "@/components/Avatar";
import { User, Link as LinkIcon, Calendar, Star, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/PageSystem";

export default function EditProfileLanding({
  name,
  avatarUrl,
  onBack,
  onOpenLinks,
  onOpenPersonalDetails,
  onOpenTimeline,
  onOpenHighlights,
  backIcon = 'arrow'
}: {
  name?: string;
  avatarUrl?: string;
  onBack: () => void;
  onOpenLinks: () => void;
  onOpenPersonalDetails: () => void;
  onOpenTimeline: () => void;
  onOpenHighlights: () => void;
  backIcon?: 'arrow' | 'close';
}) {
  // Detect platform
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  return (
    <div 
      className="bg-white lg:rounded-3xl w-full lg:max-w-[680px] lg:w-[680px] h-full lg:h-[620px] overflow-hidden flex flex-col lg:shadow-2xl transform transition-all duration-300 ease-out scale-100 relative"
      style={{ '--saved-content-padding-top': isMobile ? '140px' : '104px' } as React.CSSProperties}
          >
      <PageHeader
        title="Edit Profile"
        backButton
        backIcon={backIcon}
        onBack={onBack}
      />

      {/* Content */}
      <div className="flex-1 px-4 overflow-y-auto scrollbar-hide" style={{
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        paddingBottom: '32px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {/* Profile card */}
        <div
          className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 grid grid-cols-[40px_1fr] items-center mb-6 transition-all duration-200 hover:-translate-y-[1px]"
          style={{ 
            borderWidth: '0.4px', 
            borderColor: '#E5E7EB', 
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            willChange: 'transform, box-shadow'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
        >
          <div className="flex items-center">
            <Avatar src={avatarUrl ?? undefined} name={name ?? 'Your Name'} size={36} />
          </div>
          <div className="text-base font-semibold text-gray-900 text-center">{name ?? 'Your Name'}</div>
        </div>

        {/* Edit Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Personal Details */}
          <button
            onClick={onOpenPersonalDetails}
            className="bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] h-32 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:-translate-y-[1px] relative"
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
          >
            <div className="absolute top-2 right-2">
              <Pencil size={14} className="text-gray-400" />
            </div>
            <User size={32} className="text-gray-700" />
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">Personal Details</span>
          </button>

          {/* My Links */}
          <button
            onClick={onOpenLinks}
            className="bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] h-32 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:-translate-y-[1px] relative"
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
          >
            <div className="absolute top-2 right-2">
              <Pencil size={14} className="text-gray-400" />
            </div>
            <LinkIcon size={32} className="text-gray-700" />
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">My Links</span>
          </button>

          {/* My Timeline */}
          <button
            onClick={onOpenTimeline}
            className="bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] h-32 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:-translate-y-[1px] relative"
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
          >
            <div className="absolute top-2 right-2">
              <Pencil size={14} className="text-gray-400" />
            </div>
            <Calendar size={32} className="text-gray-700" />
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">My Timeline</span>
          </button>

          {/* Highlights */}
          <button
            onClick={onOpenHighlights}
            className="bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] h-32 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:-translate-y-[1px] relative"
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
          >
            <div className="absolute top-2 right-2">
              <Pencil size={14} className="text-gray-400" />
            </div>
            <Star size={32} className="text-gray-700" />
            <span className="text-sm font-semibold text-neutral-900 text-center leading-tight">Highlights</span>
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







