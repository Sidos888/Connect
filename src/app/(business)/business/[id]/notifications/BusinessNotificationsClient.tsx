"use client";

import { ChevronLeftIcon } from "@/components/icons";
import { useRouter, useParams } from "next/navigation";

export default function BusinessNotificationsClient() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col" style={{ paddingBottom: '0' }}>
      {/* Header */}
      <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="flex items-center justify-center relative">
          <button
            onClick={() => router.push(`/business/${id}/menu`)}
            className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Back to menu"
          >
            <span className="back-btn-circle">
              <ChevronLeftIcon className="h-5 w-5" />
            </span>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        <p className="text-sm text-neutral-600">No notifications for this business yet.</p>
      </div>
    </div>
  );
}
