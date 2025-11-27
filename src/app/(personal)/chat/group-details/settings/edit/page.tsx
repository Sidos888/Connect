"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { Check, X, Camera } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/lib/chatQueries";
import Image from "next/image";

function EditGroupSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chat');
  const { account } = useAuth();
  const chatService = useChatService();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupName, setGroupName] = useState<string>('');
  const [originalGroupName, setOriginalGroupName] = useState<string>('');
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [originalGroupPhoto, setOriginalGroupPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);

  // Load group data
  useEffect(() => {
    const loadGroupData = async () => {
      if (!chatId || !chatService) {
        setLoading(false);
        return;
      }

      try {
        const { chat, error } = await chatService.getChatById(chatId);
        if (error || !chat) {
          console.error('Error loading chat:', error);
          router.replace('/chat');
          return;
        }

        // Only allow group chats
        if (chat.type !== 'group') {
          router.replace('/chat');
          return;
        }

        const name = chat.name || '';
        const photo = chat.photo || null;

        setGroupName(name);
        setOriginalGroupName(name);
        setGroupPhoto(photo);
        setOriginalGroupPhoto(photo);
        setPhotoPreview(photo);
      } catch (error) {
        console.error('Error in loadGroupData:', error);
        router.replace('/chat');
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [chatId, chatService, router]);

  const handleBack = () => {
    if (chatId) {
      router.push(`/chat/group-details/settings?chat=${chatId}`);
    } else {
      router.push('/chat');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setSelectedPhotoFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setSelectedPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Check if there are unsaved changes
  const hasChanges = 
    groupName.trim() !== originalGroupName.trim() ||
    (selectedPhotoFile !== null) ||
    (photoPreview === null && originalGroupPhoto !== null);

  const uploadGroupPhoto = async (file: File): Promise<string | null> => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabaseClient');
      const supabase = getSupabaseClient();
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${chatId}-${Date.now()}.${fileExt}`;
      const filePath = `group-photos/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading group photo:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!chatId || !chatService || !hasChanges) return;

    setSaving(true);
    try {
      // Prepare updates
      const updates: { name?: string; photo?: string | null } = {};

      // Update name if changed
      if (groupName.trim() !== originalGroupName.trim()) {
        updates.name = groupName.trim();
      }

      // Handle photo update
      if (selectedPhotoFile) {
        // Upload photo first
        const uploadedPhotoUrl = await uploadGroupPhoto(selectedPhotoFile);
        if (!uploadedPhotoUrl) {
          alert('Failed to upload photo. Please try again.');
          setSaving(false);
          return;
        }
        updates.photo = uploadedPhotoUrl;
      } else if (photoPreview === null && originalGroupPhoto !== null) {
        // Photo was removed
        updates.photo = null;
      }

      // Call updateGroupChat
      const { error } = await chatService.updateGroupChat(chatId, updates);

      if (error) {
        console.error('Error updating group:', error);
        alert(error.message || 'Failed to update group. Please try again.');
        setSaving(false);
        return;
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });

      // Update original values
      setOriginalGroupName(groupName.trim());
      setOriginalGroupPhoto(photoPreview || null);
      setSelectedPhotoFile(null);

      // Navigate back
      handleBack();
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Group Details"
            backButton
            onBack={handleBack}
          />
          <PageContent>
            <div 
              className="flex items-center justify-center h-full"
              style={{
                paddingTop: 'var(--saved-content-padding-top, 140px)',
              }}
            >
              <div className="text-gray-500">Loading...</div>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Group Details"
          backButton
          onBack={handleBack}
          customActions={
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '100px',
                background: hasChanges ? '#FF6600' : '#9CA3AF',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
              }}
              onMouseEnter={(e) => {
                if (!saving && hasChanges) {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              aria-label="Save"
            >
              <Check size={18} className="text-white" strokeWidth={2.5} />
            </button>
          }
        />

        <PageContent>
          <div 
            className="px-4 pb-[max(env(safe-area-inset-bottom),24px)]"
            style={{
              paddingTop: 'var(--saved-content-padding-top, 140px)',
            }}
          >
            {/* Top Spacing */}
            <div style={{ height: '24px' }} />

            {/* Group Photo Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt="Group photo"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              {photoPreview && (
                <button
                  onClick={handleRemovePhoto}
                  className="mt-2 text-sm text-red-500 font-medium"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {/* Group Name Input */}
            <div>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full text-center text-lg font-semibold text-gray-900 bg-white border-none outline-none focus:outline-none"
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                {groupName.length}/50 characters
              </p>
            </div>
          </div>
        </PageContent>
      </MobilePage>
    </div>
  );
}

export default function EditGroupSettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditGroupSettingsContent />
    </Suspense>
  );
}
