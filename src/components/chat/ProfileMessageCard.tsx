"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Avatar from '@/components/Avatar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ProfileMessageCardProps {
  connectId: string;
  chatId: string;
  onLongPress?: (element: HTMLElement) => void;
  onProfileClick?: (userId: string) => void; // Callback to open profile modal
}

interface ProfileData {
  id: string;
  name: string;
  profile_pic?: string | null;
  connect_id: string;
}

export default function ProfileMessageCard({ connectId, chatId, onLongPress, onProfileClick }: ProfileMessageCardProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          console.error('ProfileMessageCard: Supabase client not available');
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('accounts')
          .select('id, name, profile_pic, connect_id')
          .eq('connect_id', connectId.toUpperCase())
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error('Error in fetchProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (connectId) {
      fetchProfile();
    }
  }, [connectId]);

  const handleClick = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('🔵 ProfileMessageCard: Clicked', { connectId, chatId, profile });
    
    if (!profile?.id) {
      console.warn('🔵 ProfileMessageCard: No profile data available, cannot open profile');
      return;
    }
    
    // If onProfileClick callback is provided, use it to open modal (preferred)
    if (onProfileClick) {
      console.log('🔵 ProfileMessageCard: Opening profile modal via callback', { userId: profile.id });
      onProfileClick(profile.id);
      return;
    }
    
    // Fallback: Navigate to profile page (for backwards compatibility)
    console.log('🔵 ProfileMessageCard: No callback provided, falling back to navigation');
    const currentPath = `/chat/individual?chat=${chatId}`;
    const profileUrl = `/p/${connectId}?from=${encodeURIComponent(currentPath)}`;
    
    // Check if running in Capacitor (to avoid RSC payload errors)
    const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
    
    if (isCapacitor) {
      // Use window.location.href for Capacitor to avoid RSC payload errors
      window.location.href = profileUrl;
    } else {
      // Use router.push for web
      router.push(profileUrl);
    }
  };

  // Long press detection
  const isLongPressRef = useRef(false);
  const touchStartTimeRef = useRef<number>(0);
  const touchStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    isLongPressRef.current = false;
    hasMovedRef.current = false;
    touchStartTimeRef.current = Date.now();
    
    const touch = e.touches[0];
    touchStartPositionRef.current = { x: touch.clientX, y: touch.clientY };
    
    if (!onLongPress) return;
    
    longPressTimerRef.current = setTimeout(async () => {
      if (!hasMovedRef.current) {
        isLongPressRef.current = true;
        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (error) {
          // Haptics not available, silently fail
        }
        if (containerRef.current && onLongPress) {
          onLongPress(containerRef.current);
        }
      }
    }, 500);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTimeRef.current;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Only trigger click if it was a valid tap (quick, minimal movement)
    const isValidTap = touchDuration < 500 && !isLongPressRef.current && !hasMovedRef.current;

    console.log('🔵 ProfileMessageCard: Touch end', { 
      isValidTap, 
      touchDuration, 
      isLongPress: isLongPressRef.current, 
      hasMoved: hasMovedRef.current 
    });

    if (isValidTap && !isLongPressRef.current) {
      console.log('🔵 ProfileMessageCard: Valid tap detected, calling handleClick');
      handleClick(e);
    }

    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartPositionRef.current && e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      const movementDistance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPositionRef.current.x, 2) +
        Math.pow(touch.clientY - touchStartPositionRef.current.y, 2)
      );

      if (movementDistance > 10) {
        hasMovedRef.current = true;
      }
    }

    if (longPressTimerRef.current && hasMovedRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (hasMovedRef.current) {
      isLongPressRef.current = false;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    isLongPressRef.current = false;
    touchStartTimeRef.current = Date.now();
    
    if (!onLongPress) return;
    
    longPressTimerRef.current = setTimeout(async () => {
      if (!hasMovedRef.current) {
        isLongPressRef.current = true;
        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (error) {
          // Haptics not available, silently fail
        }
        if (containerRef.current && onLongPress) {
          onLongPress(containerRef.current);
        }
      }
    }, 500);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const clickDuration = Date.now() - touchStartTimeRef.current;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    console.log('🔵 ProfileMessageCard: Mouse up', { 
      clickDuration, 
      isLongPress: isLongPressRef.current 
    });

    if (clickDuration < 500 && !isLongPressRef.current) {
      console.log('🔵 ProfileMessageCard: Valid click detected, calling handleClick');
      handleClick(e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  if (loading || !profile) {
    return (
      <div 
        className="bg-white rounded-2xl p-4" 
        style={{
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          width: '70vw',
          maxWidth: '70vw'
        }}
      >
        <div className="text-sm text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onClick={(e) => {
        console.log('🔵 ProfileMessageCard: onClick handler triggered', { connectId, chatId });
        e.preventDefault();
        e.stopPropagation();
        handleClick(e);
      }}
      className="bg-white rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:opacity-90"
      style={{
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
        width: '70vw',
        maxWidth: '70vw',
        minWidth: '70vw',
        height: '64px',
        minHeight: '64px',
        maxHeight: '64px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        pointerEvents: 'auto',
        position: 'relative',
        zIndex: 10
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        handleTouchStart(e);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        handleTouchEnd(e);
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        handleTouchMove(e);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        handleMouseDown(e);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        handleMouseUp(e);
      }}
    >
      {/* Profile Avatar */}
      <div className="flex-shrink-0">
        <Avatar
          src={profile.profile_pic || undefined}
          name={profile.name}
          size={40}
        />
      </div>
      
      {/* Profile Name */}
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold text-gray-900 truncate">
          {profile.name}
        </div>
      </div>
    </div>
  );
}

