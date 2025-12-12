import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';

export function useCompletedListings() {
  const router = useRouter();
  const { account } = useAuth();
  const supabase = getSupabaseClient();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkCompletedListings = async () => {
      if (!account?.id) {
        setChecking(false);
        return;
      }

      try {
        // Check if there's a flag in localStorage to skip check (just completed)
        // This prevents immediate redirect loop after user completes the screen
        const justCompleted = localStorage.getItem('just_completed_listing');
        if (justCompleted) {
          localStorage.removeItem('just_completed_listing');
          setChecking(false);
          return;
        }

        // Get user's hosted listings that have ended
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, end_date, has_gallery')
          .eq('host_id', account.id)
          .not('end_date', 'is', null)
          .lt('end_date', new Date().toISOString())
          .order('end_date', { ascending: false })
          .limit(10);

        if (listingsError) {
          console.error('Error checking completed listings:', listingsError);
          setChecking(false);
          return;
        }

        if (!listings || listings.length === 0) {
          setChecking(false);
          return;
        }

        // Get list of listing IDs that have already been shown to this user
        const { data: shownScreens, error: shownError } = await supabase
          .from('shown_completion_screens')
          .select('listing_id')
          .eq('user_id', account.id);

        if (shownError) {
          console.error('Error checking shown completion screens:', shownError);
          // Continue anyway - better to show screen twice than never show it
        }

        const shownListingIds = new Set((shownScreens || []).map(s => s.listing_id));

        // Find the first listing that hasn't been shown yet
        const unshownListing = listings.find(l => !shownListingIds.has(l.id));
          
          if (unshownListing) {
          // Mark this listing as shown in database BEFORE redirecting
          // This prevents race conditions if user navigates away quickly
          const { error: insertError } = await supabase
            .from('shown_completion_screens')
            .insert({
              user_id: account.id,
              listing_id: unshownListing.id
            });

          if (insertError) {
            console.error('Error marking completion screen as shown:', insertError);
            // Continue anyway - redirect to screen even if insert fails
          } else {
            console.log('✅ Marked completion screen as shown in database:', unshownListing.id);
          }
            
            // Redirect to complete page
            router.push(`/my-life/listing/complete?id=${unshownListing.id}`);
            return;
        }

        setChecking(false);
      } catch (error) {
        console.error('Error in checkCompletedListings:', error);
        setChecking(false);
      }
    };

    checkCompletedListings();
  }, [account?.id, supabase, router]);

  return { checking };
}

