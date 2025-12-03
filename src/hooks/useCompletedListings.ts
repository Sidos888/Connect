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
        const justCompleted = localStorage.getItem('just_completed_listing');
        if (justCompleted) {
          localStorage.removeItem('just_completed_listing');
          setChecking(false);
          return;
        }

        // Check for a flag in localStorage to track which listings we've already shown
        const shownListings = JSON.parse(localStorage.getItem('shown_completed_listings') || '[]');

        // Get user's hosted listings that have ended but haven't been shown yet
        const { data: listings, error } = await supabase
          .from('listings')
          .select('id, title, end_date, has_gallery')
          .eq('host_id', account.id)
          .not('end_date', 'is', null)
          .lt('end_date', new Date().toISOString())
          .order('end_date', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error checking completed listings:', error);
          setChecking(false);
          return;
        }

        // Find the first listing that hasn't been shown yet
        if (listings && listings.length > 0) {
          const unshownListing = listings.find(l => !shownListings.includes(l.id));
          
          if (unshownListing) {
            // Mark this listing as shown
            const updatedShown = [...shownListings, unshownListing.id];
            localStorage.setItem('shown_completed_listings', JSON.stringify(updatedShown));
            
            // Redirect to complete page
            router.push(`/my-life/listing/complete?id=${unshownListing.id}`);
            return;
          }
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

