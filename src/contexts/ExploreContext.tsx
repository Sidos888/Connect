"use client";

import React, { createContext, useContext, useState } from 'react';

interface ExploreContextType {
  showFiltersModal: boolean;
  setShowFiltersModal: (show: boolean) => void;
  showCategoryModal: string | null;
  setShowCategoryModal: (category: string | null) => void;
}

const ExploreContext = createContext<ExploreContextType | undefined>(undefined);

export function ExploreProvider({ children }: { children: React.ReactNode }) {
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState<string | null>(null);

  return (
    <ExploreContext.Provider value={{
      showFiltersModal,
      setShowFiltersModal,
      showCategoryModal,
      setShowCategoryModal,
    }}>
      {children}
    </ExploreContext.Provider>
  );
}

export function useExplore() {
  const context = useContext(ExploreContext);
  if (context === undefined) {
    throw new Error('useExplore must be used within an ExploreProvider');
  }
  return context;
}
