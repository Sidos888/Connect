"use client";

import { ReactNode } from "react";

interface MobileTitleProps {
  title: string;
  showDivider?: boolean;
  action?: ReactNode;
}

export default function MobileTitle({ title, showDivider = true, action }: MobileTitleProps) {
  return (
    <div className="lg:hidden">
      <div className="pt-safe-top px-4 py-4 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {action && action}
        </div>
      </div>
      {showDivider && <div className="border-t border-gray-200" />}
    </div>
  );
}
