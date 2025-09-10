"use client";

import * as React from "react";
import TabBar, { TabItem } from "./TabBar";
import { usePathname } from "next/navigation";

type Props = {
  children: React.ReactNode;
  tabs: TabItem[];
};

export default function BaseLayout({ children, tabs }: Props) {
  const pathname = usePathname();
  
  // Only hide tab bar on specific sub-pages, not main sections
  const hideTabBar = Boolean(
    pathname && (
      // Hide on my-life sub-pages (but not /my-life itself)
      (pathname.startsWith("/my-life/") && pathname !== "/my-life" && pathname !== "/my-life/") ||
      // Hide on individual chat pages (but not /chat itself)
      (pathname.startsWith("/chat/") && pathname !== "/chat" && pathname !== "/chat/")
    )
  );
  
  return (
    <div className="min-h-dvh pb-16">
      <div className="pt-safe-top">
        <main className="mx-auto max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg px-4 pb-2 pt-6">{children}</main>
      </div>
      {!hideTabBar && <TabBar items={tabs} />}
    </div>
  );
}


