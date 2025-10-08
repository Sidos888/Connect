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
