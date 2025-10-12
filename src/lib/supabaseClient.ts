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
  
  // Fail-fast if environment variables are missing
  if (!url || !anon) {
    throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  }
  
  console.log('Supabase client creation:', { url: 'Set', anon: 'Set' });
  
  const storage = createMobileCompatibleStorage();
  
  client = createClient(url, anon, {
    auth: {
      persistSession: true,
      storage: storage,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable for mobile to avoid URL-based session detection issues
      flowType: 'pkce', // Use PKCE flow for better mobile security
      debug: false // Disable verbose auth logs for better performance
    }
  });

  // Add error handling for auth state changes
  client.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state change:', event, session ? 'Session exists' : 'No session');
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      console.log('🔐 Auth event:', event);
    }
  });

  // Watchdog: detect invalid/missing refresh token and self-heal by clearing session
  const checkAndRecoverSession = async () => {
    try {
      const { data, error } = await client!.auth.getSession();
      if (error && (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found'))) {
        console.warn('🧹 Supabase: Clearing invalid refresh token state');
        await clearInvalidSession();
        // Force a fresh session check after clearing
        const { data: newData } = await client!.auth.getSession();
        return newData?.session || null;
      }
      return data?.session || null;
    } catch (err) {
      console.error('🔧 Supabase session watchdog error:', err);
      // If we get an error, try clearing the session and retry once
      try {
        await clearInvalidSession();
        const { data: retryData } = await client!.auth.getSession();
        return retryData?.session || null;
      } catch (retryErr) {
        console.error('🔧 Supabase session retry error:', retryErr);
        return null;
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      checkAndRecoverSession();
    });
    // Initial check
    checkAndRecoverSession();
  }
  console.log('Supabase client created successfully with mobile-compatible persistence');
  return client;
}

export const supabase = getSupabaseClient();

// Function to clear invalid sessions
export async function clearInvalidSession() {
  if (typeof window !== 'undefined') {
    try {
      // Clear only Supabase-specific auth keys (narrowed scope to avoid clearing app data)
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase.auth')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Cleared invalid Supabase auth session data');
    } catch (error) {
      console.error('🧹 Error clearing session:', error);
    }
  }
}


