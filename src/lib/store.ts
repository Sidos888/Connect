import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * COMPATIBILITY STORE - Long-term Migration Strategy
 * 
 * This store maintains the old API for existing components while gradually
 * migrating to the new React Query + ChatService architecture.
 * 
 * Migration Strategy:
 * 1. Keep this store for non-chat functionality (profile, business, etc.)
 * 2. Chat functionality now uses React Query (ChatLayout, PersonalChatPanel)
 * 3. Gradually migrate other components to use AuthContext directly
 * 4. Eventually remove this store entirely
 */

interface PersonalProfile {
  id: string;
  name: string;
  profile_pic?: string;
  avatarUrl?: string;
  bio?: string;
  connectId?: string;
}

interface StoreState {
  // Personal profile
  personalProfile: PersonalProfile | null;
  setPersonalProfile: (profile: PersonalProfile | null) => void;
  
  // Context (always personal now)
  context: { type: 'personal' };
  resetMenuState: () => void;
  
  // Hydration
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  isAccountSwitching: boolean;
  setAccountSwitching: (switching: boolean) => void;
  
  // Filters
  selectedWhen: string | null;
  selectedWhere: string | null;
  setSelectedWhen: (when: string | null) => void;
  setSelectedWhere: (where: string | null) => void;
  
  // Removed deprecated chat methods - use React Query + ChatService instead
  clearAll: () => void;
}

export const useAppStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Personal profile
      personalProfile: null,
      setPersonalProfile: (profile) => set({ personalProfile: profile }),
      
      // Context (always personal)
      context: { type: 'personal' },
      resetMenuState: () => {},
      
      // Hydration
      isHydrated: typeof window !== 'undefined', // Start as hydrated on client
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      isAccountSwitching: false,
      setAccountSwitching: (switching) => set({ isAccountSwitching: switching }),
      
      // Filters
      selectedWhen: null,
      selectedWhere: null,
      setSelectedWhen: (when) => set({ selectedWhen: when }),
      setSelectedWhere: (where) => set({ selectedWhere: where }),
      
      // clearAll - reset entire state
      clearAll: () => {
        set({ personalProfile: null });
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        personalProfile: state.personalProfile,
        selectedWhen: state.selectedWhen,
        selectedWhere: state.selectedWhere,
        // Don't persist isHydrated - it should reset on each session
        // Don't persist chat data - React Query handles this
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure hydration completes even if there's an error
        try {
          if (state) {
            state.setHydrated(true);
          }
        } catch (error) {
          console.error('Store rehydration error:', error);
          // Set hydrated anyway to prevent blocking
          if (state) {
            state.setHydrated(true);
          }
        }
      },
      skipHydration: false, // Enable hydration
    }
  )
);

// Export individual hooks for compatibility
export const usePersonalProfile = () => useAppStore((state) => state.personalProfile);
export const useIsHydrated = () => useAppStore((state) => state.isHydrated);
