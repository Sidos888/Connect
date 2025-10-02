import { useEffect, useRef } from 'react';

/**
 * Hook to handle iOS Safari viewport changes when keyboard appears
 * Sets CSS custom property --vvh for fallback when 100dvh isn't supported
 */
export function useVisualViewport() {
  useEffect(() => {
    // Only run on iOS Safari
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                       !window.MSStream && 
                       'visualViewport' in window;

    if (!isIOSSafari || !window.visualViewport) {
      return;
    }

    const updateViewportHeight = () => {
      const vvh = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--vvh', `${vvh}px`);
    };

    // Set initial value
    updateViewportHeight();

    // Listen for viewport changes
    window.visualViewport.addEventListener('resize', updateViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
    };
  }, []);
}

/**
 * Hook to detect if we're on iOS Safari
 */
export function useIsIOSSafari() {
  return typeof window !== 'undefined' && 
         /iPad|iPhone|iPod/.test(navigator.userAgent) && 
         !window.MSStream && 
         'visualViewport' in window;
}

/**
 * Hook to measure and set CSS custom properties for header and composer heights
 */
export function useChatLayoutHeights() {
  const headerRef = useRef<HTMLElement>(null);
  const composerRef = useRef<HTMLElement>(null);

  const updateHeights = () => {
    if (headerRef.current) {
      const headerHeight = headerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--chat-header-h', `${headerHeight}px`);
    }
    if (composerRef.current) {
      const composerHeight = composerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--chat-composer-h', `${composerHeight}px`);
    }
  };

  useEffect(() => {
    // Initial measurement
    updateHeights();

    // Update on resize
    const handleResize = () => updateHeights();
    window.addEventListener('resize', handleResize);

    // Update on VisualViewport changes (iOS keyboard)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

  return { headerRef, composerRef };
}
