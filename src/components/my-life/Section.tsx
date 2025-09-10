import * as React from "react";
import Link from "next/link";

type Props = {
  title: string;
  count?: number;
  viewAllHref?: string;
  children: React.ReactNode;
};

export default function Section({ title, count, viewAllHref, children }: Props) {
  return (
    <section className="relative rounded-2xl border border-neutral-200 shadow-sm bg-white p-4">
      {viewAllHref && (
        <Link aria-label={`Open ${title}`} href={viewAllHref} className="absolute inset-0" />
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-neutral-900">
            {title}
            {typeof count === "number" ? ` (${count})` : ""}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}


