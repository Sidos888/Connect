"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { getSupabaseClient } from '@/lib/supabaseClient';

export function useHappeningNow() {
  const { account } = useAuth();
  const supabase = getSupabaseClient();
  // Initialize as null to differentiate between "loading" and "no events"
  const [hasActiveEvents, setHasActiveEvents] = useState<boolean | null>(null);

  useEffect(() => {
    const checkActiveEvents = async () => {
      if (!account?.id || !supabase) {
        setHasActiveEvents(false);
        return;
      }

      try {
        const now = new Date().toISOString();

        // Get user's participating listings that are currently happening
        const { data: participants } = await supabase
          .from('listing_participants')
          .select('listing_id')
          .eq('user_id', account.id);

        if (!participants || participants.length === 0) {
          setHasActiveEvents(false);
          return;
        }

        const listingIds = participants.map(p => p.listing_id);

        // Check if any listings are currently active
        const { data: listings } = await supabase
          .from('listings')
          .select('id')
          .in('id', listingIds)
          .lte('start_date', now)
          .gte('end_date', now)
          .limit(1);

        setHasActiveEvents(listings && listings.length > 0);
      } catch (error) {
        console.error('Error checking active events:', error);
        setHasActiveEvents(false);
      }
    };

    checkActiveEvents();

    // Check every minute for event status changes
    const interval = setInterval(checkActiveEvents, 60000);

    return () => clearInterval(interval);
  }, [account?.id, supabase]);

  return hasActiveEvents;
}

