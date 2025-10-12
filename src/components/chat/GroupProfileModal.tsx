"use client";

import React, { useState, useEffect } from 'react';
import { X, Camera, Users, MoreVertical, Edit3, Settings, Images, MessageCircle, Share } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useAppStore } from '@/lib/store';
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
  const { account, chatService } = useAuth();
  const { loadConversations } = useAppStore();
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
      console.log('GroupProfileModal: loadGroupProfile called with chatId:', chatId, 'isOpen:', isOpen);
      if (!chatId || !isOpen) return;

      try {
        console.log('GroupProfileModal: Starting to load group profile...');
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

          console.log('GroupProfileModal: Setting group profile with photo:', chat.photo);
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

        // Clear all caches so fresh data is loaded
        simpleChatService.clearAllCaches();

      // Update local state
      setGroupProfile(prev => prev ? { 
        ...prev, 
        name: editName.trim(),
        photo: photoUrl || prev.photo
      } : null);
      
      console.log('Local state updated');
      
      // Reset state
      setIsEditing(false);
      setSelectedImage(null);
      setImagePreview(null);
      
      console.log('Edit state reset');
      
      // Reload the group profile to get the updated data
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
        
        console.log('Group profile reloaded with updated data');
      }
      
      // Reload conversations to update the chat list with the new photo
      if (account?.id && chatService) {
        await loadConversations(account.id, chatService);
        console.log('Conversations reloaded to show updated group photo');
      }
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

  console.log('GroupProfileModal: Rendering with isOpen:', isOpen, 'chatId:', chatId);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      {/* Dimming overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />
      
      {/* Modal content - Simple Edit Profile style */}
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl relative" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Profile' : 'Group Info'}
          </h2>
          {!isEditing && (isAdmin || isMember) && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Edit
            </button>
          )}
          {isEditing && (
            <div className="w-6" />
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="ml-3 text-gray-600">Loading group profile...</p>
            </div>
          ) : error || !groupProfile ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error || 'Group profile not found'}</p>
              <p className="text-gray-500 text-sm mb-4">Chat ID: {chatId}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {isEditing ? (
                // Edit Form
                <>
                  {/* Profile Image Section */}
                  <div className="text-center">
                    <div className="relative inline-block">
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
                      {/* Edit button overlay */}
                      <button
                        onClick={handlePhotoChange}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    
                    {/* Hidden file input */}
                    <input
                      id="group-photo-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    
                    {/* Edit link */}
                    <button
                      onClick={handlePhotoChange}
                      className="text-sm text-gray-600 hover:text-gray-900 mt-2 underline"
                    >
                      Edit
                    </button>
                    
                    {/* Selected file name */}
                    {selectedImage && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedImage.name}
                      </p>
                    )}
                  </div>

                  {/* Group Name Input */}
                  <div>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-center text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Group name"
                    />
                  </div>

                  {/* Bio Input */}
                  <div>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Bio (optional)"
                      className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {editBio.length}/150
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={uploading || !editName.trim()}
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </>
              ) : (
                // Group Info View
                <>
                  {/* Group Profile Display */}
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-auto mb-4">
                      {groupProfile.photo ? (
                        <img
                          src={groupProfile.photo}
                          alt="Group photo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{groupProfile.name}</h3>
                    <p className="text-gray-600 text-sm">{groupProfile.participants.length} members</p>
                    {groupProfile.bio && (
                      <p className="text-gray-600 text-sm mt-2">{groupProfile.bio}</p>
                    )}
                  </div>

                  {/* Members List */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Members</h4>
                    <div className="space-y-2">
                      {groupProfile.participants.slice(0, 5).map((participant) => (
                        <div key={participant.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {participant.profile_pic ? (
                              <img
                                src={participant.profile_pic}
                                alt={participant.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-gray-400 text-xs font-semibold">
                                {participant.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {participant.name}
                              {participant.id === account?.id && ' (You)'}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{participant.role}</p>
                          </div>
                          {participant.role === 'admin' && (
                            <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              Admin
                            </div>
                          )}
                        </div>
                      ))}
                      {groupProfile.participants.length > 5 && (
                        <p className="text-center text-gray-500 text-sm">
                          +{groupProfile.participants.length - 5} more members
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
