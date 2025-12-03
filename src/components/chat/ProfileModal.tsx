"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfilePage from '@/components/profile/ProfilePage';
import { useAuth } from '@/lib/authContext';

interface ProfileModalProps {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, userId, onClose }: ProfileModalProps) {
  const { account } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Import getSupabaseClient dynamically
        const { getSupabaseClient } = await import('@/lib/supabaseClient');
        const supabase = getSupabaseClient();
        
        if (!supabase) {
          console.error('ProfileModal: No supabase client');
          setLoading(false);
          return;
        }

        // Fetch profile data (same fields as profile page)
        const { data, error } = await supabase
          .from('accounts')
          .select('id, name, profile_pic, bio')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('ProfileModal: Error fetching profile:', error);
          setLoading(false);
          return;
        }

        if (data) {
          setProfile({
            id: data.id,
            name: data.name || undefined,
            avatarUrl: data.profile_pic || undefined,
            bio: data.bio || undefined
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && userId) {
      loadProfile();
    }
  }, [isOpen, userId]);

  if (!isOpen || !userId) return null;

  const isOwnProfile = account?.id === userId;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white"
      style={{
        touchAction: 'pan-y',
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : profile ? (
        <ProfilePage
          profile={profile}
          isOwnProfile={isOwnProfile}
          showBackButton={true}
          onClose={onClose}
          onEdit={isOwnProfile ? () => {
            onClose();
            router.push('/settings/edit/details');
          } : undefined}
          onSettings={isOwnProfile ? () => {
            onClose();
            router.push('/settings');
          } : undefined}
          onShare={isOwnProfile ? () => {
            onClose();
            router.push('/menu?view=share-profile');
          } : undefined}
          onOpenTimeline={() => {
            onClose();
            router.push(`/timeline?userId=${userId}`);
          }}
          onOpenHighlights={() => {
            onClose();
            router.push(`/highlights?userId=${userId}`);
          }}
          onOpenBadges={() => {
            onClose();
            router.push(`/achievements?userId=${userId}`);
          }}
          onOpenConnections={() => {
            onClose();
            router.push(`/connections?userId=${userId}`);
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Profile not found</div>
        </div>
      )}
    </div>
  );
}

