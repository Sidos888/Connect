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
      {/* Floating Header with Gradient Blur & Opacity */}
      <div className="absolute top-0 left-0 right-0 z-20" style={{ 
        pointerEvents: 'none'
      }}>
        {/* Opacity gradient layer - Eased curve */}
        <div className="absolute top-0 left-0 right-0" style={{
          height: '104px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 10%, rgba(255,255,255,0.85) 20%, rgba(255,255,255,0.75) 30%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.12) 90%, rgba(255,255,255,0.05) 100%)'
        }} />
        
        {/* Blur layer 5: 2px blur at top (0-20px) - button area */}
        <div className="absolute top-0 left-0 right-0" style={{
          height: '20px',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)'
        }} />
        
        {/* Blur layer 4: 1.5px blur (20-35px) */}
        <div className="absolute left-0 right-0" style={{
          top: '20px',
          height: '15px',
          backdropFilter: 'blur(1.5px)',
          WebkitBackdropFilter: 'blur(1.5px)'
        }} />
        
        {/* Blur layer 3: 1px blur (35-55px) */}
        <div className="absolute left-0 right-0" style={{
          top: '35px',
          height: '20px',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)'
        }} />
        
        {/* Blur layer 2: 0.5px blur (55-80px) */}
        <div className="absolute left-0 right-0" style={{
          top: '55px',
          height: '25px',
          backdropFilter: 'blur(0.5px)',
          WebkitBackdropFilter: 'blur(0.5px)'
        }} />
        
        {/* Blur layer 1: Almost no blur (80-104px) - fade out */}
        <div className="absolute left-0 right-0" style={{
          top: '80px',
          height: '24px',
          backdropFilter: 'blur(0.2px)',
          WebkitBackdropFilter: 'blur(0.2px)'
        }} />
        
        {/* Header Content */}
        <div className="px-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)', paddingBottom: '16px' }}>
          <div className="relative w-full h-14 flex items-center justify-center" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            width: '100%', 
            height: '56px',
            pointerEvents: 'auto'
          }}>
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
      </div>
      
      {/* Content - Unified! */}
      <Saved />
    </div>
  );
}
