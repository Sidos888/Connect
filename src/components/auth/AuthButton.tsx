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
      className={`w-48 sm:w-1/2 bg-brand text-white py-2.5 px-4 rounded-lg font-medium hover:bg-brand/90 transition-colors ${className}`}
      style={{
        paddingTop: '0.625rem',
        paddingBottom: '0.625rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        minHeight: '2.75rem',
        fontSize: '1rem',
        lineHeight: '1.5rem'
      }}
    >
      {children}
    </button>
  );
}
