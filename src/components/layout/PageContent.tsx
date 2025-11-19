"use client";

import { ReactNode } from "react";

export interface PageContentProps {
  children: ReactNode;
  bottomBlur?: boolean;
  className?: string;
}

export default function PageContent({
  children,
  bottomBlur = true,
  className = ""
}: PageContentProps) {
  return (
    <>
      {/* Content wrapper - no padding (content handles its own) */}
      <div 
        className={`flex-1 overflow-y-auto scrollbar-hide ${className}`}
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          overflowX: 'hidden',
        }}
      >
        {children}
      </div>
      
      {/* Bottom Blur - 4 layers (80px) */}
      {bottomBlur && (
        <div className="absolute bottom-0 left-0 right-0 z-20" style={{ 
          pointerEvents: 'none'
        }}>
          {/* Bottom Opacity Gradient (80px height) */}
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: '80px',
            background: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0) 100%)'
          }} />
          
          {/* Light blur layers - 4 layers */}
          
          {/* Bottom blur 4: 0.5px (0-20px from bottom) */}
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: '20px',
            backdropFilter: 'blur(0.5px)',
            WebkitBackdropFilter: 'blur(0.5px)'
          }} />
          
          {/* Bottom blur 3: 0.3px (20-40px from bottom) */}
          <div className="absolute left-0 right-0" style={{
            bottom: '20px',
            height: '20px',
            backdropFilter: 'blur(0.3px)',
            WebkitBackdropFilter: 'blur(0.3px)'
          }} />
          
          {/* Bottom blur 2: 0.15px (40-60px from bottom) */}
          <div className="absolute left-0 right-0" style={{
            bottom: '40px',
            height: '20px',
            backdropFilter: 'blur(0.15px)',
            WebkitBackdropFilter: 'blur(0.15px)'
          }} />
          
          {/* Bottom blur 1: 0.05px (60-80px from bottom) - imperceptible */}
          <div className="absolute left-0 right-0" style={{
            bottom: '60px',
            height: '20px',
            backdropFilter: 'blur(0.05px)',
            WebkitBackdropFilter: 'blur(0.05px)'
          }} />
        </div>
      )}
    </>
  );
}

