import ListingDetailPageWrapper from './ListingDetailPageWrapper';

// Required for static export
export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

interface ListingDetailPageProps {
  params: {
    id: string;
  };
}

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  return <ListingDetailPageWrapper listingId={params.id} />;
}
