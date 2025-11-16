"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * QueryClientWrapper - Creates QueryClient on client side
 * 
 * This fixes the Next.js 13+ issue where QueryClient instances
 * cannot be passed from Server Components to Client Components.
 */
export function QueryClientWrapper({ children }: { children: React.ReactNode }) {
  // Create QueryClient on client side only
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests
        retry: 2,
        // Refetch on window focus
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Retry failed mutations
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}















