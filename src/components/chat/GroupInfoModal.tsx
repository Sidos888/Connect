"use client";

import { useEffect, useState, useRef } from "react";
import { X, MessageCircle, Share, Images, Settings, Users, Camera, Edit, UserPlus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/authContext";
// simpleChatService removed - using chatService from useAuth
import { connectionsService } from "@/lib/connectionsService";
import Avatar from "@/components/Avatar";
import { useRouter } from "next/navigation";
import InlineProfileView from '../InlineProfileView';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

interface GroupProfile {
  id: string;
  name: string;
  photo?: string | null;
  created_by: string;
  participants: Array<{
    id: string;
    name: string;
    profile_pic?: string;
    role?: string;
  }>;
  bio?: string;
}

export default function GroupInfoModal({ isOpen, onClose, chatId }: GroupInfoModalProps) {
  const { account } = useAuth();
  const router = useRouter();
  const [groupProfile, setGroupProfile] = useState<GroupProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  // Edit form state
  const [groupName, setGroupName] = useState('');
  const [groupBio, setGroupBio] = useState('');
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadGroupProfile = async () => {
      if (!chatId || !isOpen) return;

      try {
        setLoading(true);
        setError(null);

        const { chat } = await simpleChatService.getChatById(chatId);
        
        if (chat && chat.type === 'group') {
          const groupData = {
            id: chat.id,
            name: chat.name || 'Group Chat',
            photo: chat.photo,
            created_by: (chat as any).created_by || '',
            participants: chat.participants.map(p => ({
              id: p.id,
              name: p.name,
              profile_pic: p.profile_pic,
              role: (p as any).role || 'member'
            })),
            bio: (chat as any).bio
          };
          setGroupProfile(groupData);
          
          // Initialize edit form state
          setGroupName(groupData.name);
          setGroupBio(groupData.bio || '');
          setGroupPhoto(groupData.photo || null);
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

  const isAdmin = account?.id === groupProfile?.created_by;

  // Edit handlers
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (groupProfile) {
      setGroupName(groupProfile.name);
      setGroupBio(groupProfile.bio || '');
      setGroupPhoto(groupProfile.photo || null);
    }
  };

  const handleSaveChanges = async () => {
    if (!groupProfile || !chatId) return;
    
    try {
      setSaving(true);
      
      // Update group in database
      const { error } = await (simpleChatService as any).updateGroupProfile(chatId, {
        name: groupName,
        bio: groupBio,
        photo: groupPhoto
      });
      
      if (error) {
        console.error('Error updating group:', error);
        return;
      }
      
      // Update local state
      const updatedGroup = {
        ...groupProfile,
        name: groupName,
        bio: groupBio,
        photo: groupPhoto
      };
      
      setGroupProfile(updatedGroup);
      setIsEditing(false);
      
    } catch (err) {
      console.error('Error saving group changes:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGroupPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMemberClick = (memberId: string) => {
    setSelectedMemberId(memberId);
    setShowMemberProfile(true);
  };

  const handleBackToGroup = () => {
    setShowMemberProfile(false);
    setSelectedMemberId(null);
  };



  // Debug logging
  // Check if current user is admin

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
      <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
        {/* Floating Action Buttons */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <button
            onClick={isEditing ? handleCancelEdit : showMemberProfile ? handleBackToGroup : onClose}
            className="p-0 bg-transparent pointer-events-auto"
          >
            {isEditing || showMemberProfile ? (
              <span className="action-btn-circle">
                <ArrowLeft className="w-5 h-5 text-gray-900" />
              </span>
            ) : (
              <span className="action-btn-circle">
                <X className="w-5 h-5 text-gray-900" />
              </span>
            )}
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6" style={{ paddingTop: '30px' }}>
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
          ) : showMemberProfile ? (
            /* Member Profile View - Using InlineProfileView */
            <div className="w-full h-full">
              <InlineProfileView
                userId={selectedMemberId || ''}
                entryPoint="chat"
                onBack={handleBackToGroup}
              />
            </div>
          ) : isEditing ? (
            /* Edit Mode - Direct Modal Content (no card wrapper) */
            <>
              {/* Group Photo */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-2">
                  <Avatar
                    src={groupPhoto}
                    name={groupName}
                    size={140} // Large size like the profile page
                  />
                </div>
                {/* Hidden file input for photo upload */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="group-photo-upload"
                />
                {/* "Edit" text below the avatar - clickable to open photo selector */}
                <label
                  htmlFor="group-photo-upload"
                  className="text-sm text-gray-600 hover:text-gray-900 underline cursor-pointer mb-4 block"
                >
                  Edit
                </label>
              </div>

              {/* Group Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  placeholder="Enter group name"
                />
              </div>

              {/* Group Bio */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={groupBio}
                  onChange={(e) => setGroupBio(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                  placeholder="Enter group bio"
                />
              </div>

              {/* Save Button */}
              <div className="mt-6">
                <button
                  onClick={handleSaveChanges}
                  disabled={saving || !groupName.trim()}
                  className="w-full px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          ) : (
            /* View Mode - Original Content */
            <>
              {/* Group Profile Card Section */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm relative">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-auto">
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
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{groupProfile.name}</h3>
                  <p className="text-gray-600 mb-4">{groupProfile.participants.length} members</p>
                  
                  {/* Edit link - positioned in top right of card */}
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={handleEdit}
                      className="text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-8 justify-center mb-8">
                <button className="flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                    <MessageCircle className="w-8 h-8 text-black" />
                  </div>
                  <span className="text-sm font-medium text-black">Message</span>
                </button>

                <button className="flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                    <UserPlus className="w-8 h-8 text-black" />
                  </div>
                  <span className="text-sm font-medium text-black">Invite</span>
                </button>

                <button className="flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                    <Share className="w-8 h-8 text-black" />
                  </div>
                  <span className="text-sm font-medium text-black">Share</span>
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
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Members</h4>
                <div className="space-y-3">
                  {groupProfile.participants.map((participant) => (
                    <button
                      key={participant.id}
                      onClick={() => handleMemberClick(participant.id)}
                      className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-left"
                    >
                      <Avatar
                        src={participant.profile_pic}
                        name={participant.name}
                        size={50}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {participant.name}
                          {participant.id === account?.id && ' (You)'}
                        </p>
                        <p className="text-sm text-gray-500">{participant.role === 'admin' ? 'Admin' : 'Member'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
