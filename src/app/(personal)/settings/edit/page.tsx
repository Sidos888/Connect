"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/lib/authContext";

export default function EditProfileLandingPage() {
  const router = useRouter();
  const { account } = useAuth();

  useEffect(() => {
    const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
    if (bottomNav) (bottomNav as HTMLElement).style.display = 'none';
    return () => { if (bottomNav) (bottomNav as HTMLElement).style.display = ''; };
  }, []);

  const Card = ({ title, onClick }: { title: string; onClick: () => void }) => (
    <button onClick={onClick} className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-5 shadow-sm text-left active:scale-[0.995] transition-transform">
      <div className="text-center text-lg font-semibold text-neutral-900">{title}</div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col lg:max-w-2xl lg:mx-auto">
      <div className="bg-white px-4 pt-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="relative w-full h-14 flex items-center justify-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '56px' }}>
          <button
            onClick={() => router.back()}
            className="absolute left-0 flex items-center justify-center w-10 h-10"
            style={{
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Edit Profile</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 lg:px-8 overflow-y-auto">
        {/* Profile card */}
        <div className="mb-6">
          <div className="max-w-lg mx-auto lg:max-w-xl">
            <div
              className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 grid grid-cols-[40px_1fr_40px] items-center"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
              }}
            >
              <div className="flex items-center">
                <Avatar src={account?.profile_pic ?? undefined} name={account?.name ?? 'Your Name'} size={36} />
              </div>
              <div className="text-base font-semibold text-gray-900 text-center">
                {account?.name ?? 'Your Name'}
              </div>
              <div></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* My Links smaller pill-like card */}
          <button
            onClick={() => router.push('/settings/edit/links')}
            className="mx-auto block w-44 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-center active:scale-[0.995] transition-transform"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
          >
            <span className="text-base font-semibold text-neutral-900">My Links</span>
          </button>
          <button
            onClick={() => router.push('/settings/edit/details')}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-5 text-left active:scale-[0.995] transition-transform"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
          >
            <div className="text-center text-lg font-semibold text-neutral-900">Personal Details</div>
          </button>
          <button
            onClick={() => router.push('/timeline')}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-5 text-left active:scale-[0.995] transition-transform"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
          >
            <div className="text-center text-lg font-semibold text-neutral-900">My Timeline</div>
          </button>
          <button
            onClick={() => router.push('/settings/edit/highlights')}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-5 text-left active:scale-[0.995] transition-transform"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
          >
            <div className="text-center text-lg font-semibold text-neutral-900">Highlights</div>
          </button>
        </div>
      </div>
    </div>
  );
}


