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

      const listings: Listing[] = (data || [])
        .map((item: any) => ({
          ...item.listings,
          role: item.role,
          status: item.status,
        }))
        .filter((listing: any) => listing.id); // Filter out any null listings

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

      const listings: Listing[] = (data || [])
        .map((item: any) => ({
          ...item.listings,
          role: item.role,
          status: item.status,
        }))
        .filter((listing: any) => listing.id);

      return { listings, error: null };
    } catch (error) {
      console.error('Error in getHostingListings:', error);
      return { listings: [], error: error as Error };
    }
  }

  /**
   * Get completed listings for a user (where they are a participant with status='completed')
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
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching history listings:', error);
        return { listings: [], error };
      }

      const listings: Listing[] = (data || [])
        .map((item: any) => ({
          ...item.listings,
          role: item.role,
          status: item.status,
        }))
        .filter((listing: any) => listing.id);

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
      
      // Fetch public listings where start_date is null or in the future
      const { data, error } = await this.supabase
        .from('listings')
        .select('*')
        .eq('is_public', true)
        .or(`start_date.is.null,start_date.gte.${now}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching public listings:', error);
        // If the or() syntax fails, try a simpler query
        const { data: fallbackData, error: fallbackError } = await this.supabase
          .from('listings')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (fallbackError) {
          return { listings: [], error: fallbackError };
        }
        
        // Filter in JavaScript for upcoming listings
        const upcomingListings = (fallbackData || []).filter((listing: any) => {
          if (!listing.start_date) return true;
          return new Date(listing.start_date) >= new Date();
        });
        
        const listings: Listing[] = upcomingListings.map((listing: any) => ({
          ...listing,
          role: undefined,
          status: 'upcoming' as const,
        }));
        
        return { listings, error: null };
      }

      const listings: Listing[] = (data || []).map((listing: any) => ({
        ...listing,
        role: undefined,
        status: 'upcoming' as const,
      }));

      return { listings, error: null };
    } catch (error) {
      console.error('Error in getPublicListings:', error);
      return { listings: [], error: error as Error };
    }
  }
}

export const listingsService = new ListingsService();

