"use client";

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Avatar from '@/components/Avatar';
import { SearchIcon } from '@/components/icons';
import type { Contact } from '@/lib/chat/newMessageFlow';
import { useQueryClient } from '@tanstack/react-query';
import { chatKeys } from '@/lib/chatQueries';

interface AddGroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  existingMemberIds: string[];
  onMembersAdded?: () => void;
}

export default function AddGroupMembersModal({
  isOpen,
  onClose,
  chatId,
  existingMemberIds = [],
  onMembersAdded
}: AddGroupMembersModalProps) {
  const { account } = useAuth();
  const chatService = useChatService();
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
      if (account?.id && chatService) {
        loadContacts();
      }
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
        setSelectedContactIds(new Set());
        setSearchQuery("");
      }, 300);
    }
  }, [isOpen, account?.id, chatService]);

  // Detect device corner radius on mount
  useEffect(() => {
    getDeviceCornerRadius().then(radius => {
      setCornerRadius(radius);
    });
  }, []);

  // Load contacts (excluding existing members)
  const loadContacts = async () => {
    if (!account?.id) {
      setLoading(false);
      return;
    }

    if (!chatService) {
      setLoading(true);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase client not available");
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in to see your contacts");
        return;
      }
      
      if (!chatService) {
        setError("Chat service not available");
        return;
      }

      const { contacts: contactsList, error: contactsError } =
        await chatService.getContacts(user.id);

      if (contactsError) {
        console.error("Error loading contacts:", contactsError);
        setError("Failed to load contacts");
        return;
      }

      // Filter out existing members
      const existingIdsSet = new Set(existingMemberIds);
      const availableContacts = contactsList.filter(
        contact => !existingIdsSet.has(contact.id)
      );

      const contactsListFormatted: Contact[] = availableContacts.map(
        (contact) => ({
          id: contact.id,
          name: contact.name,
          profile_pic: contact.profile_pic,
          type: "person" as const,
        })
      );

      setContacts(contactsListFormatted);
    } catch (err) {
      console.error("Error loading contacts:", err);
      setError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  // Reload contacts when existingMemberIds changes
  useEffect(() => {
    if (isOpen && account?.id && chatService) {
      loadContacts();
    }
  }, [existingMemberIds.join(',')]); // Re-run when existingMemberIds changes

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [shouldRender]);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  const handleToggleSelection = (contactId: string) => {
    setSelectedContactIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const handleAddMembers = async () => {
    if (selectedContactIds.size === 0 || !chatService || adding) return;

    setAdding(true);
    try {
      const memberIds = Array.from(selectedContactIds);
      const { error: addError } = await chatService.addMembersToGroup(chatId, memberIds);

      if (addError) {
        console.error('Error adding members:', addError);
        alert(`Failed to add members: ${addError.message}`);
        setAdding(false);
        return;
      }

      // Invalidate queries to refresh the member list
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });

      // Call callback if provided
      if (onMembersAdded) {
        onMembersAdded();
      }

      // Close modal
      handleClose();
    } catch (err) {
      console.error('Error adding members:', err);
      alert('An unexpected error occurred while adding members');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const hasChanges = selectedContactIds.size > 0;

  if (!shouldRender) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isVisible ? 1 : 0
        }}
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: '100%',
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
          transform: isVisible 
            ? 'translateY(0)' 
            : 'translateY(100%)',
        }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4" style={{ 
            paddingTop: 'max(env(safe-area-inset-top), 70px)',
            paddingBottom: '16px',
            position: 'relative',
            zIndex: 10
          }}>
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
                  onClick={handleClose}
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

              {/* Right: Tick Button */}
              <div className="absolute right-0 flex items-center gap-3" style={{ 
                top: '0', 
                height: '44px' 
              }}>
                <button
                  onClick={handleAddMembers}
                  disabled={!hasChanges || adding}
                  className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '100px',
                    background: hasChanges ? '#FF6600' : '#9CA3AF',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    if (hasChanges && !adding) {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <Check size={18} className="text-white" strokeWidth={2.5} />
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
                  Add Members
                </h2>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-shrink-0" style={{ padding: '24px 16px 16px 16px' }}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full focus:outline-none"
                style={{
                  borderRadius: "100px",
                  height: "46.5px",
                  background: "rgba(255, 255, 255, 0.9)",
                  borderWidth: "0.4px",
                  borderColor: "#E5E7EB",
                  borderStyle: "solid",
                  boxShadow:
                    "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)",
                  willChange: "transform, box-shadow",
                  paddingLeft: "48px",
                  paddingRight: "24px",
                  fontSize: "16px",
                  WebkitAppearance: "none",
                  WebkitTapHighlightColor: "transparent",
                  color: "#111827",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)";
                }}
              />
              <div
                className="absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none"
                style={{ width: "48px" }}
              >
                <SearchIcon
                  size={20}
                  className="text-gray-900"
                  style={{ strokeWidth: 2.5 }}
                />
              </div>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 flex flex-col overflow-y-auto" style={{ padding: '0 16px 24px 16px' }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-gray-500">Loading contacts...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-gray-500">
                  {searchQuery ? "No contacts found" : existingMemberIds.length > 0 ? "All contacts are already in the group" : "No contacts yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContactIds.has(contact.id);
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleToggleSelection(contact.id)}
                      className="w-full bg-white rounded-xl p-4 flex items-center gap-3 text-left transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                        minHeight: '72px',
                        cursor: 'pointer',
                        willChange: 'transform, box-shadow'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }}
                    >
                      {/* Profile Picture */}
                      <div className="flex-shrink-0">
                        <Avatar
                          src={contact.profile_pic}
                          name={contact.name}
                          size={40}
                        />
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-gray-900 truncate">
                          {contact.name}
                        </div>
                      </div>

                      {/* Selection Circle */}
                      <div className="flex-shrink-0">
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            borderWidth: '2px',
                            borderColor: isSelected ? '#F97316' : '#D1D5DB',
                            borderStyle: 'solid',
                            background: isSelected ? '#F97316' : 'transparent'
                          }}
                        >
                          {isSelected && (
                            <div
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: 'white'
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

