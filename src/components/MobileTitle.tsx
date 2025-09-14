"use client";

import { ReactNode } from "react";

interface MobileTitleProps {
  title: string;
  showDivider?: boolean;
  action?: ReactNode;
}

export default function MobileTitle({ title, showDivider = true, action }: MobileTitleProps) {
  return (
    <div className="lg:hidden sticky top-0 z-40 bg-white">
      <div className="pt-safe-top px-4 pb-2 pt-8 bg-white h-[96px] flex items-end">
        <div className="flex items-center justify-between w-full h-full">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center justify-center h-full">
            {action && action}
          </div>
        </div>
      </div>
      {showDivider && <div className="border-t border-gray-200" />}
    </div>
  );
}
