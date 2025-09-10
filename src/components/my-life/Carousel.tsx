import * as React from "react";

export default function Carousel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory">
      <div className="flex items-stretch gap-3 pr-6">
        {children}
      </div>
    </div>
  );
}


