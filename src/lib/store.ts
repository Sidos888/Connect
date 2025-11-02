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
  connectId?: string;
}

interface Business {
  id: string;
  name: string;
  profile_pic?: string;
}

interface StoreState {
  // Personal profile
  personalProfile: PersonalProfile | null;
  setPersonalProfile: (profile: PersonalProfile | null) => void;
  
  // Business
  currentBusiness: Business | null;
  setCurrentBusiness: (business: Business | null) => void;
  businesses: Business[];
  addBusiness: (business: any) => Business;
  
  // Context
  context: any;
  switchToPersonal: () => void;
  switchToBusiness: (businessId: string) => void;
  resetMenuState: () => void;
  
  // Hydration
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  isAccountSwitching: boolean;
  setAccountSwitching: (switching: boolean) => void;
  
  // Removed deprecated chat methods - use React Query + ChatService instead
  clearAll: () => void;
}

export const useAppStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Personal profile
      personalProfile: null,
      setPersonalProfile: (profile) => set({ personalProfile: profile }),
      
      // Business
      currentBusiness: null,
      setCurrentBusiness: (business) => set({ currentBusiness: business }),
      businesses: [],
      addBusiness: (business) => {
        const newBusiness = { ...business, id: Date.now().toString(), createdAt: new Date().toISOString() };
        set({ businesses: [...get().businesses, newBusiness] });
        return newBusiness;
      },
      
      // Context
      context: { type: 'personal' },
      switchToPersonal: () => set({ context: { type: 'personal' } }),
      switchToBusiness: (businessId) => set({ context: { type: 'business', businessId } }),
      resetMenuState: () => {},
      
      // Hydration
      isHydrated: false,
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      isAccountSwitching: false,
      setAccountSwitching: (switching) => set({ isAccountSwitching: switching }),
      
      // clearAll - reset entire state
      clearAll: () => {
        set({ personalProfile: null, currentBusiness: null, businesses: [] });
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        personalProfile: state.personalProfile,
        currentBusiness: state.currentBusiness,
        isHydrated: state.isHydrated,
        // Don't persist chat data - React Query handles this
      }),
    }
  )
);

// Export individual hooks for compatibility
export const useCurrentBusiness = () => useAppStore((state) => state.currentBusiness);
export const usePersonalProfile = () => useAppStore((state) => state.personalProfile);
export const useIsHydrated = () => useAppStore((state) => state.isHydrated);
