"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";

export default function AboutMePage() {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col" style={{ paddingBottom: '0' }}>
      <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <button onClick={() => router.back()} className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand" aria-label="Back">
            <span className="action-btn-circle"><ChevronLeftIcon className="h-5 w-5" /></span>
          </button>
          <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>About Me</h1>
        </div>
      </div>
      <div className="flex-1 px-4 py-4"></div>
    </div>
  );
}


