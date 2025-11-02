"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";

export default function HighlightsPage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col" style={{ paddingBottom: '0' }}>
      {/* Mobile full-screen */}
      <div className="lg:hidden flex flex-col h-full">
        <div className="bg-white px-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
          <div className="relative w-full h-14 flex items-center justify-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '56px' }}>
            <button
              onClick={() => router.back()}
              className="absolute left-0 flex items-center justify-center w-10 h-10"
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
            <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Highlights</h1>
          </div>
        </div>
        <div className="flex-1 px-4 py-4 overflow-y-auto" />
      </div>

      {/* Desktop centered card with dim overlay */}
      <div className="hidden lg:block fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => router.back()} />
      <div className="hidden lg:flex min-h-screen items-center justify-center p-6">
        <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative" style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid' }}>
          <div className="px-4 pb-2 pt-6">
            <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <button
                onClick={() => router.back()}
                className="absolute left-0 flex items-center justify-center w-10 h-10"
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
              <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Highlights</h1>
            </div>
          </div>
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
}
