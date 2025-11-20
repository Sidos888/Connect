/**
 * START REVIEWER OVERRIDE
 * 
 * Temporary Apple Reviewer login override
 * This code allows Apple reviewers to log in with email/password
 * instead of OTP magic links.
 * 
 * REMOVE THIS FILE AFTER APP STORE APPROVAL
 */

/**
 * Detects if the app is running in a review/testflight build
 * Returns true only for TestFlight or App Store Review builds
 * 
 * FOR TESTING: Also returns true if NEXT_PUBLIC_REVIEW_BUILD is set
 * OR if testing locally (development mode or Capacitor localhost)
 */
export function isReviewBuild(): boolean {
  // Check environment variable (set in build config for review builds OR for local testing)
  if (process.env.NEXT_PUBLIC_REVIEW_BUILD === 'true') {
    console.log('🍎 ReviewerAuth: Review build detected via environment variable');
    return true;
  }

  // Only check client-side (window exists)
  if (typeof window === 'undefined') {
    // Server-side: return false (will be checked client-side)
    return false;
  }

  // Check for development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('🍎 ReviewerAuth: Development mode - reviewer login enabled for testing');
    return true;
  }
  
  // Check if we're running on localhost (Capacitor localhost or browser localhost)
  // This catches local testing even when NODE_ENV might be 'production'
  const hostname = window.location.hostname;
  const href = window.location.href;
  const origin = window.location.origin;
  
  // Debug logging
  console.log('🍎 ReviewerAuth: Checking location:', { hostname, href, origin, NODE_ENV: process.env.NODE_ENV });
  
  // Check for Capacitor protocol (capacitor://)
  if (href.startsWith('capacitor://') || 
      origin.startsWith('capacitor://') ||
      href.includes('capacitor://localhost') || 
      href.includes('capacitor://')) {
    console.log('🍎 ReviewerAuth: Capacitor protocol detected - reviewer login enabled for testing');
    return true;
  }
  
  // Check for browser localhost
  if (hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      href.includes('localhost')) {
    console.log('🍎 ReviewerAuth: Browser localhost detected - reviewer login enabled for testing');
    return true;
  }
  
  // Check for TestFlight user agent (iOS)
  const userAgent = navigator.userAgent || '';
  
  // TestFlight builds have specific indicators
  if (userAgent.includes('TestFlight') || userAgent.includes('testflight')) {
    console.log('🍎 ReviewerAuth: Review build detected via TestFlight user agent');
    return true;
  }
  
  // Check for App Store review environment
  // Review builds often have specific bundle identifiers or other indicators
  // You can add more checks here if needed

  console.log('🍎 ReviewerAuth: Not a review build');
  return false;
}

/**
 * Reviewer email address
 */
export const REVIEWER_EMAIL = 'reviewer@connectos.app';

/**
 * Reviewer password
 */
export const REVIEWER_PASSWORD = 'SomethingStrong123!';

/**
 * Checks if the provided email is the reviewer email
 */
export function isReviewerEmail(email: string): boolean {
  return email.toLowerCase().trim() === REVIEWER_EMAIL.toLowerCase();
}

/**
 * END REVIEWER OVERRIDE
 */

