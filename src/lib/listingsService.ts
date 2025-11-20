import { getSupabaseClient } from './supabaseClient';

export interface Listing {
  id: string;
  host_id: string;
  title: string;
  summary: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  is_public: boolean;
  photo_urls: string[] | null;
  created_at: string;
  updated_at: string;
  // Joined from listing_participants
  role?: 'host' | 'participant';
  status?: 'upcoming' | 'completed' | 'cancelled';
}

export class ListingsService {
  private supabase = getSupabaseClient();

  /**
   * Get upcoming listings for a user (where they are a participant with status='upcoming')
   */
  async getUpcomingListings(userId: string): Promise<{ listings: Listing[]; error: Error | null }> {
    if (!this.supabase) {
      return { listings: [], error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await this.supabase
        .from('listing_participants')
        .select(`
          listing_id,
          role,
          status,
          listings (
            id,
            host_id,
            title,
            summary,
            location,
            start_date,
            end_date,
            capacity,
            is_public,
            photo_urls,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'upcoming')
        .order('created_at', { foreignTable: 'listings', ascending: false });

      if (error) {
        console.error('Error fetching upcoming listings:', error);
        return { listings: [], error };
      }

      const now = new Date();
      const listings: Listing[] = (data || [])
        .map((item: any) => ({
          ...item.listings,
          role: item.role,
          status: item.status,
        }))
        .filter((listing: any) => {
          // Filter out null listings
          if (!listing.id) return false;
          // Only show listings that haven't started yet (start_date > now or null)
          if (!listing.start_date) return true;
          const listingDate = new Date(listing.start_date);
          return listingDate > now;
        });

      return { listings, error: null };
    } catch (error) {
      console.error('Error in getUpcomingListings:', error);
      return { listings: [], error: error as Error };
    }
  }

  /**
   * Get hosting listings for a user (where they are a participant with role='host' and status='upcoming')
   */
  async getHostingListings(userId: string): Promise<{ listings: Listing[]; error: Error | null }> {
    if (!this.supabase) {
      return { listings: [], error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await this.supabase
        .from('listing_participants')
        .select(`
          listing_id,
          role,
          status,
          listings (
            id,
            host_id,
            title,
            summary,
            location,
            start_date,
            end_date,
            capacity,
            is_public,
            photo_urls,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .eq('role', 'host')
        .eq('status', 'upcoming')
        .order('created_at', { foreignTable: 'listings', ascending: false });

      if (error) {
        console.error('Error fetching hosting listings:', error);
        return { listings: [], error };
      }

      const now = new Date();
      const listings: Listing[] = (data || [])
        .map((item: any) => ({
          ...item.listings,
          role: item.role,
          status: item.status,
        }))
        .filter((listing: any) => {
          // Filter out null listings
          if (!listing.id) return false;
          // Only show listings that haven't started yet (start_date > now or null)
          if (!listing.start_date) return true;
          const listingDate = new Date(listing.start_date);
          return listingDate > now;
        });

      return { listings, error: null };
    } catch (error) {
      console.error('Error in getHostingListings:', error);
      return { listings: [], error: error as Error };
    }
  }

  /**
   * Get past/completed listings for a user (where start_date < now)
   * Includes all listings the user has hosted or attended that have completed
   */
  async getHistoryListings(userId: string): Promise<{ listings: Listing[]; error: Error | null }> {
    if (!this.supabase) {
      return { listings: [], error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await this.supabase
        .from('listing_participants')
        .select(`
          listing_id,
          role,
          status,
          listings (
            id,
            host_id,
            title,
            summary,
            location,
            start_date,
            end_date,
            capacity,
            is_public,
            photo_urls,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { foreignTable: 'listings', ascending: false });

      if (error) {
        console.error('Error fetching history listings:', error);
        return { listings: [], error };
      }

      const now = new Date();
      const listings: Listing[] = (data || [])
        .map((item: any) => ({
          ...item.listings,
          role: item.role,
          status: item.status,
        }))
        .filter((listing: any) => {
          // Filter out null listings
          if (!listing.id) return false;
          // Only show listings that have completed (start_date < now)
          if (!listing.start_date) return false;
          const listingDate = new Date(listing.start_date);
          return listingDate < now;
        });

      return { listings, error: null };
    } catch (error) {
      console.error('Error in getHistoryListings:', error);
      return { listings: [], error: error as Error };
    }
  }

  /**
   * Get public listings for the "For You" page
   * Returns listings that are public and upcoming (start_date in the future or null)
   */
  async getPublicListings(limit: number = 50): Promise<{ listings: Listing[]; error: Error | null }> {
    if (!this.supabase) {
      return { listings: [], error: new Error('Supabase client not available') };
    }

    try {
      const now = new Date().toISOString();
      console.log('getPublicListings: Fetching with filters:', { is_public: true, now, limit });
      
      // First, try to get all public listings (without date filter) to see what we have
      const { data: allPublicData, error: allPublicError } = await this.supabase
        .from('listings')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit * 2); // Get more to see what's being filtered
      
      console.log('getPublicListings: All public listings (no date filter):', {
        count: allPublicData?.length || 0,
        error: allPublicError?.message,
        listings: allPublicData?.map((l: any) => ({ 
          id: l.id, 
          title: l.title, 
          is_public: l.is_public,
          start_date: l.start_date,
          created_at: l.created_at
        }))
      });
      
      if (allPublicError) {
        console.error('Error fetching all public listings:', allPublicError);
        return { listings: [], error: allPublicError };
      }
      
      // Filter in JavaScript for upcoming listings (start_date is null or strictly in the future)
      // Only show listings that haven't started yet (start_date > now)
      const upcomingListings = (allPublicData || []).filter((listing: any) => {
        if (!listing.start_date) return true;
        const listingDate = new Date(listing.start_date);
        const nowDate = new Date();
        // Only show listings that haven't started yet (strictly future)
        return listingDate > nowDate;
      });
      
      console.log('getPublicListings: Filtered upcoming listings:', {
        total: allPublicData?.length || 0,
        upcoming: upcomingListings.length,
        filtered: (allPublicData?.length || 0) - upcomingListings.length
      });
      
      // Limit to requested amount
      const limitedListings = upcomingListings.slice(0, limit);
      
      const listings: Listing[] = limitedListings.map((listing: any) => ({
        ...listing,
        role: undefined,
        status: 'upcoming' as const,
      }));

      console.log('getPublicListings: Returning listings:', {
        count: listings.length,
        listings: listings.map(l => ({ id: l.id, title: l.title }))
      });

      return { listings, error: null };
    } catch (error) {
      console.error('Error in getPublicListings:', error);
      return { listings: [], error: error as Error };
    }
  }
}

export const listingsService = new ListingsService();

