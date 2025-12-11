"use client";

import React, { useEffect, useState, useRef } from "react";
import { authService } from "@/lib/services";
import Image from "next/image";

// MODULE-LEVEL LOG: This should execute when the module is loaded
console.log('🔄 SigningOutPage Route: MODULE LOADED - File is being imported');

export default function Page() {
  console.log('🔄 SigningOutPage Route: Page component rendering');
  
  const [status, setStatus] = useState<'signing-out' | 'redirecting'>('signing-out');
  const hasTriggeredRef = useRef(false); // Prevent multiple triggers

  useEffect(() => {
    // Trigger sign-out flow once (fire-and-forget)
    // The orchestration lives in AuthService, outside component lifecycle
    if (hasTriggeredRef.current) return;
    
    hasTriggeredRef.current = true;
    console.log('🔄 SigningOutPage Route: Triggering sign-out flow (fire-and-forget)');
    
    // Fire-and-forget: AuthService handles everything
    authService.runSignOutFlow().catch(error => {
      console.error('🔄 SigningOutPage Route: Sign-out flow error (handled by service):', error);
    });

    // Subscribe to status updates from AuthService
    const unsubscribe = authService.onStatusChange((newStatus) => {
      console.log('🔄 SigningOutPage Route: Status update from service:', newStatus);
      if (newStatus === 'signing-out' || newStatus === 'redirecting') {
        setStatus(newStatus);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []); // Empty deps - only run once on mount

  // Render immediately - don't wait for anything
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[99999]" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#ffffff'
    }}>
      {/* Connect Logo - Centered with subtle pulse animation */}
      <div className="flex items-center justify-center animate-pulse">
        <Image
          src="/connect-logo.png"
          alt="Connect Logo"
          width={240}
          height={240}
          className="object-contain"
          priority
          style={{
            maxWidth: '240px',
            maxHeight: '240px',
            width: 'auto',
            height: 'auto'
          }}
        />
      </div>
      <div className="mt-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {status === 'signing-out' ? 'Signing out...' : 'Redirecting...'}
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          {status === 'signing-out' 
            ? 'Please wait while we sign you out' 
            : 'Taking you to explore'}
        </p>
      </div>
    </div>
  );
}
