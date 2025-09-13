import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('Supabase client creation:', { url: url ? 'Set' : 'Missing', anon: anon ? 'Set' : 'Missing' });
  if (!url || !anon) {
    console.error('Missing Supabase environment variables');
    return null;
  }
  client = createClient(url, anon);
  console.log('Supabase client created successfully');
  return client;
}

export const supabase = getSupabaseClient();


