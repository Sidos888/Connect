"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

export default function SigningOutPage() {
  console.log('🔄 SigningOutPage: Component rendering');
  
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'signing-out' | 'redirecting'>('signing-out');

  useEffect(() => {
    console.log('🔄 SigningOutPage: Starting sign-out process');
    
    const performSignOut = async () => {
      try {
        // Step 1: Sign out (clears auth, localStorage, etc.)
        console.log('🔄 SigningOutPage: Step 1 - Calling signOut()');
        await signOut();
        
        // Step 2: Clear React Query cache
        console.log('🔄 SigningOutPage: Step 2 - Clearing React Query cache');
        queryClient.clear();
        
        // Step 3: Wait for state propagation and cleanup
        console.log('🔄 SigningOutPage: Step 3 - Waiting for cleanup (1 second)');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 4: Show redirecting status
        setStatus('redirecting');
        console.log('🔄 SigningOutPage: Step 4 - Status changed to redirecting');
        
        // Step 5: Final delay before redirect
        console.log('🔄 SigningOutPage: Step 5 - Final delay before redirect (1 second)');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 6: Redirect to explore
        console.log('🔄 SigningOutPage: Step 6 - Redirecting to /explore');
        if (typeof window !== 'undefined') {
          // Mark that we're coming from signing-out page (for explore page detection)
          sessionStorage.setItem('fromSigningOut', 'true');
          window.location.replace('/explore');
        }
      } catch (error) {
        console.error('🔄 SigningOutPage: Error during sign-out:', error);
        // Even on error, redirect after delay
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
  }, [signOut, queryClient]);
  
  console.log('🔄 SigningOutPage: Component render complete, returning JSX');

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
