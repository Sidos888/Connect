import * as React from "react";

type Props = {
  title: string;
  dateTime: string; // e.g., "Jan 15 • 10:15am"
  thumbnail?: React.ReactNode; // element or emoji
  chip?: string;
  href?: string;
};

import Link from "next/link";

export default function MiniEventCard({ title, dateTime, thumbnail, chip, href }: Props) {
  return (
    <Link 
      href={href ?? "#"} 
      className="min-w-[300px] md:min-w-[280px] snap-start rounded-2xl bg-white p-4 md:p-4 flex items-center gap-4 hover:bg-white transition-all duration-200"
      style={{
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
      }}
    >
      <div className="w-12 h-12 rounded-md bg-neutral-200 flex items-center justify-center overflow-hidden">
        {thumbnail ?? <span>📦</span>}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-neutral-900 line-clamp-1">{title}</div>
        <div className="text-xs text-neutral-500">{dateTime}</div>
      </div>
      {chip && <span className="text-xs px-2 py-1 rounded-full border border-neutral-300">{chip}</span>}
    </Link>
  );
}


