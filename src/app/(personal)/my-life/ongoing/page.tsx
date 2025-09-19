"use client";

import ListingRow from "@/components/my-life/ListingRow";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

export default function Page() {
  const items = new Array(6).fill(0).map((_, i) => ({
    title: `Ongoing Event ${i + 1}`,
    subtitle: "Tuesday, July 15 • 3:30 AM",
  }));

  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col" style={{ paddingBottom: '0' }}>
      {/* Header */}
      <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="flex items-center justify-center relative">
          <Link 
            href="/my-life" 
            className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Back to my life"
          >
            <span className="back-btn-circle">
              <ChevronLeftIcon className="h-5 w-5" />
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Ongoing</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {items.map((e, i) => (
          <ListingRow key={i} title={e.title} subtitle={e.subtitle} />
        ))}
      </div>
    </div>
  );
}