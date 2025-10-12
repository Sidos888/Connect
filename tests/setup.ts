/**
 * Vitest Test Setup
 * 
 * Global test configuration and mocks for the Connect app.
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  getSupabaseClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    })),
    rpc: vi.fn(() => ({ data: null, error: null })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn()
    })),
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: 'test-user-id' } }, error: null })),
      getSession: vi.fn(() => ({ data: { session: { user: { id: 'test-user-id' } } }, error: null }))
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({ data: { path: 'test-path' }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.url' } }))
      }))
    }
  }),
  supabase: null
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn()
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null)
  }),
  usePathname: () => '/'
}));

// Mock window.crypto.randomUUID for tests
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {
    randomUUID: () => `test-uuid-${Math.random().toString(36).substr(2, 9)}`
  };
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
(global as any).localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
(global as any).sessionStorage = sessionStorageMock;

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true
});

