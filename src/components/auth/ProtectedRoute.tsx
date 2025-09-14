"use client";

import React from 'react';
import { useAuth } from '@/lib/authContext';
import { usePathname } from 'next/navigation';
import AuthButton from './AuthButton';
import { useModal } from '@/lib/modalContext';
import { useAppStore } from '@/lib/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
  buttonText?: string;
}

export default function ProtectedRoute({ children, fallback, title, description, buttonText }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { personalProfile, isHydrated } = useAppStore();
  const { showLogin } = useModal();
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
    userId: user?.id,
    loading,
    isHydrated,
    personalProfile: personalProfile ? 'EXISTS' : 'NULL',
    personalProfileId: personalProfile?.id,
    pathname,
    title,
    description,
    buttonText,
    displayTitle,
    displayDescription,
    displayButtonText
  });

  // Wait for store to hydrate
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

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
          <div className="text-center w-full max-w-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {displayTitle}
            </h1>
            <div className="text-gray-600 mb-8 h-12 flex items-center justify-center">
              <p className="text-center">
                {displayDescription}
              </p>
            </div>
            <div className="mt-6 w-full flex justify-center">
              <AuthButton onClick={() => showLogin()}>
                Continue
              </AuthButton>
            </div>
          </div>
        </div>

      </>
    );
  }

  // User is authenticated but no profile - this shouldn't happen if guard is working
  if (user && !personalProfile) {
    console.log('ProtectedRoute: User authenticated but no profile - redirecting to onboarding');
    // Redirect to onboarding to complete profile
    window.location.href = '/onboarding';
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return <>{children}</>;
}