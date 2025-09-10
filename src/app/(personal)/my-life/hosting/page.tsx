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
    <div className="space-y-4">
      <div className="relative flex items-center justify-center mb-5 md:mb-6">
        <Link href="/my-life" className="absolute left-0 p-2">
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-2xl font-semibold text-center">Hosting</h1>
      </div>
      {items.map((e, i) => (
        <ListingRow key={i} title={e.title} subtitle={e.subtitle} rightChip={e.chip} />
      ))}
    </div>
  );
}


