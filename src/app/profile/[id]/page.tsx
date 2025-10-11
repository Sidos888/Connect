"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import InlineProfileView from "@/components/InlineProfileView";
import MobileTitle from "@/components/MobileTitle";
import { ArrowLeft } from "lucide-react";

// Required for static export
export async function generateStaticParams() {
  return [];
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleStartChat = async (chatId: string) => {
    router.push(`/chat?chat=${chatId}`);
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileTitle 
          title="Profile" 
          action={
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 ring-brand rounded-full"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-black" />
            </button>
          }
        />
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 ring-brand rounded-full"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-black" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="lg:pt-6">
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <InlineProfileView
              userId={userId}
              entryPoint="profile"
              onBack={handleBack}
              onStartChat={handleStartChat}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
