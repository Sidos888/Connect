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
      className={`w-1/2 bg-brand text-white py-1.5 px-4 rounded-lg font-medium hover:bg-brand/90 transition-colors ${className}`}
      style={{
        paddingTop: '0.375rem',
        paddingBottom: '0.375rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        minHeight: '1.75rem',
        fontSize: '0.875rem',
        lineHeight: '1.25rem'
      }}
    >
      {children}
    </button>
  );
}
