export type AccountType = "personal" | "business";

export interface Business {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: "Owner" | "Manager" | "Staff";
}

export interface AccountContext {
  accountType: AccountType;       // personal or business
  personal: { id: string; name: string; avatarUrl?: string };
  businesses: Business[];         // 0..n
  activeBusinessId?: string;      // when accountType === "business"
}
