import { getSupabaseClient } from './supabaseClient';

export interface UserLink {
  id: string;
  user_id: string;
  type: string;
  handle?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

export class LinksService {
  private supabase = getSupabaseClient();

  // Get all links for a user
  async getUserLinks(userId: string): Promise<{ links: UserLink[]; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('user_links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('LinksService: Error fetching user links:', error);
        return { links: [], error: new Error(error.message) };
      }

      return { links: (data || []) as UserLink[], error: null };
    } catch (error) {
      console.error('LinksService: Exception fetching user links:', error);
      return { links: [], error: error as Error };
    }
  }

  // Create a new link
  async createLink(userId: string, type: string, handle?: string, url?: string): Promise<{ link: UserLink | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('user_links')
        .insert({
          user_id: userId,
          type,
          handle: handle?.trim() || null,
          url: url?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error('LinksService: Error creating link:', error);
        return { link: null, error: new Error(error.message) };
      }

      return { link: data as UserLink, error: null };
    } catch (error) {
      console.error('LinksService: Exception creating link:', error);
      return { link: null, error: error as Error };
    }
  }

  // Delete a link
  async deleteLink(linkId: string, userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('user_links')
        .delete()
        .eq('id', linkId)
        .eq('user_id', userId);

      if (error) {
        console.error('LinksService: Error deleting link:', error);
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      console.error('LinksService: Exception deleting link:', error);
      return { error: error as Error };
    }
  }
}


