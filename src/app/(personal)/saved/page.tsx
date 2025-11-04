"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import Saved from "@/components/saved/Saved";

export default function SavedPage() {
  const router = useRouter();
  return (
    <div
      className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col"
      style={{ paddingBottom: '0' }}
    >
      {/* Header */}
      <div className="bg-white px-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)', paddingBottom: '16px' }}>
        <div className="relative w-full h-14 flex items-center justify-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '56px' }}>
          <button
            onClick={() => router.back()}
            className="absolute left-0 action-btn-circle transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_0_1px_rgba(100,100,100,0.25),inset_0_0_2px_rgba(27,27,27,0.25),0_2px_6px_rgba(0,0,0,0.08)]"
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
          </button>
          <h1 className="font-semibold text-[18px] leading-6 text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Saved</h1>
        </div>
      </div>
      
      {/* Content - Unified! */}
      <Saved />
    </div>
  );
}
