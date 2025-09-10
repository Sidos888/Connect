"use client";

import * as React from "react";
import Avatar from "./Avatar";
import { useAppStore, useCurrentBusiness } from "@/lib/store";

type Props = {
  onOpenSwitcher?: () => void;
};

export default function TopBar({ onOpenSwitcher }: Props) {
  const { personalProfile, context } = useAppStore();
  const business = useCurrentBusiness();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
      <div className="mx-auto max-w-screen-sm px-4 py-3 flex items-center gap-3">
        {context.type === "business" && personalProfile ? (
          <Avatar src={personalProfile.avatarUrl ?? undefined} name={personalProfile.name} size={28} />
        ) : null}
        <div className="flex-1">
          <div className="text-sm font-semibold text-neutral-900">
            {context.type === "business" ? business?.name ?? "Business" : personalProfile?.name ?? "Welcome"}
          </div>
          <div className="text-xs text-neutral-500">
            {context.type === "business" ? "Business" : "Personal"}
          </div>
        </div>
        {context.type === "business" && (
          <button onClick={onOpenSwitcher} className="text-sm text-neutral-600 hover:text-neutral-900" aria-label="Switch account">
            ▾
          </button>
        )}
      </div>
    </header>
  );
}


