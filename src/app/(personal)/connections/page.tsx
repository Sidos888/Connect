"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ConnectionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect to menu connections view - preserving userId if present
  useEffect(() => {
    const userId = searchParams?.get('userId');
    console.log('🔶 Connections page redirect:', { userId });
    
    if (userId) {
      // Viewing another user's connections - redirect to menu with userId
      router.replace(`/menu?view=friend-connections&userId=${userId}`);
    } else {
      // Viewing own connections - redirect to menu connections view
      router.replace('/menu?view=connections');
    }
  }, [router, searchParams]);
    
  return null;
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={null}>
      <ConnectionsPageContent />
    </Suspense>
  );
}

