/**
 * AuthService - Independent authentication service
 * 
 * This service handles all authentication operations without React dependencies.
 * It can be called from anywhere and will work even if React components unmount.
 * 
 * Architecture: Service Layer Pattern (like WeChat, Facebook, Instagram)
 */

import { getSupabaseClient } from '../supabaseClient';

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Sign out the current user
   * 
   * This method:
   * 1. Clears Supabase session
   * 2. Clears Zustand store
   * 3. Clears React Query cache
   * 4. Clears all browser storage
   * 5. Emits sign-out event
   * 
   * Works independently of React component lifecycle.
   */
  async signOut(): Promise<void> {
    console.log('🔐 AuthService: Starting sign-out process...');

    try {
      // 1. Get Supabase client (not from React context)
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.warn('⚠️ AuthService: No Supabase client available');
      }

      // 2. Clear Zustand store FIRST (before Supabase sign-out to avoid state conflicts)
      if (typeof window !== 'undefined') {
        try {
          const { useAppStore } = await import('../store');
          const store = useAppStore.getState();
          
          console.log('🧹 AuthService: Clearing Zustand store...');
          
          // Clear personal profile
          if (store.setPersonalProfile) {
            store.setPersonalProfile(null);
          }
          
          // Clear all store state
          if (store.clearAll) {
            store.clearAll();
          }
          
          // Remove persisted storage key
          localStorage.removeItem('app-store');
          
          console.log('✅ AuthService: Zustand store cleared');
        } catch (storeError) {
          console.error('⚠️ AuthService: Error clearing Zustand store:', storeError);
        }
      }

      // 3. Clear React Query cache (before Supabase to avoid stale data)
      if (typeof window !== 'undefined') {
        try {
          const queryClient = (window as any).__queryClient;
          if (queryClient && typeof queryClient.clear === 'function') {
            console.log('🧹 AuthService: Clearing React Query cache...');
            queryClient.clear();
            console.log('✅ AuthService: React Query cache cleared');
          } else {
            console.log('ℹ️ AuthService: React Query client not available (may not be initialized yet)');
          }
        } catch (queryError) {
          console.error('⚠️ AuthService: Error clearing React Query cache:', queryError);
        }
      }

      // 4. Clear Supabase session (this triggers auth state change)
      if (supabase) {
        console.log('🔐 AuthService: Signing out from Supabase...');
        // Don't await - fire and forget to avoid blocking
        supabase.auth.signOut().then(({ error: signOutError }) => {
          if (signOutError) {
            console.error('⚠️ AuthService: Supabase signout error:', signOutError);
          } else {
            console.log('✅ AuthService: Supabase session cleared');
          }
        }).catch((error) => {
          console.error('⚠️ AuthService: Supabase signout exception:', error);
        });
      }

      // 5. Clear all browser storage
      if (typeof window !== 'undefined') {
        console.log('🧹 AuthService: Clearing browser storage...');
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ AuthService: Browser storage cleared');
      }

      // 6. Emit sign-out event (for UI components to react)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:signed-out'));
        console.log('📡 AuthService: Sign-out event emitted');
      }

      console.log('✅ AuthService: Sign-out completed successfully');
    } catch (error) {
      console.error('❌ AuthService: Sign-out error:', error);
      
      // Even on error, try to clear everything
      if (typeof window !== 'undefined') {
        try {
          // Clear store
          const { useAppStore } = await import('../store');
          const store = useAppStore.getState();
          if (store.clearAll) store.clearAll();
          if (store.setPersonalProfile) store.setPersonalProfile(null);
          localStorage.removeItem('app-store');
          
          // Clear storage
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear React Query
          const queryClient = (window as any).__queryClient;
          if (queryClient?.clear) queryClient.clear();
        } catch (cleanupError) {
          console.error('⚠️ AuthService: Error during cleanup:', cleanupError);
        }
      }
      
      // Don't throw - allow navigation to proceed
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

