import ManageListingPageWrapper from './ManageListingPageWrapper';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Required for static export
export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

interface ManageListingPageProps {
  params: {
    id: string;
  };
}

export default function ManageListingPage({ params }: ManageListingPageProps) {
  return (
    <ProtectedRoute 
      title="Manage Listing" 
      description="Log in / sign up to manage your listing" 
      buttonText="Log in"
    >
      <ManageListingPageWrapper listingId={params.id} />
    </ProtectedRoute>
  );
}

