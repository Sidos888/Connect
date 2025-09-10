"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import LoginModal from './LoginModal';
import SignUpModal from './SignUpModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Log in to see this page</h1>
            <p className="text-gray-600 mb-8">
              You need to be logged in to access this content. Sign in to your account or create a new one to get started.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowLogin(true)}
                className="w-full bg-brand text-white py-3 px-6 rounded-lg font-medium hover:bg-brand/90 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => setShowSignUp(true)}
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>

        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSwitchToSignUp={() => {
            setShowLogin(false);
            setShowSignUp(true);
          }}
        />

        <SignUpModal
          isOpen={showSignUp}
          onClose={() => setShowSignUp(false)}
          onSwitchToLogin={() => {
            setShowSignUp(false);
            setShowLogin(true);
          }}
        />
      </>
    );
  }

  return <>{children}</>;
}
