"use client";

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Avatar from '@/components/Avatar';
import { SearchIcon } from '@/components/icons';
import type { Contact } from '@/lib/chat/newMessageFlow';

interface AddMembersSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (selectedContactIds: string[]) => void;
  slideDirection?: 'left' | 'right';
  hideBackdrop?: boolean;
  hideContainer?: boolean;
}

export default function AddMembersSlideModal({
  isOpen,
  onClose,
  onNext,
  slideDirection = 'right',
  hideBackdrop = false,
  hideContainer = false,
}: AddMembersSlideModalProps) {
  const { account } = useAuth();
  const chatService = useChatService();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

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

  // Load contacts
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
      const { data: { user } } = await getSupabaseClient().auth.getUser();
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

      const contactsListFormatted: Contact[] = contactsList.map(
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
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.connectId?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleNext = () => {
    if (selectedContactIds.size === 0) return;
    onNext(Array.from(selectedContactIds));
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!shouldRender && !hideContainer) return null;

  const content = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="relative flex items-center justify-center" style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '0px', paddingRight: '0px', minHeight: '60px' }}>
        <button
          onClick={handleClose}
          className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
          style={{
            left: '24px',
            top: '24px',
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
        <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>Add Members</h2>
        <button
          onClick={handleNext}
          disabled={selectedContactIds.size === 0}
          className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            right: '24px',
            top: '24px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: selectedContactIds.size > 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            willChange: 'transform, box-shadow'
          }}
          onMouseEnter={(e) => {
            if (selectedContactIds.size > 0) {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
        >
          <ArrowRight size={18} className="text-gray-900" strokeWidth={2.5} />
        </button>
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
                {searchQuery ? "No contacts found" : "No contacts yet"}
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
  );

  if (hideBackdrop && hideContainer) {
    return content;
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {!hideBackdrop && (
        <div 
          className="absolute inset-0 transition-opacity duration-300 ease-out"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            opacity: isVisible ? 1 : 0
          }}
          onClick={handleClose}
        />
      )}
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
          transform: isVisible 
            ? 'translateY(0)' 
            : 'translateY(100%)',
        }}
      >
        {content}
      </div>
    </div>
  );
}





