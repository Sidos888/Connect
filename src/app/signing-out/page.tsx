"use client";

import { useEffect } from "react";
import SigningOutPage from "@/components/auth/SigningOutPage";

// Log at module level to ensure it runs
console.log('🔄 SigningOutPage Route: MODULE LOADED');

export default function Page() {
  // Log immediately - this should appear if component renders at all
  console.log('🔄 SigningOutPage Route: Page component rendering (sync) - always');
  
  if (typeof window !== 'undefined') {
    console.log('🔄 SigningOutPage Route: Page component rendering (sync) - window available');
    // Also log to window for visibility
    (window as any).__signingOutPageRendered = true;
  }
  
  useEffect(() => {
    console.log('🔄 SigningOutPage Route: Page component mounted (useEffect)');
  }, []);
  
  // Render immediately without try/catch to see if that's the issue
  console.log('🔄 SigningOutPage Route: About to render SigningOutPage component');
  
  return (
    <>
      {/* Render a visible element first to test if page renders at all */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 999999, background: 'red', color: 'white', padding: '10px' }}>
        SIGNING OUT PAGE ROUTE RENDERED
      </div>
      <SigningOutPage />
    </>
  );
}
