"use client";

import { ReactNode } from "react";

interface MobileTitleProps {
  title: string;
  showDivider?: boolean;
  action?: ReactNode;
  className?: string;
}

export default function MobileTitle({ title, showDivider = true, action, className }: MobileTitleProps) {
  
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[60] bg-white lg:hidden" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        backgroundColor: 'white'
      }}
    >
      <div className="pt-safe-top px-4 pb-2 pt-8 bg-white h-[96px] flex items-end">
        <div className="flex items-center justify-between w-full h-full">
          <h1 className={`text-2xl font-bold text-gray-900 ${className || ''}`}>{title}</h1>
          <div className="flex items-center justify-center h-full min-w-[40px] relative z-10">
            {action && (
              <div className="flex items-center justify-center">
                {action}
              </div>
            )}
          </div>
        </div>
      </div>
      {showDivider && <div className="border-t border-gray-200" />}
    </div>
  );
}
