"use client";

import { useAppStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

export default function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { personalProfile, isHydrated } = useAppStore();

  React.useEffect(() => {
    if (!isHydrated) return;
    if (!personalProfile && pathname !== "/onboarding" && pathname !== "/") {
      router.replace("/onboarding");
    }
  }, [personalProfile, isHydrated, pathname, router]);

  if (!isHydrated) {
    return <div className="animate-pulse h-1 w-full bg-neutral-200" />;
  }
  return <>{children}</>;
}


