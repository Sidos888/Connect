/**
 * Utility functions for formatting message timestamps in an intuitive way
 */

/**
 * Formats a message timestamp to show relative time based on when it was sent
 * @param timestamp - ISO string or Date object
 * @returns Formatted time string
 */
export function formatMessageTime(timestamp: string | Date): string {
  const messageDate = new Date(timestamp);
  const now = new Date();
  
  // Check if the date is valid
  if (isNaN(messageDate.getTime())) {
    return 'Invalid date';
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  const diffInDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24));
  
  // Today: Show time (e.g., "2:30 PM")
  if (diffInDays === 0) {
    return formatTime(messageDate);
  }
  
  // Yesterday: Show "Yesterday"
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  
  // Within the last week (2-7 days ago): Show day of week (e.g., "Tuesday")
  if (diffInDays >= 2 && diffInDays <= 7) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  // More than a week ago: Show date (e.g., "Jan 15" or "Dec 25, 2023")
  return formatDate(messageDate);
}

/**
 * Formats time in 12-hour format with AM/PM
 * @param date - Date object
 * @returns Formatted time string (e.g., "2:30 PM")
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats date in a readable format
 * @param date - Date object
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  // Always show day, short month, year format (e.g., "9 Oct 2025")
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formats message time for chat list preview (shorter format)
 * @param timestamp - ISO string or Date object
 * @returns Short formatted time string
 */
export function formatMessageTimeShort(timestamp: string | Date): string {
  const messageDate = new Date(timestamp);
  const now = new Date();
  
  if (isNaN(messageDate.getTime())) {
    return '';
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  const diffInDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24));
  
  // Today: Show time (e.g., "2:30 PM")
  if (diffInDays === 0) {
    return formatTime(messageDate);
  }
  
  // Yesterday: Show "Yesterday"
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  
  // Within the last week: Show abbreviated day (e.g., "Tue")
  if (diffInDays >= 2 && diffInDays <= 7) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  // More than a week: Show date format "9 Oct 2025"
  return messageDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formats message time for detailed view (full format)
 * @param timestamp - ISO string or Date object
 * @returns Full formatted time string
 */
export function formatMessageTimeFull(timestamp: string | Date): string {
  const messageDate = new Date(timestamp);
  
  if (isNaN(messageDate.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  const diffInDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24));
  
  // Today: Show "Today at 2:30 PM"
  if (diffInDays === 0) {
    return `Today at ${formatTime(messageDate)}`;
  }
  
  // Yesterday: Show "Yesterday at 2:30 PM"
  if (diffInDays === 1) {
    return `Yesterday at ${formatTime(messageDate)}`;
  }
  
  // Within the last week: Show "Tuesday at 2:30 PM"
  if (diffInDays >= 2 && diffInDays <= 7) {
    const dayName = messageDate.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} at ${formatTime(messageDate)}`;
  }
  
  // More than a week: Show "Jan 15, 2024 at 2:30 PM"
  const dateStr = formatDate(messageDate);
  return `${dateStr} at ${formatTime(messageDate)}`;
}
