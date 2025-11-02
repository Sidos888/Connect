"use client";

import ListingRow from "@/components/my-life/ListingRow";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

export default function Page() {
  const items = new Array(5).fill(0).map((_, i) => ({
    title: ["Golf trip", "Pooper", "Nancys Crib", "fire ball", "Fireball FEVER"][i],
    subtitle: "Friday, July 11 • 5:30 AM",
    chip: "Host",
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
            <span className="action-btn-circle">
              <ChevronLeftIcon className="h-5 w-5" />
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Hosting</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {items.map((e, i) => (
          <ListingRow key={i} title={e.title} subtitle={e.subtitle} rightChip={e.chip} />
        ))}
      </div>
    </div>
  );
}