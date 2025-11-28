"use client";

import { ReactNode } from "react";

export interface ActionButton {
  icon: ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;  // Subtitle or additional content below title (centered)
  backButton?: boolean;
  backIcon?: 'arrow' | 'close';  // 'arrow' for mobile, 'close' (X) for web modals
  onBack?: () => void;
  customBackButton?: ReactNode;  // Custom back button (e.g., profile avatar)
  leftSection?: ReactNode;  // Custom left section (e.g., profile card)
  actions?: ActionButton[];
  customActions?: ReactNode;  // Custom action buttons (full control over styling)
  className?: string;
  titleClassName?: string;  // Custom className for the title
  frostedGlass?: boolean;  // Enable iOS-style frosted glass effect (for listing page)
}

export default function PageHeader({
  title,
  subtitle,
  backButton = false,
  backIcon = 'arrow',
  onBack,
  customBackButton,
  leftSection,
  actions = [],
  customActions,
  className = "",
  titleClassName = "",
  frostedGlass = false  // New iOS-style frosted glass effect
}: PageHeaderProps) {
  // Detect platform (mobile vs web)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  // Platform-specific blur heights
  const blurHeight = isMobile ? '135px' : '100px';
  
  // iOS-style frosted glass effect (for listing page)
  if (frostedGlass) {
    const headerHeight = isMobile ? '110px' : '100px';
    
    return (
      <div className={`absolute top-0 left-0 right-0 z-20 ${className}`} style={{ 
        pointerEvents: 'none'
      }}>
        {/* Single Blur Background - iOS style (semi-transparent to allow blur visibility) */}
        <div className="absolute top-0 left-0 right-0" style={{
          height: headerHeight,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(255, 255, 255, 0.4)'  // Subtle transparency to allow blur effect to show through
        }} />
        
        {/* Gradient Overlay - White gradient from 30% to 5% opacity (on top of blur) */}
        <div className="absolute top-0 left-0 right-0" style={{
          height: headerHeight,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%)'
        }} />
        
        {/* Header Content */}
        <div className="px-4 lg:px-8" style={{ 
          paddingTop: isMobile ? 'max(env(safe-area-inset-top), 70px)' : '32px',
          paddingBottom: '16px',
          position: 'relative',
          zIndex: 10 // Increased z-index for content area
        }}>
          {/* Left Section (e.g., profile card) OR Standard Layout */}
          {leftSection ? (
            <div style={{ 
              pointerEvents: 'auto', 
              position: 'relative', 
              zIndex: 20,
              height: isMobile ? '44px' : '40px', // Fixed height to match back button for proper centering
              display: 'flex',
              alignItems: 'center' // Center children vertically
            }}>
              {/* Back Button - Always show when backButton is true, even with leftSection */}
              {backButton && onBack && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBack();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBack();
                  }}
                  className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    top: '0', // Keep original position
                    width: isMobile ? '44px' : '40px',
                    height: isMobile ? '44px' : '40px',
                    borderRadius: '22px',
                    background: 'rgba(255, 255, 255, 0.96)',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    zIndex: 30 // Higher z-index to ensure it's above profile card and overlay
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  aria-label={backIcon === 'close' ? 'Close' : 'Back'}
                >
                  {backIcon === 'close' ? (
                    <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  )}
                </button>
              )}
              {leftSection}
            </div>
          ) : (
            <div className="relative w-full" style={{ 
              width: '100%', 
              minHeight: subtitle ? '56px' : (isMobile ? '44px' : '40px'),
              pointerEvents: 'auto'
            }}>
              {/* Left: Back Button or Custom Button */}
              {customBackButton ? (
                <div style={{ position: 'absolute', left: 0, top: 0, height: isMobile ? '44px' : '40px', display: 'flex', alignItems: 'center' }}>
                  {customBackButton}
                </div>
              ) : backButton && onBack ? (
                <button
                  onClick={onBack}
                  className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    top: '0',
                    width: isMobile ? '44px' : '40px',
                    height: isMobile ? '44px' : '40px',
                    borderRadius: '22px',
                    background: 'rgba(255, 255, 255, 0.96)',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  aria-label={backIcon === 'close' ? 'Close' : 'Back'}
                >
                  {backIcon === 'close' ? (
                    <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  )}
                </button>
              ) : null}
              
              {/* Center: Title and Subtitle */}
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: subtitle ? '0' : '0', height: subtitle ? 'auto' : (isMobile ? '44px' : '40px'), justifyContent: subtitle ? 'flex-start' : 'center' }}>
                <h1 
                  className={`font-semibold text-gray-900 text-center ${className} ${titleClassName}`}
                  style={{ 
                    textAlign: 'center', 
                    fontSize: isMobile ? '22px' : '20px',
                    lineHeight: isMobile ? '28px' : '24px',
                    height: isMobile ? '44px' : '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 1  // Fully opaque title
                  }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <div style={{ marginTop: '4px' }}>
                    {subtitle}
                  </div>
                )}
              </div>
              
              {/* Right: Action Buttons (max 2) or Custom Actions */}
              {customActions ? (
                <div className="absolute right-0 flex items-center gap-3" style={{ top: '0', height: isMobile ? '44px' : '40px' }}>
                  {customActions}
                </div>
              ) : actions.length > 0 ? (
                <div className="absolute right-0 flex items-center gap-3" style={{ top: '0', height: isMobile ? '44px' : '40px' }}>
                  {actions.slice(0, 2).map((action, index) => (
                    <button
                      key={index}
                      className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                      style={{
                        width: isMobile ? '44px' : '40px',
                        height: isMobile ? '44px' : '40px',
                        borderRadius: '100px',
                        background: 'rgba(255, 255, 255, 0.96)',
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0px 2px 4px rgba(0,0,0,0.04)',
                        willChange: 'transform, box-shadow',
                        cursor: action.disabled ? 'default' : 'pointer',
                        opacity: action.disabled ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!action.disabled) {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0px 2px 4px rgba(0,0,0,0.04)';
                      }}
                      onClick={action.disabled ? undefined : action.onClick}
                      aria-label={action.label}
                      disabled={action.disabled}
                    >
                      {action.icon}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Original style (default - easy to revert)
  return (
    <div className={`absolute top-0 left-0 right-0 z-20 ${className}`} style={{ 
      pointerEvents: 'none'
    }}>
      {/* Compact Opacity Gradient - Platform specific */}
      <div className="absolute top-0 left-0 right-0" style={{
        height: blurHeight,
        background: isMobile 
          ? 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.78) 20%, rgba(255,255,255,0.68) 40%, rgba(255,255,255,0.62) 60%, rgba(255,255,255,0.58) 80%, rgba(255,255,255,0.3) 100%)'
          : 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.78) 20%, rgba(255,255,255,0.68) 40%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.25) 80%, rgba(255,255,255,0.05) 100%)'
      }} />
      
      {/* Compact Progressive Blur - 5 layers */}
      {isMobile ? (
        <>
          {/* Mobile blur layers (27px each = 135px total) */}
          <div className="absolute top-0 left-0 right-0" style={{
            height: '27px',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)'
          }} />
          <div className="absolute left-0 right-0" style={{
            top: '27px',
            height: '27px',
            backdropFilter: 'blur(1.5px)',
            WebkitBackdropFilter: 'blur(1.5px)'
          }} />
          <div className="absolute left-0 right-0" style={{
            top: '54px',
            height: '27px',
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)'
          }} />
          <div className="absolute left-0 right-0" style={{
            top: '81px',
            height: '27px',
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)'
          }} />
          <div className="absolute left-0 right-0" style={{
            top: '108px',
            height: '27px',
            backdropFilter: 'blur(0.6px)',
            WebkitBackdropFilter: 'blur(0.6px)'
          }} />
        </>
      ) : (
        <>
          {/* Web blur layers (20px each = 100px total) */}
          <div className="absolute top-0 left-0 right-0" style={{
            height: '20px',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)'
          }} />
          <div className="absolute left-0 right-0" style={{
            top: '20px',
            height: '20px',
            backdropFilter: 'blur(1.5px)',
            WebkitBackdropFilter: 'blur(1.5px)'
          }} />
          <div className="absolute left-0 right-0" style={{
            top: '40px',
            height: '20px',
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)'
          }} />
          <div className="absolute left-0 right-0" style={{
            top: '60px',
            height: '20px',
            backdropFilter: 'blur(0.5px)',
            WebkitBackdropFilter: 'blur(0.5px)'
          }} />
          <div className="absolute left-0 right-0" style={{
            top: '80px',
            height: '20px',
            backdropFilter: 'blur(0.2px)',
            WebkitBackdropFilter: 'blur(0.2px)'
          }} />
        </>
      )}
    
      {/* Header Content */}
      <div className="px-4 lg:px-8" style={{ 
        paddingTop: isMobile ? 'max(env(safe-area-inset-top), 70px)' : '32px',
        paddingBottom: '16px',
        position: 'relative',
        zIndex: 10 // Increased z-index for content area
      }}>
        {/* Left Section (e.g., profile card) OR Standard Layout */}
        {leftSection ? (
          <div style={{ 
            pointerEvents: 'auto', 
            position: 'relative', 
            zIndex: 20,
            height: isMobile ? '44px' : '40px', // Fixed height to match back button for proper centering
            display: 'flex',
            alignItems: 'center' // Center children vertically
          }}>
            {/* Back Button - Always show when backButton is true, even with leftSection */}
            {backButton && onBack && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBack();
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBack();
                }}
                className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  top: '0', // Keep original position
                  width: isMobile ? '44px' : '40px',
                  height: isMobile ? '44px' : '40px',
                  borderRadius: '22px',
                  background: 'rgba(255, 255, 255, 0.96)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow',
                  zIndex: 30 // Higher z-index to ensure it's above profile card and overlay
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                aria-label={backIcon === 'close' ? 'Close' : 'Back'}
              >
                {backIcon === 'close' ? (
                  <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                )}
              </button>
            )}
            {leftSection}
          </div>
        ) : (
          <div className="relative w-full" style={{ 
            width: '100%', 
            minHeight: subtitle ? '56px' : (isMobile ? '44px' : '40px'),
            pointerEvents: 'auto'
          }}>
            {/* Left: Back Button or Custom Button */}
            {customBackButton ? (
              <div style={{ position: 'absolute', left: 0, top: 0, height: isMobile ? '44px' : '40px', display: 'flex', alignItems: 'center' }}>
                {customBackButton}
              </div>
            ) : backButton && onBack ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBack();
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBack();
                }}
                className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  top: '0',
                  width: isMobile ? '44px' : '40px',
                  height: isMobile ? '44px' : '40px',
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                aria-label={backIcon === 'close' ? 'Close' : 'Back'}
              >
                {backIcon === 'close' ? (
                  <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                )}
              </button>
            ) : null}
            
            {/* Center: Title and Subtitle */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: subtitle ? '0' : '0', height: subtitle ? 'auto' : (isMobile ? '44px' : '40px'), justifyContent: subtitle ? 'flex-start' : 'center' }}>
              <h1 
                className={`font-semibold text-gray-900 text-center ${className} ${titleClassName}`}
                style={{ 
                  textAlign: 'center', 
                  fontSize: isMobile ? '22px' : '20px',
                  lineHeight: isMobile ? '28px' : '24px',
                  height: isMobile ? '44px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <div style={{ marginTop: '4px' }}>
                  {subtitle}
                </div>
              )}
            </div>
            
            {/* Right: Action Buttons (max 2) or Custom Actions */}
            {customActions ? (
              <div className="absolute right-0 flex items-center gap-3" style={{ top: '0', height: isMobile ? '44px' : '40px' }}>
                {customActions}
              </div>
            ) : actions.length > 0 ? (
              <div className="absolute right-0 flex items-center gap-3" style={{ top: '0', height: isMobile ? '44px' : '40px' }}>
                {actions.slice(0, 2).map((action, index) => (
                  <button
                    key={index}
                    className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                    style={{
                      width: isMobile ? '44px' : '40px',
                      height: isMobile ? '44px' : '40px',
                      borderRadius: '100px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow',
                      cursor: action.disabled ? 'default' : 'pointer',
                      opacity: action.disabled ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!action.disabled) {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onClick={action.disabled ? undefined : action.onClick}
                    aria-label={action.label}
                    disabled={action.disabled}
                  >
                    {action.icon}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}


