export const dynamic = 'force-static';

export async function generateStaticParams() {
  return [
    { id: 'demo' },
    { id: 'example' }
  ];
}

export default function BusinessNotificationsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Notifications</h1>
      <p className="text-sm text-neutral-600">No notifications for this business yet.</p>
    </div>
  );
}
