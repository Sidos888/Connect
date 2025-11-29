"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { getSupabaseClient } from "@/lib/supabaseClient";
import DisableEventChatModal from "@/components/chat/DisableEventChatModal";
import { useChatService } from "@/lib/chatProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ListingMeta {
  id: string;
  title: string;
  event_chat_id: string | null;
  photo_urls: string[] | null;
}

interface EventChatMeta {
  id: string;
  is_archived: boolean | null;
}

export default function EventChatManagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("id");
  const chatService = useChatService();
  const queryClient = useQueryClient();

  const [showDisableModal, setShowDisableModal] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  // Fetch listing details
  const { data: listing, isLoading: loading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      if (!listingId) return null;
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, event_chat_id, photo_urls")
        .eq("id", listingId)
        .single();
      if (error) throw error;
      return data as ListingMeta;
    },
    enabled: !!listingId,
  });

  // Fetch event chat status
  const { data: eventChat } = useQuery({
    queryKey: ['eventChat', listing?.event_chat_id],
    queryFn: async () => {
      if (!listing?.event_chat_id) return null;
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from("chats")
        .select("id, is_archived")
        .eq("id", listing.event_chat_id)
        .single();
      if (error) throw error;
      return data as EventChatMeta;
    },
    enabled: !!listing?.event_chat_id,
  });

  const isEventChatEnabled = !!(listing?.event_chat_id && eventChat && !eventChat.is_archived);

  const handleEnableEventChat = async () => {
    if (!listing || !chatService || isEnabling) return;
    
    setIsEnabling(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase client not available");

      // If chat exists but is archived, just un-archive it
      if (listing.event_chat_id && eventChat?.is_archived) {
        const { error: updateError } = await supabase
          .from("chats")
          .update({ is_archived: false })
          .eq("id", listing.event_chat_id);

        if (updateError) {
          console.error("EventChatManagePage: Error re-enabling event chat", updateError);
          alert("Failed to enable event chat. Please try again.");
          setIsEnabling(false);
          return;
        }
      } else if (!listing.event_chat_id) {
        // Create new event chat
        const coverPhoto = listing.photo_urls && listing.photo_urls.length > 0 
          ? listing.photo_urls[0] 
          : undefined;

        const { chat: newChat, error: chatError } = await chatService.createGroupChat(
          listing.title,
          [],
          coverPhoto
        );

        if (chatError || !newChat) {
          console.error("EventChatManagePage: Error creating event chat", chatError);
          alert("Failed to create event chat. Please try again.");
          setIsEnabling(false);
          return;
        }

        // Mark chat as event chat
        await supabase
          .from("chats")
          .update({ is_event_chat: true, is_archived: false })
          .eq("id", newChat.id);

        // Link listing to this event chat
        await supabase
          .from("listings")
          .update({ event_chat_id: newChat.id })
          .eq("id", listing.id);
      }

      // Refresh queries
      await queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
      await queryClient.invalidateQueries({ queryKey: ['eventChat', listing?.event_chat_id] });
    } catch (error) {
      console.error("EventChatManagePage: Error enabling event chat", error);
      alert("Failed to enable event chat. Please try again.");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisableEventChat = async () => {
    if (!listing?.event_chat_id) return;
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase client not available");

    const { error } = await supabase
      .from("chats")
      .update({ is_archived: true })
      .eq("id", listing.event_chat_id);

    if (error) {
      console.error("EventChatManagePage: Error disabling event chat", error);
      throw error;
    }

    // Refresh queries to show enable view again
    await queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
    await queryClient.invalidateQueries({ queryKey: ['eventChat', listing.event_chat_id] });
  };

  if (!listingId) {
    return (
      <div className="lg:hidden" style={{ "--saved-content-padding-top": "140px" } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Event Chat"
            backButton
            onBack={() => router.push("/my-life")}
          />
          <PageContent>
            <div className="px-4 py-8 text-center text-gray-500">
              <p>No listing ID provided</p>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="lg:hidden" style={{ "--saved-content-padding-top": "140px" } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Event Chat"
            backButton
            onBack={() => router.push(`/listing?id=${listingId}&view=manage`)}
          />
          <PageContent>
            <div className="px-4 py-8 text-center text-gray-500">
              <p>Loading...</p>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="lg:hidden" style={{ "--saved-content-padding-top": "140px" } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Event Chat"
            backButton
            onBack={() => router.push(`/listing?id=${listingId}&view=manage`)}
          />
          <PageContent>
            <div className="px-4 py-8 text-center text-gray-500">
              <p>Listing not found</p>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  return (
    <div className="lg:hidden" style={{ "--saved-content-padding-top": "140px" } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Event Chat"
          backButton
          onBack={() => router.push(`/listing?id=${listing.id}&view=manage`)}
        />

        <PageContent>
          <div
            className="px-4 pb-16 flex flex-col"
            style={{
              paddingTop: "var(--saved-content-padding-top, 140px)",
              minHeight: "calc(100vh - var(--saved-content-padding-top, 140px))",
            }}
          >
            {!isEventChatEnabled ? (
              /* Enable Card with Toggle */
              <div className="bg-white rounded-xl p-4 flex items-center justify-between"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  minHeight: '72px',
                }}
              >
                <span className="text-base font-semibold text-gray-900">Enable</span>
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                    isEventChatEnabled ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={isEventChatEnabled}
                  onClick={handleEnableEventChat}
                  style={{ cursor: isEnabling ? 'not-allowed' : 'pointer' }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEventChatEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Enabled Card (no toggle) */}
                <div className="bg-white rounded-xl p-4 flex items-center justify-center"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    minHeight: '72px',
                  }}
                >
                  <span className="text-base font-semibold text-gray-900">Enabled</span>
                </div>

                {/* Disable Event Chat Button - Positioned at bottom */}
                <div className="mt-auto pt-8">
                  <button
                    type="button"
                    onClick={() => setShowDisableModal(true)}
                    className="w-full bg-white rounded-xl p-4 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      minHeight: '72px',
                      willChange: 'transform, box-shadow',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                  >
                    <span className="text-base font-semibold text-red-600">
                      Disable Event Chat
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </PageContent>
      </MobilePage>

      <DisableEventChatModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        listingTitle={listing?.title || ''}
        onConfirm={handleDisableEventChat}
      />
    </div>
  );
}