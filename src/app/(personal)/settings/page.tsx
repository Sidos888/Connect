"use client";

import Button from "@/components/Button";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";

export default function SettingsPage() {
  const router = useRouter();
  const { clearAll } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-md hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Go back"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <section className="space-y-3">
        <div className="text-sm text-neutral-600">Account</div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            clearAll();
            router.replace("/onboarding");
          }}
        >
          Sign out (clear local)
        </Button>
      </section>
    </div>
  );
}


