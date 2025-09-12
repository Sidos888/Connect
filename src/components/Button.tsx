"use client";

import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
};

export default function Button({ variant = "primary", className, ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 ring-brand disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<NonNullable<Props["variant"]>, string> = {
    primary: "bg-brand text-white hover:opacity-90",
    secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
    ghost: "bg-transparent text-neutral-900 hover:bg-neutral-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  return <button className={`${base} ${variants[variant]} ${className ?? ""}`} {...rest} />;
}


