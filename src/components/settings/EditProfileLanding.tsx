"use client";

import Avatar from "@/components/Avatar";
import { ChevronLeftIcon } from "@/components/icons";
import { User, Link as LinkIcon, Calendar, Star, Pencil } from "lucide-react";

export default function EditProfileLanding({
  name,
  avatarUrl,
  onBack,
  onOpenLinks,
  onOpenPersonalDetails,
  onOpenTimeline,
  onOpenHighlights
}: {
  name?: string;
  avatarUrl?: string;
  onBack: () => void;
  onOpenLinks: () => void;
  onOpenPersonalDetails: () => void;
  onOpenTimeline: () => void;
  onOpenHighlights: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
      {/* Header */}
      <div className="px-4 pb-4 pt-6">
        <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <button
            onClick={onBack}
            className="absolute left-0 action-btn-circle"
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Edit Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        {/* Profile card */}
        <div
          className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 grid grid-cols-[40px_1fr] items-center mb-6"
          style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
        >
          <div className="flex items-center">
            <Avatar src={avatarUrl ?? undefined} name={name ?? 'Your Name'} size={36} />
          </div>
          <div className="text-base font-semibold text-gray-900 text-center">{name ?? 'Your Name'}</div>
        </div>

        {/* Edit Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
}





