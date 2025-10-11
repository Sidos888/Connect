import { Suspense } from "react";
import InlineProfileView from "@/components/InlineProfileView";
import MobileTitle from "@/components/MobileTitle";
import { ArrowLeft } from "lucide-react";
import ProfileClientWrapper from "./ProfileClientWrapper";

// Required for static export
export async function generateStaticParams() {
  // Return empty array for dynamic routes in static export
  // This allows the page to be built but won't pre-generate specific IDs
  return [];
}

interface UserProfilePageProps {
  params: {
    id: string;
  };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const userId = params.id;

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      }>
        <ProfileClientWrapper userId={userId} />
      </Suspense>
    </div>
  );
}
