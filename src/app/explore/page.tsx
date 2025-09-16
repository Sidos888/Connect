"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ExplorePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the root page which contains the explore functionality
    router.replace("/");
  }, [router]);

  // Redirect immediately without loading animation
  return null;
}
