"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import InlineProfileView from "@/components/InlineProfileView";
import MobileTitle from "@/components/MobileTitle";
import { ArrowLeft } from "lucide-react";

interface ConnectIdProfileClientProps {
  connectId: string;
}

export default function ConnectIdProfileClient({ connectId }: ConnectIdProfileClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get('from');
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lookupUser = async () => {
      if (!connectId) {
        setError("Invalid profile link");
        setLoading(false);
        return;
      }

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('ConnectIdProfileClient: Lookup timeout after 10 seconds');
        setError("Request timed out. Please try again.");
        setLoading(false);
      }, 10000);

      try {
        setLoading(true);
        setError(null);

        const supabase = getSupabaseClient();
        const upperConnectId = connectId.toUpperCase();
        
        console.log('ConnectIdProfileClient: Looking up user by connectId:', upperConnectId);
        const startTime = Date.now();
        
        // Look up user by connect_id
        const { data, error: lookupError } = await supabase
          .from('accounts')
          .select('id')
          .eq('connect_id', upperConnectId) // connectId is uppercase
          .single();

        const duration = Date.now() - startTime;
        console.log(`ConnectIdProfileClient: Query completed in ${duration}ms`);

        clearTimeout(timeoutId);

        if (lookupError) {
          console.error('ConnectIdProfileClient: Database error:', { 
            connectId: upperConnectId, 
            error: lookupError,
            code: lookupError.code,
            message: lookupError.message,
            details: lookupError.details,
            hint: lookupError.hint
          });
          
          // Check if it's an RLS policy issue
          if (lookupError.code === 'PGRST116' || lookupError.message?.includes('row-level security')) {
            setError("Unable to access profile. This may be a privacy setting.");
          } else {
            setError("Profile not found");
          }
          setLoading(false);
          return;
        }

        if (!data || !data.id) {
          console.error('ConnectIdProfileClient: No user found for connectId:', upperConnectId);
          setError("Profile not found");
          setLoading(false);
          return;
        }

        console.log('ConnectIdProfileClient: ✅ Found user:', { 
          connectId: upperConnectId, 
          userId: data.id,
          lookupTime: `${duration}ms`
        });
        setUserId(data.id);
        setLoading(false);
        
        // Log success for debugging
        console.log('ConnectIdProfileClient: Profile will now render for userId:', data.id);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('ConnectIdProfileClient: Exception in lookupUser:', err);
        setError("Failed to load profile");
        setLoading(false);
      }
    };

    lookupUser();
  }, [connectId]);

  const handleStartChat = async (chatId: string) => {
    router.push(`/chat?chat=${chatId}`);
  };

  const handleBack = () => {
    // If "from" parameter exists, navigate to that URL instead of going back
    if (fromParam) {
      router.push(fromParam);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          {/* 3-dot loading animation */}
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !userId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p className="text-red-600 mb-4">{error || "Profile not found"}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
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
    </>
  );
}

