"use client";

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Avatar from '@/components/Avatar';

interface NewGroupChatSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContactIds: string[];
  hideBackdrop?: boolean;
  hideContainer?: boolean;
}

export default function NewGroupChatSlideModal({
  isOpen,
  onClose,
  selectedContactIds,
  hideBackdrop = false,
  hideContainer = false,
}: NewGroupChatSlideModalProps) {
  const router = useRouter();
  const { account } = useAuth();
  const chatService = useChatService();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45);
  const [selectedMembers, setSelectedMembers] = useState<Array<{ id: string; name: string; profile_pic: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
      if (selectedContactIds.length > 0) {
        loadMemberDetails();
      }
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
        setGroupName('');
        setGroupPhoto(null);
      }, 300);
    }
  }, [isOpen, selectedContactIds]);

  // Detect device corner radius on mount
  useEffect(() => {
    getDeviceCornerRadius().then(radius => {
      setCornerRadius(radius);
    });
  }, []);

  // Load member details
  const loadMemberDetails = async () => {
    if (selectedContactIds.length === 0) return;

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        setLoading(false);
        return;
      }

      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('id, name, profile_pic')
        .in('id', selectedContactIds);

      if (error) {
        console.error('Error loading member details:', error);
        setLoading(false);
        return;
      }

      if (accounts) {
        setSelectedMembers(accounts);
      }
    } catch (err) {
      console.error('Error loading member details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [shouldRender]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setGroupPhoto(previewUrl);

      // TODO: Upload to storage and get permanent URL
      // For now, we'll store the file and upload it when creating the group
      // The actual upload will happen in handleCreateGroup
    } catch (error) {
      console.error('Error selecting photo:', error);
      alert('Failed to load image');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (!account?.id || !chatService) {
      alert('Please log in to create a group');
      return;
    }

    setIsCreating(true);

    try {
      let photoUrl: string | undefined = undefined;

      // If a photo was selected, upload it first
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const supabase = getSupabaseClient();
        
        if (supabase) {
          // Upload to storage (use avatars bucket like GroupProfileModal)
          const fileExt = file.name.split('.').pop();
          const fileName = `group-photos/${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading photo:', uploadError);
            // Continue without photo if upload fails
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            
            if (urlData?.publicUrl) {
              photoUrl = urlData.publicUrl;
            }
          }
        }
      }

      // Create the group chat
      const { chat, error: createError } = await chatService.createGroupChat(
        groupName.trim(),
        selectedContactIds,
        photoUrl
      );

      if (createError) {
        throw createError;
      }

      if (chat) {
        // Navigate to the new group chat
        router.push(`/chat/individual?chat=${chat.id}`);
        handleClose();
      }
    } catch (error) {
      console.error('Error creating group chat:', error);
      alert(error instanceof Error ? error.message : 'Failed to create group chat');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!shouldRender && !hideContainer) return null;

  const handleCloseWrapper = () => {
    if (!hideContainer) {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      onClose();
    }
  };

  const content = (
    <div className="h-full flex flex-col">
      {/* Header - Matching new chat page positioning exactly */}
      <div className="px-4" style={{ 
        paddingTop: 'max(env(safe-area-inset-top), 70px)',
        paddingBottom: '16px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Inner container matching PageHeader structure */}
        <div className="relative w-full" style={{ 
          width: '100%', 
          minHeight: '44px',
          pointerEvents: 'auto'
        }}>
          {/* Left: Back Button */}
          <div className="absolute left-0 flex items-center gap-3" style={{ 
            top: '0', 
            height: '44px' 
          }}>
            <button
              onClick={handleCloseWrapper}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <ArrowLeft size={18} className="text-gray-900" strokeWidth={2.5} />
            </button>
          </div>

          {/* Right: Create Button */}
          <div className="absolute right-0 flex items-center gap-3" style={{ 
            top: '0', 
            height: '44px' 
          }}>
            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || isCreating}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: groupName.trim() && !isCreating ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
              }}
              onMouseEnter={(e) => {
                if (groupName.trim() && !isCreating) {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <Check size={18} className="text-gray-900" strokeWidth={2.5} />
            </button>
          </div>
          
          {/* Center: Title */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ 
            top: '0', 
            height: '44px', 
            justifyContent: 'center' 
          }}>
            <h2 className="font-semibold text-gray-900 text-center" style={{ 
              fontSize: '22px',
              lineHeight: '28px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              New Group Chat
            </h2>
          </div>
        </div>
      </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '24px 16px' }}>
          {/* Group Photo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="flex items-center justify-center"
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: groupPhoto ? 'transparent' : '#F3F4F6',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  overflow: 'hidden'
                }}
              >
                {groupPhoto ? (
                  <img
                    src={groupPhoto}
                    alt="Group photo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : null}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'white',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                <Plus size={18} className="text-gray-900" strokeWidth={2.5} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Chat Name */}
          <div className="mb-6">
            <label className="block text-base font-semibold text-gray-900 mb-2">
              Chat Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full focus:outline-none"
              style={{
                borderRadius: "12px",
                height: "48px",
                background: "rgba(255, 255, 255, 0.9)",
                borderWidth: "0.4px",
                borderColor: "#E5E7EB",
                borderStyle: "solid",
                boxShadow:
                  "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)",
                paddingLeft: "16px",
                paddingRight: "16px",
                fontSize: "16px",
                WebkitAppearance: "none",
                WebkitTapHighlightColor: "transparent",
                color: "#111827",
              }}
            />
          </div>

          {/* Members */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Members
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-500">Loading members...</p>
              </div>
            ) : selectedMembers.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-500">No members selected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="w-full bg-white rounded-xl p-4 flex items-center gap-3"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      minHeight: '72px',
                    }}
                  >
                    <div className="flex-shrink-0">
                      <Avatar
                        src={member.profile_pic}
                        name={member.name}
                        size={40}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold text-gray-900 truncate">
                        {member.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );

  if (hideBackdrop && hideContainer) {
    return content;
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      {!hideBackdrop && (
        <div 
          className="absolute inset-0 transition-opacity duration-300 ease-out"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            opacity: isVisible ? 1 : 0
          }}
          onClick={handleCloseWrapper}
        />
      )}
      
      {/* Modal - Almost Full Page */}
      <div 
        className="relative bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: '100%',
          height: '92vh',
          height: '92dvh',
          marginTop: '20px',
          marginBottom: '0px',
          borderTopLeftRadius: `${cornerRadius}px`,
          borderTopRightRadius: `${cornerRadius}px`,
          borderBottomLeftRadius: `${cornerRadius}px`,
          borderBottomRightRadius: `${cornerRadius}px`,
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {content}
      </div>
    </div>
  );
}