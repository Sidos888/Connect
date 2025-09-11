"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExplorePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the root page which contains the explore functionality
    router.replace("/");
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
    </div>
  );
}
