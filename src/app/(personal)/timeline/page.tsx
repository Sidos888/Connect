"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function TimelinePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect to menu life view - preserving userId if present (same pattern as connections page)
  // This avoids dynamic routes and uses query parameters instead, preventing RSC payload errors
  useEffect(() => {
    const userId = searchParams?.get('userId');
    const from = searchParams?.get('from');
    console.log('🔶 Timeline page redirect:', { userId, from });
    
    if (userId) {
      // Viewing another user's timeline - redirect to menu with userId (no dynamic routes!)
      router.replace(`/menu?view=life&userId=${userId}${from ? `&from=${from}` : ''}`);
    } else {
      // Viewing own timeline - redirect to menu life view
      router.replace('/menu?view=life');
    }
  }, [router, searchParams]);
    
  return null;
}

export default function TimelinePage() {
  return (
    <Suspense fallback={null}>
      <TimelinePageContent />
    </Suspense>
  );
}




