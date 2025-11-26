"use client";

import ListingDetailPageClient from './ListingDetailPageClient';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface ListingDetailPageWrapperProps {
  listingId: string;
}

export default function ListingDetailPageWrapper({ listingId }: ListingDetailPageWrapperProps) {
  return (
    <ProtectedRoute 
      title="Listing Details" 
      description="Log in / sign up to view listing details" 
      buttonText="Log in"
    >
      <ListingDetailPageClient listingId={listingId} />
    </ProtectedRoute>
  );
}




