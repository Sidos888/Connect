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
  itinerary?: any[] | null;
  event_chat_id?: string | null;
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

export interface ListingInvite {
  id: string;
  listing_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  // Joined data
  listing?: Listing;
  inviter?: { id: string; name: string; profile_pic: string | null };
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
        })
        .sort((a: any, b: any) => {
          // Sort by start_date ascending (soonest/most recent first)
          if (!a.start_date) return 1;
          if (!b.start_date) return -1;
          const dateA = new Date(a.start_date).getTime();
          const dateB = new Date(b.start_date).getTime();
          return dateA - dateB;
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
        })
        .sort((a: any, b: any) => {
          // Sort by start_date ascending (soonest first)
          if (!a.start_date) return 1;
          if (!b.start_date) return -1;
          const dateA = new Date(a.start_date).getTime();
          const dateB = new Date(b.start_date).getTime();
          return dateA - dateB;
        });

      return { listings, error: null };
    } catch (error) {
      console.error('Error in getHostingListings:', error);
      return { listings: [], error: error as Error };
    }
  }

  /**
   * Get current/happening now listings for a user (events currently in progress)
   */
  async getCurrentListings(userId: string): Promise<{ listings: Listing[]; error: Error | null }> {
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
        console.error('Error fetching current listings:', error);
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
          // Only show listings that are currently happening (start_date <= now <= end_date)
          if (!listing.start_date || !listing.end_date) return false;
          const startDate = new Date(listing.start_date);
          const endDate = new Date(listing.end_date);
          return startDate <= now && now <= endDate;
        });

      return { listings, error: null };
    } catch (error) {
      console.error('Error in getCurrentListings:', error);
      return { listings: [], error: error as Error };
    }
  }

  /**
   * Get past/completed listings for a user (where end_date < now)
   * Includes all listings the user has hosted or attended that have ended
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
        .order('end_date', { foreignTable: 'listings', ascending: false }); // Order by end_date to show most recently ended first

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
          // Only show listings that have ended (end_date < now)
          if (!listing.end_date) return false;
          const endDate = new Date(listing.end_date);
          return endDate < now;
        })
        .sort((a: any, b: any) => {
          // Sort by end_date descending (most recently ended first)
          const dateA = new Date(a.end_date).getTime();
          const dateB = new Date(b.end_date).getTime();
          return dateB - dateA;
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

  /**
   * Get listing invitations for a user
   * Filters out invites where user is already a participant
   */
  async getListingInvites(userId: string): Promise<{ invites: ListingInvite[]; error: Error | null }> {
    if (!this.supabase) {
      return { invites: [], error: new Error('Supabase client not available') };
    }

    try {
      // First, get all pending invites
      const { data, error } = await this.supabase
        .from('listing_invites')
        .select(`
          id,
          listing_id,
          inviter_id,
          invitee_id,
          status,
          created_at,
          updated_at,
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
          ),
          inviter:accounts!listing_invites_inviter_id_fkey (
            id,
            name,
            profile_pic
          )
        `)
        .eq('invitee_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching listing invites:', error);
        return { invites: [], error };
      }

      if (!data || data.length === 0) {
        return { invites: [], error: null };
      }

      // Get listing IDs from invites
      const listingIds = data.map((item: any) => item.listing_id);

      // Check which listings the user is already a participant in
      const { data: participants, error: participantError } = await this.supabase
        .from('listing_participants')
        .select('listing_id')
        .eq('user_id', userId)
        .in('listing_id', listingIds)
        .eq('status', 'upcoming');

      if (participantError) {
        console.error('Error checking participants:', participantError);
        // Continue anyway, but log the error
      }

      // Get set of listing IDs where user is already a participant
      const participantListingIds = new Set(
        (participants || []).map((p: any) => p.listing_id)
      );

      // Filter out invites for listings where user is already a participant
      const filteredData = data.filter((item: any) => 
        !participantListingIds.has(item.listing_id)
      );

      const invites: ListingInvite[] = filteredData.map((item: any) => ({
        id: item.id,
        listing_id: item.listing_id,
        inviter_id: item.inviter_id,
        invitee_id: item.invitee_id,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        listing: item.listings ? {
          ...item.listings,
          role: undefined,
          status: undefined,
        } : undefined,
        inviter: item.inviter ? {
          id: item.inviter.id,
          name: item.inviter.name,
          profile_pic: item.inviter.profile_pic,
        } : undefined,
      }));

      return { invites, error: null };
    } catch (error) {
      console.error('Error in getListingInvites:', error);
      return { invites: [], error: error as Error };
    }
  }

  /**
   * Accept a listing invitation
   */
  async acceptListingInvite(inviteId: string, userId: string): Promise<{ success: boolean; error: Error | null }> {
    if (!this.supabase) {
      return { success: false, error: new Error('Supabase client not available') };
    }

    try {
      // Get the invite to get listing_id
      const { data: inviteData, error: inviteError } = await this.supabase
        .from('listing_invites')
        .select('listing_id')
        .eq('id', inviteId)
        .eq('invitee_id', userId)
        .eq('status', 'pending')
        .single();

      if (inviteError || !inviteData) {
        return { success: false, error: new Error('Invitation not found') };
      }

      // Update invite status to accepted
      const { error: updateError } = await this.supabase
        .from('listing_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

      if (updateError) {
        return { success: false, error: updateError };
      }

      // Add user to listing_participants
      const { error: participantError } = await this.supabase
        .from('listing_participants')
        .upsert({
          listing_id: inviteData.listing_id,
          user_id: userId,
          role: 'participant',
          status: 'upcoming',
        }, {
          onConflict: 'listing_id,user_id'
        });

      if (participantError) {
        console.error('Error adding participant:', participantError);
        // Still return success since invite was accepted
      }

      // Check if listing has event_chat_id and add user to that chat
      const { data: listingData, error: listingError } = await this.supabase
        .from('listings')
        .select('event_chat_id')
        .eq('id', inviteData.listing_id)
        .single();

      if (!listingError && listingData?.event_chat_id) {
        // Add user to event chat
        const { error: chatParticipantError } = await this.supabase
          .from('chat_participants')
          .upsert({
            chat_id: listingData.event_chat_id,
            user_id: userId,
            role: 'member'
          }, {
            onConflict: 'chat_id,user_id'
          });

        if (chatParticipantError) {
          console.error('Error adding user to event chat:', chatParticipantError);
          // Don't fail the accept operation if chat add fails
        }
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in acceptListingInvite:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Decline a listing invitation
   */
  async declineListingInvite(inviteId: string, userId: string): Promise<{ success: boolean; error: Error | null }> {
    if (!this.supabase) {
      return { success: false, error: new Error('Supabase client not available') };
    }

    try {
      const { error } = await this.supabase
        .from('listing_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId)
        .eq('invitee_id', userId)
        .eq('status', 'pending');

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in declineListingInvite:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Mark pending invites as accepted when user joins a listing
   * This is called when user joins via Join button (not via Accept invite)
   */
  async markInvitesAsAcceptedForListing(listingId: string, userId: string): Promise<{ success: boolean; error: Error | null }> {
    if (!this.supabase) {
      return { success: false, error: new Error('Supabase client not available') };
    }

    try {
      // Update all pending invites for this listing and user to 'accepted'
      const { error } = await this.supabase
        .from('listing_invites')
        .update({ status: 'accepted' })
        .eq('listing_id', listingId)
        .eq('invitee_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error marking invites as accepted:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in markInvitesAsAcceptedForListing:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Cancel/delete a listing invitation (host only)
   * This removes the invite from the database, so it disappears from notifications and the invite page
   */
  async cancelListingInvite(inviteId: string, listingId: string, hostId: string): Promise<{ success: boolean; error: Error | null }> {
    if (!this.supabase) {
      return { success: false, error: new Error('Supabase client not available') };
    }

    try {
      // Verify the user is the host
      const { data: listing, error: listingError } = await this.supabase
        .from('listings')
        .select('host_id')
        .eq('id', listingId)
        .single();

      if (listingError || !listing) {
        return { success: false, error: new Error('Listing not found') };
      }

      if (listing.host_id !== hostId) {
        return { success: false, error: new Error('Only the host can cancel invites') };
      }

      // Delete the invite
      const { error } = await this.supabase
        .from('listing_invites')
        .delete()
        .eq('id', inviteId)
        .eq('listing_id', listingId);

      if (error) {
        console.error('Error canceling invite:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in cancelListingInvite:', error);
      return { success: false, error: error as Error };
    }
  }
}

export const listingsService = new ListingsService();

