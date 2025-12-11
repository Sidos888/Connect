/**
 * AuthService - Independent authentication service
 * 
 * This service handles all authentication operations without React dependencies.
 * It can be called from anywhere and will work even if React components unmount.
 * 
 * Architecture: Service Layer Pattern (like WeChat, Facebook, Instagram)
 * 
 * Key Principle: Sign-out orchestration lives here, outside component lifecycle.
 * This ensures async flows complete even if components re-render or unmount.
 */

import { getSupabaseClient } from '../supabaseClient';
import { navigationService } from './navigationService';

export type SignOutStatus = 'idle' | 'signing-out' | 'redirecting';

export class AuthService {
  private static instance: AuthService;
  private signOutStatus: SignOutStatus = 'idle';
  private statusListeners: Set<(status: SignOutStatus) => void> = new Set();
  private isRunningSignOutFlow = false;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Get current sign-out status
   */
  getSignOutStatus(): SignOutStatus {
    return this.signOutStatus;
  }

  /**
   * Subscribe to sign-out status changes
   * Returns unsubscribe function
   */
  onStatusChange(callback: (status: SignOutStatus) => void): () => void {
    this.statusListeners.add(callback);
    // Immediately call with current status
    callback(this.signOutStatus);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * Update sign-out status and notify listeners
   */
  private updateStatus(status: SignOutStatus): void {
    if (this.signOutStatus === status) return;
    this.signOutStatus = status;
    console.log(`🔄 AuthService: Sign-out status changed to: ${status}`);
    this.statusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('⚠️ AuthService: Error in status listener:', error);
      }
    });
  }

  /**
   * Sign out the current user
   * 
   * This method:
   * 1. Clears Zustand store
   * 2. Clears React Query cache
   * 3. Clears Supabase session (fire-and-forget with timeout)
   * 4. Clears all browser storage (defensive, per-operation try/catch)
   * 5. Emits sign-out event
   * 
   * CRITICAL: This method ALWAYS resolves, even if operations fail or hang.
   * Never blocks the orchestrator. Designed for iOS WebView/Capacitor edge cases.
   * 
   * Works independently of React component lifecycle.
   */
  async signOut(): Promise<void> {
    console.log('🔐 AuthService: Starting sign-out process...');

    // 0. Clear AuthContext state FIRST (synchronously, before anything else)
    // This eliminates race conditions where router navigation happens before AuthContext updates
    if (typeof window !== 'undefined') {
      try {
        const setters = (window as any).__authContextSetters;
        if (setters && typeof setters.setUser === 'function' && typeof setters.setAccount === 'function') {
          console.log('🧹 AuthService: Clearing AuthContext state synchronously...');
          setters.setUser(null);
          setters.setAccount(null);
          if (typeof setters.setLoading === 'function') {
            setters.setLoading(false);
          }
          console.log('✅ AuthService: AuthContext state cleared synchronously');
        } else {
          console.warn('⚠️ AuthService: AuthContext setters not available (may not be mounted yet)');
        }
      } catch (contextError) {
        console.error('⚠️ AuthService: Error clearing AuthContext state:', contextError);
        // Continue - don't block
      }
    }

    // 1. Clear Zustand store (before Supabase sign-out to avoid state conflicts)
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
        
        // Remove persisted storage key (defensive)
        try {
          localStorage.removeItem('app-store');
        } catch (e) {
          console.warn('⚠️ AuthService: Error removing app-store from localStorage:', e);
        }
        
        console.log('✅ AuthService: Zustand store cleared');
      } catch (storeError) {
        console.error('⚠️ AuthService: Error clearing Zustand store:', storeError);
        // Continue - don't block
      }
    }

    // 2. Clear React Query cache (before Supabase to avoid stale data)
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
        // Continue - don't block
      }
    }

    // 3. Clear Supabase session (FIRE-AND-FORGET with timeout fallback)
    // Never await this directly - use Promise.race with timeout to ensure we don't hang
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('🔐 AuthService: Signing out from Supabase (fire-and-forget with timeout)...');
      
      // Create timeout promise (5 second hard limit)
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log('⏱️ AuthService: Supabase sign-out timeout reached, continuing anyway');
          resolve();
        }, 5000);
      });

      // Race Supabase sign-out against timeout
      // This ensures we never hang waiting for Supabase
      Promise.race([
        supabase.auth.signOut().then(({ error: signOutError }) => {
          if (signOutError) {
            console.error('⚠️ AuthService: Supabase signout error:', signOutError);
          } else {
            console.log('✅ AuthService: Supabase session cleared');
          }
        }).catch((error) => {
          console.error('⚠️ AuthService: Supabase signout exception:', error);
        }),
        timeoutPromise
      ]).catch((error) => {
        console.error('⚠️ AuthService: Error in Supabase sign-out race:', error);
      });

      // Don't await - fire and forget
      // Auth state change (SIGNED_OUT) will happen asynchronously
      // We don't rely on it to complete the promise
    } else {
      console.warn('⚠️ AuthService: No Supabase client available');
    }

    // 4. Clear browser storage (DEFENSIVE - per-operation try/catch)
    // Each operation is independent and won't block if one fails
    if (typeof window !== 'undefined') {
      console.log('🧹 AuthService: Clearing browser storage (defensive)...');
      
      // Clear localStorage (defensive)
      try {
        localStorage.clear();
        console.log('✅ AuthService: localStorage cleared');
      } catch (localStorageError) {
        console.error('⚠️ AuthService: Error clearing localStorage:', localStorageError);
        // Continue - don't block
      }

      // Clear sessionStorage (defensive)
      try {
        sessionStorage.clear();
        console.log('✅ AuthService: sessionStorage cleared');
      } catch (sessionStorageError) {
        console.error('⚠️ AuthService: Error clearing sessionStorage:', sessionStorageError);
        // Continue - don't block
      }
    }

    // 5. Emit sign-out event (for UI components to react)
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('auth:signed-out'));
        console.log('📡 AuthService: Sign-out event emitted');
      } catch (eventError) {
        console.error('⚠️ AuthService: Error emitting sign-out event:', eventError);
        // Continue - don't block
      }
    }

    // ALWAYS resolve - never throw
    // This ensures runSignOutFlow() can always proceed
    console.log('✅ AuthService: Sign-out process completed (always resolves)');
  }

  /**
   * Run complete sign-out flow with orchestration
   * 
   * This method handles the entire sign-out process:
   * 1. Updates status to 'signing-out'
   * 2. Performs cleanup (Supabase, Zustand, React Query, storage)
   * 3. Waits for state propagation
   * 4. Updates status to 'redirecting'
   * 5. Final delay
   * 6. Redirects to /explore
   * 
   * This orchestration lives outside component lifecycle, ensuring
   * it completes even if components re-render or unmount.
   * 
   * Architecture: Service Layer Pattern (like WeChat, Facebook)
   */
  async runSignOutFlow(): Promise<void> {
    // Prevent multiple concurrent executions
    if (this.isRunningSignOutFlow) {
      console.log('⚠️ AuthService: Sign-out flow already running, skipping');
      return;
    }

    this.isRunningSignOutFlow = true;
    console.log('🔄 AuthService: Starting sign-out flow orchestration');

    try {
      // Step 1: Update status to 'signing-out'
      this.updateStatus('signing-out');

      // Step 2: Perform cleanup (Supabase, Zustand, React Query, storage)
      // signOut() handles all cleanup including React Query cache
      console.log('🔄 AuthService: Step 2 - Performing cleanup');
      await this.signOut();

      // Step 3: Wait for state propagation (allows AuthContext to update)
      console.log('🔄 AuthService: Step 3 - Waiting for state propagation (1 second)');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Update status to 'redirecting'
      console.log('🔄 AuthService: Step 4 - Updating status to redirecting');
      this.updateStatus('redirecting');

      // Step 5: Final delay before redirect
      console.log('🔄 AuthService: Step 5 - Final delay before redirect (1 second)');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 6: Redirect to explore
      // Use router navigation (client-side) to avoid full page reload
      // Full page reloads cause hydration issues with Next.js static export + Capacitor
      // Router is set earlier in app lifecycle (menu page), so it should be available
      console.log('🔄 AuthService: Step 6 - Redirecting to /explore (router-based)');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('fromSigningOut', 'true');
        // Use router navigation (default) - avoids full reload, allows component execution
        // Falls back to window.location only if router unavailable
        navigationService.navigateToExplore(true); // true = prefer router, fallback to window.location if needed
      }

      console.log('✅ AuthService: Sign-out flow orchestration completed');
    } catch (error) {
      console.error('❌ AuthService: Error during sign-out flow:', error);
      
      // Even on error, try to redirect
      this.updateStatus('redirecting');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('fromSigningOut', 'true');
          navigationService.navigateToExplore(false);
        }
      }, 2000);
    } finally {
      this.isRunningSignOutFlow = false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

