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
  maxAttempts: number = 5
): Promise<string> {
  console.log(`generateUniqueConnectId: Starting with ${maxAttempts} attempts`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const connectId = generateConnectId();
    console.log(`generateUniqueConnectId: Attempt ${attempt + 1}/${maxAttempts} - Testing: ${connectId}`);
    
    try {
      // Check if this connect_id already exists
      const { data, error } = await supabase
        .from('accounts')
        .select('connect_id')
        .eq('connect_id', connectId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors
      
      console.log(`generateUniqueConnectId: Query result for ${connectId}:`, { data, error });
      
      // If no error and no data, this connect_id is unique
      if (!error && !data) {
        console.log(`generateUniqueConnectId: ✅ Found unique ID: ${connectId}`);
        return connectId;
      }
      
      // If there was an error, log it but continue trying
      if (error) {
        console.warn(`generateUniqueConnectId: Query error for ${connectId}:`, error);
        // For most errors, continue trying with a new ID
        continue;
      }
      
      // If data exists, this connect_id is taken, try again
      if (data) {
        console.log(`generateUniqueConnectId: ID ${connectId} is taken, trying again...`);
        continue;
      }
    } catch (queryError) {
      console.error(`generateUniqueConnectId: Unexpected error for ${connectId}:`, queryError);
      continue;
    }
  }
  
  // If we've exhausted all attempts, throw an error
  const errorMsg = `Failed to generate unique connect_id after ${maxAttempts} attempts`;
  console.error('generateUniqueConnectId:', errorMsg);
  throw new Error(errorMsg);
}
