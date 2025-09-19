"use client";

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/auth/LoginModal';
import SignUpModal from '@/components/auth/SignUpModal';
import { useAuth } from './authContext';

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
  const { signOut } = useAuth();

  // Listen for reset events to clear all modal states
  React.useEffect(() => {
    const handleResetModals = () => {
      console.log('ModalProvider: Resetting all modal states');
      setIsLoginOpen(false);
      setIsSignUpOpen(false);
    };

    window.addEventListener('reset-all-modals', handleResetModals);
    
    return () => {
      window.removeEventListener('reset-all-modals', handleResetModals);
    };
  }, []);

  const showLogin = () => {
    console.log('ModalProvider: showLogin called');
    console.log('ModalProvider: Current modal states:', { isLoginOpen, isSignUpOpen });
    setIsLoginOpen(true);
    setIsSignUpOpen(false);
    console.log('ModalProvider: Login modal should now be open');
  };

  const showSignUp = () => {
    console.log('ModalProvider: showSignUp called');
    console.log('ModalProvider: Current modal states:', { isLoginOpen, isSignUpOpen });
    setIsSignUpOpen(true);
    setIsLoginOpen(false);
    console.log('ModalProvider: SignUp modal should now be open');
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
        onClose={async () => {
          // NOT signing out - preserving user state
          console.log('ModalContext: Closing modal but preserving user authentication');
          setIsLoginOpen(false);
        }}
        onProfileSetup={() => {
          setIsLoginOpen(false);
          // Don't redirect to onboarding - let AccountCheckModal handle profile creation
        }}
      />

      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={async () => {
          // NOT signing out - preserving user state
          console.log('ModalContext: Closing modal but preserving user authentication');
          setIsSignUpOpen(false);
        }}
        onProfileSetup={() => {
          setIsSignUpOpen(false);
          // Don't redirect to onboarding - let AccountCheckModal handle profile creation
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
