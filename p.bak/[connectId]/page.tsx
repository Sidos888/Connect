import ProfilePageClient from './ProfilePageClient';

export async function generateStaticParams() {
  // Return empty array since this is a dynamic route that will be generated at runtime
  return [];
}

interface ProfilePageProps {
  params: {
    connectId: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return <ProfilePageClient connectId={params.connectId} />;
}
