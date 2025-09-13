/**
 * Generates a unique 6-character alphanumeric connect_id
 * Format: C7F3A9 (uppercase letters and numbers)
 * Used for profile sharing links: connect.app/p/C7F3A9
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const LENGTH = 6;

export function generateConnectId(): string {
  let result = '';
  for (let i = 0; i < LENGTH; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

/**
 * Validates if a connect_id is in the correct format
 */
export function isValidConnectId(connectId: string): boolean {
  return /^[A-Z0-9]{6}$/.test(connectId);
}

/**
 * Generates a unique connect_id that doesn't exist in the database
 * @param supabase - Supabase client
 * @param maxAttempts - Maximum attempts to generate unique ID (default: 10)
 */
export async function generateUniqueConnectId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  maxAttempts: number = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const connectId = generateConnectId();
    
    // Check if this connect_id already exists
    const { data, error } = await supabase
      .from('profiles')
      .select('connect_id')
      .eq('connect_id', connectId)
      .single();
    
    // If no data found, this connect_id is unique
    if (error && error.code === 'PGRST116') {
      return connectId;
    }
    
    // If there was an error other than "not found", throw it
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // If data exists, this connect_id is taken, try again
    if (data) {
      continue;
    }
  }
  
  // If we've exhausted all attempts, throw an error
  throw new Error(`Failed to generate unique connect_id after ${maxAttempts} attempts`);
}
