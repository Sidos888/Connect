"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";

export default function HighlightsPage() {
  const router = useRouter();

  useEffect(() => {
    const bottomNav = document.querySelector('[data-testid=\"mobile-bottom-nav\"]');
    if (bottomNav) (bottomNav as HTMLElement).style.display = 'none';
    return () => { if (bottomNav) (bottomNav as HTMLElement).style.display = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col lg:max-w-2xl lg:mx-auto">
      <div className="bg-white px-4 pt-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
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

      <div className="flex-1 px-4 py-6 lg:px-8 overflow-y-auto">
        <p className="text-center text-gray-500">Coming soon</p>
      </div>
    </div>
  );
}


