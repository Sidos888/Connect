import BusinessNotificationsClient from './BusinessNotificationsClient';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return [
    { id: 'demo' },
    { id: 'example' }
  ];
}

export default function BusinessNotificationsPage() {
  return <BusinessNotificationsClient />;
}
