"use client";

import * as React from "react";
import Avatar from "./Avatar";
import { useAppStore } from "@/lib/store";

type Props = {
  onOpenSwitcher?: () => void;
};

export default function TopBar({ onOpenSwitcher }: Props) {
  const { personalProfile } = useAppStore();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
      <div className="mx-auto max-w-screen-sm px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold text-neutral-900">
            {personalProfile?.name ?? "Welcome"}
          </div>
          <div className="text-xs text-neutral-500">
            Personal
          </div>
        </div>
      </div>
    </header>
  );
}


