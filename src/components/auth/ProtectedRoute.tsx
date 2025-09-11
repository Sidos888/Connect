"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { usePathname } from 'next/navigation';
import LoginModal from './LoginModal';
import SignUpModal from './SignUpModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
  buttonText?: string;
}

export default function ProtectedRoute({ children, fallback, title, description, buttonText }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const pathname = usePathname();

  // Get custom messages based on the current path if props are not provided
  const getCustomMessages = () => {
    if (title && description && buttonText) {
      return { title, description, buttonText };
    }

    // Normalize pathname by removing trailing slash
    const normalizedPath = pathname.replace(/\/$/, '') || '/';

    // Fallback to path-based messages
    switch (normalizedPath) {
      case '/chat':
        return {
          title: "Chats",
          description: "Log in / sign up to view chats",
          buttonText: "Log in"
        };
      case '/my-life':
        return {
          title: "My Life",
          description: "Log in / sign up to view your personal events and activities",
          buttonText: "Log in"
        };
      case '/menu':
        return {
          title: "Menu",
          description: "Log in / sign up to access your account settings and preferences",
          buttonText: "Log in"
        };
      default:
        return {
          title: "Log in to see this page",
          description: "You need to be logged in to access this content. Sign in to your account or create a new one to get started.",
          buttonText: "Log in"
        };
    }
  };

  const { title: displayTitle, description: displayDescription, buttonText: displayButtonText } = getCustomMessages();

  // Debug logging to see what's happening
  console.log('ProtectedRoute Debug:', {
    user: user ? 'SIGNED IN' : 'NOT SIGNED IN',
    loading,
    pathname,
    title,
    description,
    buttonText,
    displayTitle,
    displayDescription,
    displayButtonText
  });

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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {displayTitle}
            </h1>
            <p className="text-gray-600 mb-8">
              {displayDescription}
            </p>
            <div className="mt-8">
              <button
                onClick={() => setShowLogin(true)}
                className="w-full bg-brand text-white py-4 px-8 rounded-lg font-medium hover:bg-brand/90 transition-colors text-lg"
              >
                Continue
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