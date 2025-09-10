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
    <div className="space-y-4">
      <div className="relative flex items-center justify-center mb-5 md:mb-6">
        <Link href="/my-life" className="absolute left-0 p-2">
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-2xl font-semibold text-center">Ongoing</h1>
      </div>
      {items.map((e, i) => (
        <ListingRow key={i} title={e.title} subtitle={e.subtitle} />
      ))}
    </div>
  );
}


