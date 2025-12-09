"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SigningOutPage() {
  // Log immediately - multiple times to ensure we see it
  console.log('🔄 SigningOutPage: Component rendering (sync) - LINE 1');
  if (typeof window !== 'undefined') {
    console.log('🔄 SigningOutPage: Component rendering (sync) - window available');
  }
  
  let signOut: (() => Promise<void>) | null = null;
  try {
    console.log('🔄 SigningOutPage: About to call useAuth()');
    const auth = useAuth();
    signOut = auth.signOut;
    console.log('🔄 SigningOutPage: useAuth() successful', { hasSignOut: !!signOut });
  } catch (error) {
    console.error('🔄 SigningOutPage: useAuth() error:', error);
  }
  
  console.log('🔄 SigningOutPage: About to call useState');
  const [status, setStatus] = useState<'signing-out' | 'redirecting'>('signing-out');
  console.log('🔄 SigningOutPage: useState complete', { status });

  console.log('🔄 SigningOutPage: State initialized', { 
    hasSignOut: !!signOut,
    status 
  });

  useEffect(() => {
    console.log('🔄 SigningOutPage: useEffect triggered, component mounted');
    
    if (!signOut) {
      console.error('🔄 SigningOutPage: signOut function not available, redirecting anyway');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.replace('/explore');
        }
      }, 1000);
      return;
    }
    
    console.log('🔄 SigningOutPage: Starting sign out process');
    
    // Sign out immediately
    const performSignOut = async () => {
      try {
        console.log('🔄 SigningOutPage: Calling signOut()');
        await signOut();
        console.log('🔄 SigningOutPage: Sign out complete');
        
        // Update status to show "Redirecting..."
        setStatus('redirecting');
        
        // Wait 3 seconds total (including signOut time) to ensure everything is cleared
        // This gives a smooth UX and ensures backend sign-out completes
        setTimeout(() => {
          console.log('🔄 SigningOutPage: Redirecting to /explore');
          if (typeof window !== 'undefined') {
            window.location.replace('/explore');
          }
        }, 2000); // 2 seconds after signOut completes (total ~3 seconds)
      } catch (error) {
        console.error('🔄 SigningOutPage: Sign out error (ignoring):', error);
        // Even on error, redirect after delay
        setStatus('redirecting');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.replace('/explore');
          }
        }, 2000);
      }
    };

    performSignOut();
  }, [signOut]);
  
  console.log('🔄 SigningOutPage: Component render complete, returning JSX');

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-[99999]" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh'
    }}>
      <div className="flex flex-col items-center space-y-6">
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {status === 'signing-out' ? 'Signing out...' : 'Redirecting...'}
          </h3>
        </div>
      </div>
    </div>
  );
}
