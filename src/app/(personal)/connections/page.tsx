"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

function ConnectionsPageContent() {
  const router = useRouter();

  // Redirect to menu connections view - this is the "real" connections page
  useEffect(() => {
    router.replace('/menu?view=connections');
  }, [router]);
    
  return null;
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={null}>
      <ConnectionsPageContent />
    </Suspense>
  );
}

