"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import { AccountContext as CTX, Business } from "@/lib/types/accounts";

type Value = {
  ctx: CTX;
  setPersonal: (name: string, avatarUrl?: string) => void;
  addBusiness: (b: Business) => void;
  removeBusiness: (id: string) => void;
  switchToPersonal: () => void;
  switchToBusiness: (businessId: string) => void;
};

const AccountContext = createContext<Value | null>(null);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // MOCK DATA – replace with API later
  const [ctx, setCtx] = useState<CTX>({
    accountType: "personal",
    personal: { id: "me", name: "Sid", avatarUrl: "/images/me.png" },
    businesses: [
      { id: "cafe-1", name: "Sid's Café", avatarUrl: "/images/cafe.png", role: "Owner" },
      { id: "studio-1", name: "Wellness Studio", avatarUrl: "/images/studio.png", role: "Owner" },
    ],
  });

  const value = useMemo<Value>(() => ({
    ctx,
    setPersonal: (name, avatarUrl) =>
      setCtx((prev) => ({ ...prev, personal: { ...prev.personal, name, avatarUrl } })),
    addBusiness: (b) => setCtx((prev) => ({ ...prev, businesses: [...prev.businesses, b] })),
    removeBusiness: (id) =>
      setCtx((prev) => ({ ...prev, businesses: prev.businesses.filter((x) => x.id !== id) })),
    switchToPersonal: () =>
      setCtx((prev) => ({ ...prev, accountType: "personal", activeBusinessId: undefined })),
    switchToBusiness: (businessId) =>
      setCtx((prev) => ({ ...prev, accountType: "business", activeBusinessId: businessId })),
  }), [ctx]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
};

export const useAccountContext = () => {
  const v = useContext(AccountContext);
  if (!v) throw new Error("useAccountContext must be used inside AccountProvider");
  return v;
};
