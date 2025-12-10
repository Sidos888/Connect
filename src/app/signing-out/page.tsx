"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/authContext";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

// MODULE-LEVEL LOG: This should execute when the module is loaded
console.log('🔄 SigningOutPage Route: MODULE LOADED - File is being imported');

// CRITICAL: Force execution immediately on module load
if (typeof window !== 'undefined') {
  const isSigningOutPage = window.location.pathname === '/signing-out' || window.location.pathname.startsWith('/signing-out');
  if (isSigningOutPage) {
    console.log('🔄 SigningOutPage Route: Module loaded, forcing immediate execution');
    (window as any).__signingOutPageForceExecute = true;
  }
}

export default function Page() {
  console.log('🔄 SigningOutPage Route: Page component rendering');
  
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'signing-out' | 'redirecting'>('signing-out');
  const [mounted, setMounted] = useState(false);
  const hasStartedRef = useRef(false); // Prevent multiple executions

  // Force mount immediately
  useEffect(() => {
    console.log('🔄 SigningOutPage Route: Component mounted');
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run once - use ref to prevent re-execution
    if (!mounted || hasStartedRef.current) return;
    
    hasStartedRef.current = true; // Mark as started
    console.log('🔄 SigningOutPage Route: Starting sign-out process');
    
    const performSignOut = async () => {
      try {
        // Step 1: Sign out
        console.log('🔄 SigningOutPage Route: Step 1 - Calling signOut()');
        await signOut();
        
        // Step 2: Clear React Query cache
        console.log('🔄 SigningOutPage Route: Step 2 - Clearing React Query cache');
        queryClient.clear();
        
        // Step 3: Wait for cleanup
        console.log('🔄 SigningOutPage Route: Step 3 - Waiting for cleanup (1 second)');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 4: Show redirecting status
        setStatus('redirecting');
        console.log('🔄 SigningOutPage Route: Step 4 - Status changed to redirecting');
        
        // Step 5: Final delay before redirect
        console.log('🔄 SigningOutPage Route: Step 5 - Final delay before redirect (1 second)');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 6: Redirect to explore
        console.log('🔄 SigningOutPage Route: Step 6 - Redirecting to /explore');
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('fromSigningOut', 'true');
          window.location.replace('/explore');
        }
      } catch (error) {
        console.error('🔄 SigningOutPage Route: Error during sign-out:', error);
        setStatus('redirecting');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('fromSigningOut', 'true');
            window.location.replace('/explore');
          }
        }, 2000);
      }
    };

    performSignOut();
  }, [mounted]); // ✅ Only depend on mounted - signOut and queryClient are stable

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
