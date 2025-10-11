"use client";

import Avatar from "@/components/Avatar";
import { ReactNode } from "react";

type Props = {
  name: string;
  avatarUrl?: string | null;
  action?: ReactNode;
};

export default function ProfileStrip({ name, avatarUrl, action }: Props) {
  console.log('ProfileStrip component:', { name, avatarUrl });
  
  return (
    <div 
      className="rounded-2xl bg-white px-5 py-4 grid grid-cols-[40px_1fr_40px] items-center"
      style={{
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
      }}
    >
      <div className="flex items-center"><Avatar src={avatarUrl ?? undefined} name={name} size={36} /></div>
      <div className="text-base font-semibold text-neutral-900 text-center">{name}</div>
      <div className="flex justify-end">
        {action || <div className="w-9 h-9" />}
      </div>
    </div>
  );
}


