/**
 * Network Utilities
 * 
 * Provides retry logic with exponential backoff for network operations.
 * Handles transient failures gracefully while skipping permanent errors.
 */

export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Determines if an error is retryable based on error characteristics
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return error.isRetryable;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Don't retry auth errors
    if (
      message.includes('invalid refresh token') ||
      message.includes('refresh token not found') ||
      message.includes('jwt') ||
      message.includes('unauthorized') ||
      message.includes('authentication')
    ) {
      return false;
    }
    
    // Don't retry client errors (4xx)
    if (message.includes('400') || message.includes('401') || message.includes('403') || message.includes('404')) {
      return false;
    }
    
    // Don't retry validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required')
    ) {
      return false;
    }
    
    // Retry network and server errors
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('aborted') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    ) {
      return true;
    }
  }
  
  // Default: retry unknown errors (better safe than sorry)
  return true;
}

/**
 * Calculate delay for next retry with exponential backoff
 */
function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  
  // Add jitter (randomness) to prevent thundering herd
  const jitter = Math.random() * baseDelayMs;
  
  // Cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Retry an async operation with exponential backoff
 * 
 * @param operation - The async function to retry
 * @param options - Retry configuration
 * @returns Promise that resolves with operation result or rejects after all retries exhausted
 * 
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => fetchUserData(userId),
 *   { retries: 3, baseDelayMs: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    retries,
    baseDelayMs,
    maxDelayMs = 30000, // Default max 30 seconds
    onRetry
  } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw lastError;
      }
      
      // If this was the last attempt, throw the error
      if (attempt >= retries) {
        throw lastError;
      }
      
      // Calculate delay for next retry
      const delayMs = calculateDelay(attempt, baseDelayMs, maxDelayMs);
      
      // Notify caller about retry
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Wait for the browser to be online
 * 
 * @param timeoutMs - Maximum time to wait (0 = wait forever)
 * @returns Promise that resolves when online or rejects on timeout
 */
export function waitForOnline(timeoutMs: number = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isOnline()) {
      resolve();
      return;
    }
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    const handleOnline = () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    
    window.addEventListener('online', handleOnline);
    
    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        window.removeEventListener('online', handleOnline);
        reject(new Error('Timeout waiting for online connection'));
      }, timeoutMs);
    }
  });
}

/**
 * Batch multiple requests with a delay between each
 * Useful for rate-limited APIs
 * 
 * @param items - Array of items to process
 * @param operation - Function to run for each item
 * @param delayMs - Delay between operations
 * @returns Promise that resolves with array of results
 */
export async function batchWithDelay<T, R>(
  items: T[],
  operation: (item: T, index: number) => Promise<R>,
  delayMs: number
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const result = await operation(items[i], i);
    results.push(result);
    
    // Don't delay after the last item
    if (i < items.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Create a debounced function that delays execution
 * Useful for rate-limiting operations like typing indicators
 * 
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}

/**
 * Create a throttled function that limits execution rate
 * Ensures function is not called more than once per interval
 * 
 * @param fn - Function to throttle
 * @param intervalMs - Minimum interval between calls
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= intervalMs) {
      lastCall = now;
      fn(...args);
    } else {
      // Schedule call for when interval expires
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
      }, intervalMs - timeSinceLastCall);
    }
  };
}

