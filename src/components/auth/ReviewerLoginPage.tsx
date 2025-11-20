/**
 * START REVIEWER OVERRIDE
 * 
 * Temporary Apple Reviewer login page
 * This page appears before the normal login flow in review builds
 * 
 * REMOVE THIS FILE AFTER APP STORE APPROVAL
 */

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { isReviewBuild, REVIEWER_EMAIL, REVIEWER_PASSWORD } from '@/lib/reviewerAuth';

export default function ReviewerLoginPage() {
  const router = useRouter();
  const { signInWithPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only show this page in review builds
  if (!isReviewBuild()) {
    return null;
  }

  const handleReviewerLogin = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🍎 ReviewerLoginPage: Attempting reviewer login');
      const { error: loginError } = await signInWithPassword(REVIEWER_EMAIL, REVIEWER_PASSWORD);
      
      if (loginError) {
        console.error('🍎 ReviewerLoginPage: Login failed:', loginError.message);
        setError(loginError.message || 'Failed to log in');
        setLoading(false);
        return;
      }

      console.log('🍎 ReviewerLoginPage: Login successful, redirecting...');
      // Redirect to main app
      router.push('/my-life');
    } catch (err) {
      console.error('🍎 ReviewerLoginPage: Error during login:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleNormalSignIn = () => {
    // Navigate to explore page (the normal unsigned-in view)
    router.push('/explore');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Connect
          </h1>
          <p className="text-sm text-gray-500">
            Review Build Login
          </p>
        </div>

        <div className="space-y-4">
          {/* Apple Reviewer Login Card */}
          <button
            onClick={handleReviewerLogin}
            disabled={loading}
            className="w-full bg-white rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow',
              minHeight: '120px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            <div className="text-5xl mb-3">🍎</div>
            <div className="text-base font-semibold text-gray-900">
              {loading ? 'Logging in...' : 'Apple Reviewer Login'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Instant sign in
            </div>
          </button>

          {/* Normal Sign In Card */}
          <button
            onClick={handleNormalSignIn}
            disabled={loading}
            className="w-full bg-white rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow',
              minHeight: '120px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            <div className="text-base font-semibold text-gray-900">
              Normal Sign In
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Continue to explore page
            </div>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400 text-center">
          This is a review build. Use "Apple Reviewer Login" to bypass OTP verification.
        </p>
      </div>
    </div>
  );
}

/**
 * END REVIEWER OVERRIDE
 */

