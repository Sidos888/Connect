"use client";

import { useAuth } from '@/lib/authContext';
import { listingsService } from '@/lib/listingsService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ListingCard from '@/components/listings/ListingCard';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Saved - Unified component for Saved page
 * Displays saved listings using the same ListingCard component as My Life page
 */
export default function Saved() {
  const { account } = useAuth();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Determine the correct 'from' parameter for navigation
  // If we're on /menu?view=saved, use that. Otherwise use /saved or current pathname
  const getFromPath = () => {
    // Normalize pathname (remove trailing slash)
    const normalizedPathname = pathname?.replace(/\/$/, '') || '';
    const viewParam = searchParams?.get('view');
    
    // Check if we're on the menu page with saved view
    if ((normalizedPathname === '/menu' || pathname === '/menu/') && viewParam === 'saved') {
      return '/menu?view=saved';
    }
    // If we're on menu page but view param is not saved, still return saved view for navigation
    if (normalizedPathname === '/menu' || pathname === '/menu/') {
      return '/menu?view=saved';
    }
    return '/menu?view=saved'; // Default to saved view
  };

  // Fetch saved listings
  const { data: savedData, isLoading } = useQuery({
    queryKey: ['listings', 'saved', account?.id],
    queryFn: async () => {
      if (!account?.id) return { listings: [], error: null };
      return await listingsService.getSavedListings(account.id);
    },
    enabled: !!account?.id,
    staleTime: 30 * 1000,
  });

  const savedListings = savedData?.listings || [];

  return (
    <div 
      className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" 
      style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">Loading saved listings...</p>
        </div>
      ) : savedListings.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">No saved listings yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {savedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              size="medium"
              showDate={true}
              from={getFromPath()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

