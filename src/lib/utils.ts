/**
 * Capitalizes the first letter of each word in a name string
 * Handles first and last names properly
 * @param name - The name string to capitalize
 * @returns The capitalized name string
 */
export function capitalizeName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  // Split by spaces and handle each part
  return name
    .split(' ')
    .map(word => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Formats a name for display with proper capitalization
 * @param name - The name string to format
 * @returns The formatted name string
 */
export function formatNameForDisplay(name: string): string {
  return capitalizeName(name.trim());
}

/**
 * Normalizes an email address to lowercase and trims whitespace
 * Ensures consistent email storage and comparison
 * @param email - The email address to normalize
 * @returns The normalized email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalizes an Australian phone number to E.164 format (+61...)
 * Handles common formats: 0466310826, 466310826, +61466310826
 * @param phone - The phone number to normalize
 * @returns The normalized phone number in E.164 format
 * @throws Error if the phone number format is invalid
 */
export function normalizePhoneAU(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Remove leading 0 if present
  let normalized = digits.startsWith('0') ? digits.slice(1) : digits;
  
  // Ensure 61 country code prefix
  if (!normalized.startsWith('61')) {
    normalized = '61' + normalized;
  }
  
  // Validate length (61 + 9 digits = 11 total)
  if (normalized.length !== 11) {
    throw new Error(`Invalid AU phone number format: expected 11 digits (61 + 9), got ${normalized.length}`);
  }
  
  // Return with + prefix (E.164 format)
  return '+' + normalized;
}
