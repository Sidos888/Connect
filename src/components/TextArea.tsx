"use client";

import * as React from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string };

export default function TextArea({ label, className, ...rest }: Props) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-sm text-neutral-600">{label}</span>}
      <textarea
        className={`w-full rounded-md border border-neutral-200 px-3 py-2 text-base shadow-sm focus:border-gray-500 focus:outline-none resize-none ${className ?? ""}`}
        style={{ resize: 'none' }}
        {...rest}
      />
    </label>
  );
}


