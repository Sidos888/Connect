"use client";

import React, { createContext, useContext, useState } from 'react';
import LoginModal from '@/components/auth/LoginModal';
import SignUpModal from '@/components/auth/SignUpModal';

interface ModalContextType {
  showLogin: () => void;
  showSignUp: () => void;
  hideModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

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
    <ModalContext.Provider value={{ showLogin, showSignUp, hideModals }}>
      {children}
      
      {/* Render modals at root level */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onProfileSetup={() => {
          setIsLoginOpen(false);
          // Handle profile setup - you can add logic here
          console.log('Profile setup needed');
        }}
      />

      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onProfileSetup={() => {
          setIsSignUpOpen(false);
          // Handle profile setup - you can add logic here
          console.log('Profile setup needed');
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
