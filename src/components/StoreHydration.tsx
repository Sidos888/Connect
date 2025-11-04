"use client";

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * StoreHydration - Ensures Zustand store is hydrated on client side
 * This component should be mounted early in the app lifecycle
 */
export default function StoreHydration() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Ensure we're on the client side
    setIsMounted(true);
  }, []);

  const setHydrated = useAppStore((state) => state.setHydrated);
  const isHydrated = useAppStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isMounted) return;
    
    // Mark store as hydrated after mount
    // Use a small timeout to ensure persistence middleware has completed
    const timer = setTimeout(() => {
      if (!isHydrated) {
        console.log('🔄 StoreHydration: Marking store as hydrated');
        setHydrated(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [setHydrated, isHydrated, isMounted]);

  // This component doesn't render anything
  return null;
}

