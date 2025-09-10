import Link from "next/link";
import { ReactNode } from "react";

export default function MenuItem({
  icon, label, href, onClick,
}: { icon: ReactNode; label: string; href?: string; onClick?: () => void; }) {
  const baseClasses = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none transition-colors";
  
  if (href) {
    return (
      <Link
        href={href}
        className={baseClasses}
        role="menuitem"
      >
        <span className="text-neutral-600">{icon}</span>
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={baseClasses}
      role="menuitem"
    >
      <span className="text-neutral-600">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
