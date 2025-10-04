"use client";

import React, { useState, useEffect } from 'react';
import { X, Camera, Users, MoreVertical, Edit3, Settings, Images, MessageCircle, Share } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { simpleChatService } from '@/lib/simpleChatService';
import Avatar from '@/components/Avatar';

interface GroupProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

interface GroupParticipant {
  id: string;
  name: string;
  profile_pic?: string;
  role: 'admin' | 'member';
}

interface GroupProfile {
  id: string;
  name: string;
  photo?: string;
  participants: GroupParticipant[];
  created_by: string;
}

export default function GroupProfileModal({ isOpen, onClose, chatId }: GroupProfileModalProps) {
  const { account } = useAuth();
  const [groupProfile, setGroupProfile] = useState<GroupProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadGroupProfile = async () => {
      if (!chatId || !isOpen) return;

      try {
        setLoading(true);
        setError(null);

        // Get group chat details
        const { chat } = await simpleChatService.getChatById(chatId);
        
        if (chat && chat.type === 'group') {
          // Prefer participants from chat service (already joined)
          let formattedParticipants: GroupParticipant[] = (chat.participants || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            profile_pic: p.profile_pic,
            role: (chat as any).created_by === p.id ? 'admin' : 'member'
          }));

          // If none found, fallback to a direct query
          if (formattedParticipants.length === 0) {
            try {
              const { data: participants } = await simpleChatService.getSupabaseClient()
                .from('chat_participants')
                .select(`
                  user_id,
                  accounts (
                    id,
                    name,
                    profile_pic
                  )
                `)
                .eq('chat_id', chatId);

              if (participants) {
                formattedParticipants = participants
                  .filter((p: any) => p.accounts)
                  .map((p: any) => ({
                    id: p.accounts.id,
                    name: p.accounts.name,
                    profile_pic: p.accounts.profile_pic,
                    role: p.user_id === chat.created_by ? 'admin' : 'member'
                  }));
              }
            } catch (participantsErr) {
              console.warn('Participants load failed, continuing with empty list', participantsErr);
            }
          }

          setGroupProfile({
            id: chat.id,
            name: chat.name || 'Group Chat',
            photo: chat.photo,
            participants: formattedParticipants,
            created_by: chat.created_by
          });

          setEditName(chat.name || 'Group Chat');
          setEditBio('');
        } else {
          setError('Group chat not found');
        }
      } catch (err) {
        console.error('Error loading group profile:', err);
        setError('Failed to load group profile');
      } finally {
        setLoading(false);
      }
    };

    loadGroupProfile();
  }, [chatId, isOpen]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing && groupProfile) {
      setEditName(groupProfile.name);
    }
  };

  const handleSaveChanges = async () => {
    console.log('Save changes clicked');
    console.log('Group profile:', groupProfile);
    console.log('Edit name:', editName);
    console.log('Selected image:', selectedImage);
    
    if (!groupProfile || !editName.trim()) {
      console.log('Missing required data');
      return;
    }

    try {
      let photoUrl = groupProfile.photo;
      
      // Upload new image if selected
      if (selectedImage) {
        console.log('Uploading selected image...');
        const uploadedUrl = await uploadGroupPhoto(selectedImage);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
          console.log('Image uploaded successfully:', photoUrl);
        } else {
          console.log('Image upload failed');
          alert('Failed to upload image. Please try again.');
          return;
        }
      }

      // Update group data in database
      const updateData: any = { 
        name: editName.trim() 
      };
      
      if (photoUrl) {
        updateData.photo = photoUrl;
      }

      console.log('Updating database with:', updateData);

      const { error } = await simpleChatService.getSupabaseClient()
        .from('chats')
        .update(updateData)
        .eq('id', groupProfile.id);

      if (error) {
        console.error('Error updating group:', error);
        alert('Failed to update group. Please try again.');
        return;
      }

      console.log('Database updated successfully');

      // Update local state
      setGroupProfile(prev => prev ? { 
        ...prev, 
        name: editName.trim(),
        photo: photoUrl || prev.photo
      } : null);
      
      console.log('Local state updated');
      
      // Reset editing state
      setIsEditing(false);
      setSelectedImage(null);
      setImagePreview(null);
      
      console.log('Edit state reset');
    } catch (error) {
      console.error('Error saving group changes:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handlePhotoChange = () => {
    const input = document.getElementById('group-photo-input');
    if (input) (input as HTMLInputElement).click();
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Image select triggered:', event.target.files);
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('Invalid file type:', file.type);
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log('File too large:', file.size);
        alert('Image size must be less than 5MB');
        return;
      }
      
      console.log('Setting selected image and preview');
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('Preview URL created:', e.target?.result);
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No file selected');
    }
  };

  const uploadGroupPhoto = async (file: File): Promise<string | null> => {
    try {
      console.log('Starting upload for file:', file.name);
      setUploading(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${chatId}-${Date.now()}.${fileExt}`;
      const filePath = `group-photos/${fileName}`;
      
      console.log('Uploading to path:', filePath);
      
      // Upload to Supabase Storage
      const { data, error } = await simpleChatService.getSupabaseClient().storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
      
      console.log('Upload successful:', data);
      
      // Get public URL
      const { data: { publicUrl } } = simpleChatService.getSupabaseClient().storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log('Public URL generated:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading group photo:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const isAdmin = account?.id === groupProfile?.created_by;
  const isMember = !!groupProfile?.participants?.some(p => p.id === account?.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimming overlay with smooth transition */}
      <div 
        className="fixed inset-0 transition-opacity duration-300 ease-in-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: isOpen ? 1 : 0
        }}
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Group Info</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : error || !groupProfile ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error || 'Group profile not found'}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Group Profile Card Section */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm relative">
                {/* Edit action in top-right */}
                {(isAdmin || isMember) && (
                  <div className="absolute right-4 top-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveChanges}
                          disabled={uploading}
                          className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}

                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-auto">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Group photo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : groupProfile.photo ? (
                        <img
                          src={groupProfile.photo}
                          alt="Group photo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    {/* Camera overlay when editing */}
                    {isEditing && (
                      <button
                        onClick={handlePhotoChange}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                  
                  {!isEditing ? (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{groupProfile.name}</h3>
                      </div>
                      <p className="text-gray-600">{groupProfile.participants.length} members</p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <input
                        id="group-photo-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                      <div>
                        <button
                          onClick={handlePhotoChange}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          {selectedImage ? 'Change image' : 'Add image'}
                        </button>
                        {selectedImage && (
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedImage.name}
                          </p>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-center text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Group name"
                      />
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Bio (optional)"
                        className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Circular Card Style */}
              <div className="flex space-x-6 justify-center mb-8">
                {/* Message Button */}
                <button className="flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 hover:scale-105">
                  <div className="w-14 h-14 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center hover:shadow-md hover:border-gray-300 transition-all duration-200">
                    <MessageCircle className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Message</span>
                </button>

                {/* Share Profile Button */}
                <button className="flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 hover:scale-105">
                  <div className="w-14 h-14 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center hover:shadow-md hover:border-gray-300 transition-all duration-200">
                    <Share className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Share</span>
                </button>
              </div>

              {/* Media Section */}
              <div className="mb-4">
                <button className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm">
                  <Images className="w-5 h-5" />
                  View Media
                </button>
              </div>

              {/* Settings Section */}
              <div className="mb-6">
                <button className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm">
                  <Settings className="w-5 h-5" />
                  Group Settings
                </button>
              </div>

              {/* Members Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Members</h4>
                  {isAdmin && (
                    <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                      <Users className="w-4 h-4" />
                      Manage
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {groupProfile.participants.slice(0, 3).map((participant) => (
                    <div key={participant.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <Avatar
                        src={participant.profile_pic}
                        name={participant.name}
                        size={40}
                      />
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">
                          {participant.name}
                          {participant.id === account?.id && ' (You)'}
                        </h5>
                        <p className="text-sm text-gray-500 capitalize">{participant.role}</p>
                      </div>
                      {participant.role === 'admin' && (
                        <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          Admin
                        </div>
                      )}
                    </div>
                  ))}
                  {groupProfile.participants.length > 3 && (
                    <div className="text-center text-gray-600 text-sm">
                      +{groupProfile.participants.length - 3} more members
                    </div>
                  )}
                </div>
              </div>

              {/* Group Actions */}
              {isAdmin && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h5 className="font-semibold text-red-900 mb-2">Danger Zone</h5>
                  <p className="text-sm text-red-700 mb-3">
                    Leave group or delete group permanently
                  </p>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
                      Leave Group
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-red-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                      Delete Group
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
