"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";

export default function SavedPage() {
  const router = useRouter();
  return (
    <div
      className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col lg:relative lg:h-auto lg:min-h-screen"
      style={{ paddingBottom: '0' }}
    >
      <div className="bg-white px-4 lg:pt-20" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        {/* 56px content-height top bar */}
        <div className="relative w-full h-14 flex items-center justify-center lg:max-w-4xl lg:mx-auto" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '56px' }}>
          <button
            onClick={() => router.back()}
            className="absolute left-0 top-1/2 -translate-y-1/2 action-btn-circle"
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
          </button>
          <h1 className="font-semibold text-[18px] leading-6 text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Saved</h1>
        </div>
      </div>
      <div className="flex-1 px-4 py-4"></div>
    </div>
  );
}
