"use client";

import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };

export default function Input({ label, className, ...rest }: Props) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-sm text-neutral-600">{label}</span>}
      <input
        className={`w-full rounded-md border border-neutral-200 px-3 py-2 text-base shadow-sm focus:border-gray-500 focus:outline-none ${className ?? ""}`}
        {...rest}
      />
    </label>
  );
}


