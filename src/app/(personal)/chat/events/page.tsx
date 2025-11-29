"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ListingCard from "@/components/listings/ListingCard";
import type { Listing } from "@/lib/listingsService";

type GroupEvent = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  photo_urls: string[] | null;
};

export default function GroupEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chat");
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "previous">("upcoming");

  useEffect(() => {
    const loadEvents = async () => {
      if (!chatId) {
        setIsLoading(false);
        return;
      }
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          console.error("Supabase client not available when loading group events");
          setEvents([]);
        } else {
          const { data, error } = await supabase
            .from("listings")
            .select("id, title, start_date, end_date, photo_urls")
            .eq("group_chat_id", chatId)
            .order("start_date", { ascending: true });

          if (error) {
            console.error("Error loading group events:", error);
            setEvents([]);
          } else {
            setEvents((data || []) as GroupEvent[]);
          }
        }
      } catch (error) {
        console.error("Error in loadEvents:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [chatId]);

  const { upcomingEvents, previousEvents } = useMemo(() => {
    const now = new Date();
    const upcoming: GroupEvent[] = [];
    const previous: GroupEvent[] = [];

    (events || []).forEach((event) => {
      if (!event.start_date) {
        upcoming.push(event);
        return;
      }
      const date = new Date(event.start_date);
      if (date >= now) {
        upcoming.push(event);
      } else {
        previous.push(event);
      }
    });

    return { upcomingEvents: upcoming, previousEvents: previous };
  }, [events]);

  const activeEvents = tab === "upcoming" ? upcomingEvents : previousEvents;

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Date and time";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleBack = () => {
    router.back();
  };

  // Map simple GroupEvent into full Listing shape for reuse of ListingCard styling
  const mapEventToListing = (event: GroupEvent): Listing => {
    const nowIso = new Date().toISOString();
    return {
      id: event.id,
      host_id: "",
      title: event.title ?? "Event",
      summary: null,
      location: null,
      start_date: event.start_date,
      end_date: event.end_date,
      capacity: null,
      is_public: true,
      photo_urls: event.photo_urls,
      has_gallery: false,
      created_at: event.start_date || nowIso,
      updated_at: event.end_date || event.start_date || nowIso,
    };
  };

  return (
    <div className="lg:hidden" style={{ "--saved-content-padding-top": "180px" } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Group Events"
          backButton
          onBack={handleBack}
        />

        <PageContent>
          <div
            className="px-4 pb-16"
            style={{
              paddingTop: "var(--saved-content-padding-top, 180px)",
            }}
          >
            {/* Pills - match My Life mobile styling */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 -mx-1" style={{ paddingTop: "2px", paddingBottom: "2px" }}>
                  {[
                    { id: "upcoming" as const, label: "Upcoming" },
                    { id: "previous" as const, label: "Previous" },
                  ].map((p) => {
                    const isActive = tab === p.id;
                    return (
                      <div
                        key={p.id}
                        className="flex-shrink-0"
                        style={{
                          paddingLeft: isActive ? "2px" : "0",
                          paddingRight: isActive ? "2px" : "0",
                          paddingTop: isActive ? "2px" : "0",
                          paddingBottom: isActive ? "2px" : "0",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setTab(p.id)}
                          className="inline-flex items-center justify-center rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                          style={{
                            minHeight: isActive ? "44px" : "40px",
                            paddingLeft: isActive ? "18px" : "16px",
                            paddingRight: isActive ? "18px" : "16px",
                            paddingTop: isActive ? "12px" : "10px",
                            paddingBottom: isActive ? "12px" : "10px",
                            borderWidth: "0.4px",
                            borderColor: "#E5E7EB",
                            borderStyle: "solid",
                            boxShadow:
                              "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)",
                            color: isActive ? "#111827" : "#6B7280",
                            willChange: "transform, box-shadow",
                            transform: isActive ? "scale(1.05)" : "scale(1)",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.boxShadow =
                                "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.boxShadow =
                                "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)";
                            }
                          }}
                        >
                          <span
                            className="font-medium leading-none"
                            style={{
                              fontSize: isActive ? "14px" : "13px",
                            }}
                          >
                            {p.label}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="text-center text-gray-500 text-sm py-8">
                Loading events...
              </div>
            ) : activeEvents.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                {tab === "upcoming"
                  ? "No upcoming events for this group"
                  : "No previous events for this group"}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {activeEvents.map((event) => {
                  const listing = mapEventToListing(event);
                  return (
                    <ListingCard
                      key={event.id}
                      listing={listing}
                      size="medium"
                      showDate={true}
                      from={`/chat/events?chat=${chatId ?? ""}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </PageContent>
      </MobilePage>
    </div>
  );
}


