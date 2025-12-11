export type AccountType = "personal";

export interface AccountContext {
  accountType: AccountType;       // always "personal"
  personal: { id: string; name: string; avatarUrl?: string };
}
