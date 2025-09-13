"use client";

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/auth/LoginModal';
import SignUpModal from '@/components/auth/SignUpModal';

interface ModalContextType {
  showLogin: () => void;
  showSignUp: () => void;
  hideModals: () => void;
  isAnyModalOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const router = useRouter();

  const showLogin = () => {
    setIsLoginOpen(true);
    setIsSignUpOpen(false);
  };

  const showSignUp = () => {
    setIsSignUpOpen(true);
    setIsLoginOpen(false);
  };

  const hideModals = () => {
    setIsLoginOpen(false);
    setIsSignUpOpen(false);
  };

  return (
    <ModalContext.Provider value={{ showLogin, showSignUp, hideModals, isAnyModalOpen: isLoginOpen || isSignUpOpen }}>
      {children}
      
      {/* Render modals at root level */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onProfileSetup={() => {
          setIsLoginOpen(false);
          router.push('/onboarding');
        }}
      />

      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onProfileSetup={() => {
          setIsSignUpOpen(false);
          router.push('/onboarding');
        }}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
