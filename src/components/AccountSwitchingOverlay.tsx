"use client";

import { useAppStore } from "@/lib/store";

export default function AccountSwitchingOverlay() {
  const { isAccountSwitching } = useAppStore();

  if (!isAccountSwitching) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
      {/* Simple loading spinner */}
      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
    </div>
  );
}
