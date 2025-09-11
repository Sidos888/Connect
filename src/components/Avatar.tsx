"use client";

import * as React from "react";

type Props = {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
};

export default function Avatar({ src, name = "?", size = 32, className }: Props) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";
  return (
    <div
      className={`rounded-full overflow-hidden ${src ? 'bg-neutral-200 text-neutral-700' : 'border-2 border-gray-400 bg-transparent text-gray-400'} flex items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-label={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover rounded-full" />
      ) : (
        <span className="text-sm font-medium">{initial}</span>
      )}
    </div>
  );
}


