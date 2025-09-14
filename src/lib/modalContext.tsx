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
        onClose={async () => {
          // Sign out to clean up any partial authentication
          try {
            await signOut();
          } catch (error) {
            console.error('Error signing out during modal close:', error);
          }
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
          // Sign out to clean up any partial authentication
          try {
            await signOut();
          } catch (error) {
            console.error('Error signing out during modal close:', error);
          }
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
