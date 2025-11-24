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
  has_gallery?: boolean;
  created_at: string;
  updated_at: string;
  // Joined from listing_participants
  role?: 'host' | 'participant';
  status?: 'upcoming' | 'completed' | 'cancelled';
}

export interface EventGallery {
  id: string;
  listing_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface EventGalleryItem {
  id: string;
  gallery_id: string;
  user_id: string;
  photo_url: string;
  created_at: string;
}

export interface EventGalleryWithItems extends EventGallery {
  items: EventGalleryItem[];
  photo_count: number;
  people_count: number;
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

  /**
   * Get all participants for a listing
   * Returns participants with their account info and role
   */
  async getListingParticipants(listingId: string): Promise<{ participants: Array<{
    id: string;
    name: string;
    profile_pic: string | null;
    role: 'host' | 'participant';
    status: 'upcoming' | 'completed' | 'cancelled';
  }>; error: Error | null }> {
    if (!this.supabase) {
      return { participants: [], error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await this.supabase
        .from('listing_participants')
        .select(`
          user_id,
          role,
          status,
          accounts (
            id,
            name,
            profile_pic
          )
        `)
        .eq('listing_id', listingId);

      if (error) {
        console.error('Error fetching listing participants:', error);
        return { participants: [], error };
      }

      const participants = (data || [])
        .filter((item: any) => item.accounts) // Filter out any null accounts
        .map((item: any) => ({
          id: item.accounts.id,
          name: item.accounts.name,
          profile_pic: item.accounts.profile_pic,
          role: item.role as 'host' | 'participant',
          status: item.status as 'upcoming' | 'completed' | 'cancelled',
        }));

      return { participants, error: null };
    } catch (error) {
      console.error('Error in getListingParticipants:', error);
      return { participants: [], error: error as Error };
    }
  }

  /**
   * Get saved listings for a user
   * Returns listings that the user has saved
   */
  async getSavedListings(userId: string): Promise<{ listings: Listing[]; error: Error | null }> {
    if (!this.supabase) {
      return { listings: [], error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await this.supabase
        .from('saved_listings')
        .select(`
          listing_id,
          created_at,
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved listings:', error);
        return { listings: [], error };
      }

      const listings: Listing[] = (data || [])
        .map((item: any) => ({
          ...item.listings,
          role: undefined,
          status: 'upcoming' as const,
        }))
        .filter((listing: any) => listing.id); // Filter out null listings

      return { listings, error: null };
    } catch (error) {
      console.error('Error in getSavedListings:', error);
      return { listings: [], error: error as Error };
    }
  }

  /**
   * Create an event gallery for a listing
   */
  async createEventGallery(listingId: string, title: string): Promise<{ gallery: EventGallery | null; error: Error | null }> {
    if (!this.supabase) {
      return { gallery: null, error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await this.supabase
        .from('event_galleries')
        .insert({
          listing_id: listingId,
          title: title,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating event gallery:', error);
        return { gallery: null, error };
      }

      return { gallery: data as EventGallery, error: null };
    } catch (error) {
      console.error('Error in createEventGallery:', error);
      return { gallery: null, error: error as Error };
    }
  }

  /**
   * Get event gallery for a listing
   */
  async getEventGallery(listingId: string): Promise<{ gallery: EventGallery | null; error: Error | null }> {
    if (!this.supabase) {
      return { gallery: null, error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await this.supabase
        .from('event_galleries')
        .select('*')
        .eq('listing_id', listingId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No gallery found
          return { gallery: null, error: null };
        }
        console.error('Error fetching event gallery:', error);
        return { gallery: null, error };
      }

      return { gallery: data as EventGallery, error: null };
    } catch (error) {
      console.error('Error in getEventGallery:', error);
      return { gallery: null, error: error as Error };
    }
  }

  /**
   * Get all gallery items for a gallery
   */
  async getEventGalleryItems(galleryId: string): Promise<{ items: EventGalleryItem[]; error: Error | null }> {
    if (!this.supabase) {
      return { items: [], error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await this.supabase
        .from('event_gallery_items')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gallery items:', error);
        return { items: [], error };
      }

      return { items: (data || []) as EventGalleryItem[], error: null };
    } catch (error) {
      console.error('Error in getEventGalleryItems:', error);
      return { items: [], error: error as Error };
    }
  }

  /**
   * Add a photo to a gallery
   */
  async addGalleryPhoto(galleryId: string, userId: string, photoUrl: string): Promise<{ item: EventGalleryItem | null; error: Error | null }> {
    if (!this.supabase) {
      return { item: null, error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await this.supabase
        .from('event_gallery_items')
        .insert({
          gallery_id: galleryId,
          user_id: userId,
          photo_url: photoUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding gallery photo:', error);
        return { item: null, error };
      }

      return { item: data as EventGalleryItem, error: null };
    } catch (error) {
      console.error('Error in addGalleryPhoto:', error);
      return { item: null, error: error as Error };
    }
  }

  /**
   * Get all event galleries for a user (galleries from listings they attended)
   */
  async getUserEventGalleries(userId: string): Promise<{ galleries: EventGalleryWithItems[]; error: Error | null }> {
    if (!this.supabase) {
      return { galleries: [], error: new Error('Supabase client not available') };
    }

    try {
      // Get all listings the user has attended
      const { data: participantData, error: participantError } = await this.supabase
        .from('listing_participants')
        .select('listing_id')
        .eq('user_id', userId);

      if (participantError) {
        console.error('Error fetching user listings:', participantError);
        return { galleries: [], error: participantError };
      }

      const listingIds = (participantData || []).map((p: any) => p.listing_id);
      if (listingIds.length === 0) {
        return { galleries: [], error: null };
      }

      // Get galleries for those listings with listing data
      const { data: galleryData, error: galleryError } = await this.supabase
        .from('event_galleries')
        .select(`
          *,
          listings!inner (
            id,
            title,
            start_date
          )
        `)
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false });

      if (galleryError) {
        console.error('Error fetching galleries:', galleryError);
        return { galleries: [], error: galleryError };
      }

      // Get items and counts for each gallery
      const galleriesWithItems: EventGalleryWithItems[] = await Promise.all(
        (galleryData || []).map(async (gallery: any) => {
          const { items } = await this.getEventGalleryItems(gallery.id);
          const uniqueUserIds = new Set(items.map((item: EventGalleryItem) => item.user_id));
          
          return {
            ...gallery,
            items: items,
            photo_count: items.length,
            people_count: uniqueUserIds.size,
          } as EventGalleryWithItems;
        })
      );

      return { galleries: galleriesWithItems, error: null };
    } catch (error) {
      console.error('Error in getUserEventGalleries:', error);
      return { galleries: [], error: error as Error };
    }
  }

  /**
   * Get people count (unique users who added photos) for a gallery
   */
  async getGalleryPeopleCount(galleryId: string): Promise<{ count: number; error: Error | null }> {
    if (!this.supabase) {
      return { count: 0, error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await this.supabase
        .from('event_gallery_items')
        .select('user_id')
        .eq('gallery_id', galleryId);

      if (error) {
        console.error('Error fetching gallery people count:', error);
        return { count: 0, error };
      }

      const uniqueUserIds = new Set((data || []).map((item: any) => item.user_id));
      return { count: uniqueUserIds.size, error: null };
    } catch (error) {
      console.error('Error in getGalleryPeopleCount:', error);
      return { count: 0, error: error as Error };
    }
  }
}

export const listingsService = new ListingsService();

