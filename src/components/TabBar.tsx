"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

export type TabItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

type Props = {
  items: TabItem[];
};

export default function TabBar({ items }: Props) {
  const pathname = usePathname();
  
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white z-50 shadow-none border-none">
      <ul className="grid grid-cols-4 px-2 py-1">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="text-center">
              <Link href={item.href} className={`block py-2 px-1 text-xs ${active ? "text-brand" : "text-neutral-500"}`}>
                <div className="flex flex-col items-center gap-0.5">
                  <span aria-hidden className="h-5 w-5">
                    {item.icon}
                  </span>
                  <span className={`${active ? "font-semibold" : ""}`}>{item.label}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="pb-safe-bottom"></div>
    </nav>
  );
}


