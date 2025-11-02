"use client";

import { ChevronLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/authContext";

interface CenteredAccountSettingsProps {
  onClose: () => void;
  onDeleteAccount: () => void;
}

export default function CenteredAccountSettings({
  onClose,
  onDeleteAccount,
}: CenteredAccountSettingsProps) {
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimming overlay */}
      <div
        className="fixed inset-0 transition-opacity duration-300 ease-in-out"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
        {/* Back button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 flex items-center justify-center w-10 h-10 transition-all duration-200 hover:-translate-y-[1px]"
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
          aria-label="Go back"
        >
          <ChevronLeft size={20} className="text-gray-900" />
        </button>

        {/* Title */}
        <h2 className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-xl font-semibold text-gray-900">Account Settings</h2>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 flex flex-col" style={{ paddingTop: '80px' }}>
          {/* Email and Phone Card */}
          <div 
            className="bg-white rounded-2xl p-4 mb-6 border border-gray-200 shadow-sm space-y-4" 
            style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
          >
            {/* Email */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Email</span>
              <span className="text-sm text-gray-900">{user?.email || 'Not set'}</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-200" />

            {/* Phone Number */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Phone Number</span>
              <span className="text-sm text-gray-900">{user?.phone || 'Not set'}</span>
            </div>
          </div>

          {/* Spacer to push Delete Account to bottom */}
          <div className="flex-1" />

          {/* Delete Account Button at bottom */}
          <div className="pb-6">
            <button
              onClick={onDeleteAccount}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 text-red-600 bg-white rounded-2xl transition-all duration-200 border border-gray-200 shadow-sm hover:-translate-y-[1px]"
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
              <Trash2 size={20} className="text-red-500" />
              <span className="font-medium">Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




