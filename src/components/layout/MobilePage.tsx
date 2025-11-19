"use client";

import { ReactNode } from "react";

export interface MobilePageProps {
  children: ReactNode;
}

/**
 * MobilePage - Essential wrapper for all mobile full-screen pages
 * 
 * Provides the critical container that:
 * - Locks page to viewport (fixed positioning)
 * - Prevents body scroll (overflow-hidden)
 * - Enables flex layout for PageHeader + PageContent
 * - Hides scrollbars
 * 
 * REQUIRED for mobile pages using PageHeader/PageContent!
 */
export default function MobilePage({ children }: MobilePageProps) {
  return (
    <div 
      className="fixed inset-0 z-[60] h-screen bg-white flex flex-col"
      style={{
        overflowX: 'hidden',
        overflowY: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

