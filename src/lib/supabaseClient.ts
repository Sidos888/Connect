import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Enhanced mobile-compatible storage
const createMobileCompatibleStorage = () => {
  if (typeof window === 'undefined') return undefined;
  
  // Check if we're in a Capacitor environment (mobile)
  const isCapacitor = !!(window as any).Capacitor;
  console.log('🔧 Supabase Storage: Environment detected:', isCapacitor ? 'Mobile (Capacitor)' : 'Web');
  
  return {
    getItem: (key: string) => {
      try {
        const item = window.localStorage.getItem(key);
        console.log(`🔧 Storage GET [${key}]:`, item ? 'Found' : 'Not found');
        return Promise.resolve(item);
      } catch (error) {
        console.error('🔧 Storage GET error:', error);
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, value: string) => {
      try {
        window.localStorage.setItem(key, value);
        console.log(`🔧 Storage SET [${key}]:`, 'Success');
        return Promise.resolve();
      } catch (error) {
        console.error('🔧 Storage SET error:', error);
        return Promise.resolve();
      }
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key);
        console.log(`🔧 Storage REMOVE [${key}]:`, 'Success');
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
  if (!url || !anon) {
    console.error('Missing Supabase environment variables');
    return null;
  }
  
  const storage = createMobileCompatibleStorage();
  
  client = createClient(url, anon, {
    auth: {
      persistSession: true,
      storage: storage,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable for mobile to avoid URL-based session detection issues
      flowType: 'pkce' // Use PKCE flow for better mobile security
    }
  });
  console.log('Supabase client created successfully with mobile-compatible persistence');
  return client;
}

export const supabase = getSupabaseClient();


