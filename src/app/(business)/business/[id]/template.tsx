"use client";

import { useAppStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { isHydrated, personalProfile, switchToBusiness } = useAppStore();

  React.useEffect(() => {
    if (!isHydrated) return;
    if (!personalProfile) {
      router.replace("/onboarding");
      return;
    }
    if (id) switchToBusiness(id);
  }, [id, isHydrated, personalProfile, router, switchToBusiness]);

  if (!isHydrated) return <div className="animate-pulse h-1 w-full bg-neutral-200" />;
  return <>{children}</>;
}


