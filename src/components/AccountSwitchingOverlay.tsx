"use client";

import { useAppStore } from "@/lib/store";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AccountSwitchingOverlay() {
  const { isAccountSwitching } = useAppStore();

  if (!isAccountSwitching) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
      {/* Simple loading spinner */}
      <LoadingSpinner />
    </div>
  );
}
