"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onEsc);
    
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);


  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-full bg-white hover:bg-gray-50 transition-colors border border-neutral-200 shadow-sm focus:outline-none"
      >
        <Bell size={18} className="text-gray-700" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-[400px] h-[640px] rounded-xl border border-neutral-200 bg-white shadow-sm p-5">
          {/* Main content area to match profile menu height */}
          <div className="space-y-3">
            {/* Profile-like section */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="p-4 text-center">
                  <h4 className="text-base font-medium text-gray-900 mb-2">You have no notifications yet</h4>
                  <p className="text-sm text-gray-500">As they haven&apos;t been set up...</p>
              </div>
            </div>
            
            {/* Spacer to match menu items height */}
            <div className="my-3 border-t border-neutral-200" />
            
            {/* Empty space to match menu items */}
            <div className="space-y-0.5">
              <div className="h-10"></div>
              <div className="h-10"></div>
              <div className="h-10"></div>
              <div className="h-10"></div>
              <div className="h-10"></div>
              <div className="h-10"></div>
            </div>
            
            {/* Bottom section to match quick switcher */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="space-y-2">
                <div className="h-12"></div>
                <div className="h-12"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
