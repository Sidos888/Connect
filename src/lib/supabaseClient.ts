import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Enhanced mobile-compatible storage
const createMobileCompatibleStorage = () => {
  if (typeof window === 'undefined') return undefined;
  
  // Check if we're in a Capacitor environment (mobile)
  const isCapacitor = !!(window as any).Capacitor;
  
  return {
    getItem: (key: string) => {
      try {
        const item = window.localStorage.getItem(key);
        // Storage GET
        return Promise.resolve(item);
      } catch (error) {
        console.error('🔧 Storage GET error:', error);
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, value: string) => {
      try {
        window.localStorage.setItem(key, value);
        // Storage SET
        return Promise.resolve();
      } catch (error) {
        console.error('🔧 Storage SET error:', error);
        return Promise.resolve();
      }
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key);
        // Storage REMOVE
        return Promise.resolve();
      } catch (error) {
        console.error('🔧 Storage REMOVE error:', error);
        return Promise.resolve();
      }
    }
  };
};

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('Supabase client creation:', { url: url ? 'Set' : 'Missing', anon: anon ? 'Set' : 'Missing' });
  
  // Fallback to Connect-Staging project if env vars are missing
  const fallbackUrl = url || 'https://rxlqtyfhsocxnsnnnlwl.supabase.co';
  const fallbackAnon = anon || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bHF0eWZoc29jeG5zbm5ubHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDE0MzEsImV4cCI6MjA3MjM3NzQzMX0.oMDgv8sj7GvoDsSw6RVt0XEezQTQj2l609JJBg43eTg';
  
  if (!url || !anon) {
    console.warn('Missing Supabase environment variables, using Connect-Staging project fallback');
  }
  
  const storage = createMobileCompatibleStorage();
  
  client = createClient(fallbackUrl, fallbackAnon, {
    auth: {
      persistSession: true,
      storage: storage,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable for mobile to avoid URL-based session detection issues
      flowType: 'pkce', // Use PKCE flow for better mobile security
      debug: process.env.NODE_ENV === 'development'
    }
  });

  // Add error handling for auth state changes
  client.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state change:', event, session ? 'Session exists' : 'No session');
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      console.log('🔐 Auth event:', event);
    }
  });
  console.log('Supabase client created successfully with mobile-compatible persistence');
  return client;
}

export const supabase = getSupabaseClient();

// Function to clear invalid sessions
export async function clearInvalidSession() {
  if (typeof window !== 'undefined') {
    try {
      // Clear all auth-related localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Cleared invalid auth session data');
    } catch (error) {
      console.error('🧹 Error clearing session:', error);
    }
  }
}


