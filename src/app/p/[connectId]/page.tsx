import { Suspense } from "react";
import ConnectIdProfileClient from "./ConnectIdProfileClient";

// Required for static export
export async function generateStaticParams() {
  // Return a placeholder for static export
  // Actual profile rendering will happen client-side
  return [{ connectId: 'placeholder' }];
}

// Force static rendering for static export compatibility
export const dynamic = 'force-static';
export const revalidate = false;

interface ConnectIdProfilePageProps {
  params: {
    connectId: string;
  };
}

export default function ConnectIdProfilePage({ params }: ConnectIdProfilePageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    }>
      <ConnectIdProfileClient connectId={params.connectId} />
    </Suspense>
  );
}
