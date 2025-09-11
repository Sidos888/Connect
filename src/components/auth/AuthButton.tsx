"use client";

import React from 'react';

interface AuthButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function AuthButton({ onClick, children, className = "" }: AuthButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-brand text-white py-2.5 px-6 rounded-lg font-medium hover:bg-brand/90 transition-colors ${className}`}
      style={{
        paddingTop: '0.625rem',
        paddingBottom: '0.625rem',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem'
      }}
    >
      {children}
    </button>
  );
}
