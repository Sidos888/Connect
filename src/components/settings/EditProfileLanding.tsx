"use client";

import Avatar from "@/components/Avatar";
import { ChevronLeftIcon } from "@/components/icons";

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
            className="absolute left-0 flex items-center justify-center w-10 h-10 transition-all duration-200 hover:-translate-y-[1px]"
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

        {/* Boxes */}
        <div className="space-y-6">
          <button
            onClick={onOpenLinks}
            className="mx-auto block w-44 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-center transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
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
          >
            <span className="text-base font-semibold text-neutral-900">My Links</span>
          </button>
          <button
            onClick={onOpenPersonalDetails}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-5 text-left transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
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
          >
            <div className="text-center text-lg font-semibold text-neutral-900">Personal Details</div>
          </button>
          <button
            onClick={onOpenTimeline}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-5 text-left transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
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
          >
            <div className="text-center text-lg font-semibold text-neutral-900">My Timeline</div>
          </button>
          <button
            onClick={onOpenHighlights}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-5 text-left transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
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
          >
            <div className="text-center text-lg font-semibold text-neutral-900">Highlights</div>
          </button>
        </div>
      </div>
    </div>
  );
}





