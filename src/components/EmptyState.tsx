"use client";

import * as React from "react";

type Props = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <div className="text-center py-12 text-neutral-600">
      <div className="mx-auto max-w-sm">
        <div className="rounded-2xl border-2 border-neutral-200 p-6">
          <div className="text-neutral-900 text-lg font-semibold mb-2">{title}</div>
          {icon && <div className="text-3xl mb-2">{icon}</div>}
          {subtitle && <div className="text-sm">{subtitle}</div>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}


