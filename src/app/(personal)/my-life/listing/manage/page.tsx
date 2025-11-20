"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import ManageListingPageWrapper from './ManageListingPageWrapper';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ManageListingPage() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get('id');

  if (!listingId) {
    return (
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">No listing ID provided</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute 
      title="Manage Listing" 
      description="Log in / sign up to manage your listing" 
      buttonText="Log in"
    >
      <ManageListingPageWrapper listingId={listingId} />
    </ProtectedRoute>
  );
}

