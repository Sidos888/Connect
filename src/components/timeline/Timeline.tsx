"use client";

import { useAuth } from "@/lib/authContext";

function formatDob(dob?: string | null) {
  if (!dob) return "Not set";
  try {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return "Not set";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "Not set";
  }
}

/**
 * Timeline - Unified component for Timeline page
 * Used by both mobile route and web modal
 */
export default function Timeline() {
  const { account } = useAuth();
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div 
      className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" 
      style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <div className="space-y-4 max-w-screen-sm mx-auto">
        {/* Birth Date */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl" aria-hidden>🎂</span>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-900 font-medium">Birth Date</span>
              <span className="text-gray-600">{formatDob(account?.dob ?? null)}</span>
            </div>
          </div>
        </div>

        {/* Current Date */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl" aria-hidden>📅</span>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-900 font-medium">Current Date</span>
              <span className="text-gray-600">{today}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



