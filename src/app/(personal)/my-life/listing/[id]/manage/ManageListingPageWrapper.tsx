"use client";

import { useRouter } from 'next/navigation';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";

interface ManageListingPageWrapperProps {
  listingId: string;
}

export default function ManageListingPageWrapper({ listingId }: ManageListingPageWrapperProps) {
  const router = useRouter();

  return (
    <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Manage Listing"
          backButton
          onBack={() => {
            // Use router.back() for client-side navigation (works better than window.location.href)
            router.back();
          }}
        />

        <PageContent>
          <div 
            className="px-4 pb-16" 
            style={{ 
              paddingTop: 'var(--saved-content-padding-top, 140px)',
            }}
          >
            <div className="text-center py-12">
              <p className="text-base font-normal text-gray-500">Manage listing</p>
            </div>
          </div>
        </PageContent>
      </MobilePage>
    </div>
  );
}

