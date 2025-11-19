"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ListingDetailPageWrapper from './[id]/ListingDetailPageWrapper';

function ListingPageContent() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get('id');

  if (!listingId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Listing not found</p>
      </div>
    );
  }

  return <ListingDetailPageWrapper listingId={listingId} />;
}

export default function ListingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <ListingPageContent />
    </Suspense>
  );
}

