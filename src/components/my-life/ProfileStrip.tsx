"use client";

import Avatar from "@/components/Avatar";
import { ReactNode } from "react";

type Props = {
  name: string;
  avatarUrl?: string | null;
  action?: ReactNode;
};

export default function ProfileStrip({ name, avatarUrl, action }: Props) {
  return (
    <div className="rounded-2xl border border-neutral-200 shadow-sm bg-white px-5 py-4 grid grid-cols-[40px_1fr_40px] items-center">
      <div className="flex items-center"><Avatar src={avatarUrl ?? undefined} name={name} size={36} /></div>
      <div className="text-base font-semibold text-neutral-900 text-center">{name}</div>
      <div className="flex justify-end">
        {action || <div className="w-9 h-9" />}
      </div>
    </div>
  );
}


