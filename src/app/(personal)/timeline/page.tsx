"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
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

export default function TimelinePage() {
  const router = useRouter();
  const { account } = useAuth();
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col" style={{ paddingBottom: '0' }}>
      {/* Header */}
      <div className="bg-white px-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="relative w-full h-14 flex items-center justify-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '56px' }}>
          <button
            onClick={() => router.back()}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10"
            style={{
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Timeline</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
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
    </div>
  );
}


