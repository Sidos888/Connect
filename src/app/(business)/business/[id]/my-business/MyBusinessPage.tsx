"use client";

import ProfileStrip from "@/components/my-life/ProfileStrip";
import QuickActions from "@/components/my-life/QuickActions";
import Section from "@/components/my-life/Section";
import Carousel from "@/components/my-life/Carousel";
import MiniEventCard from "@/components/my-life/MiniEventCard";
import HubCard from "@/components/business/HubCard";
import { useCurrentBusiness } from "@/lib/store";

export default function MyBusinessPage() {
  const biz = useCurrentBusiness();

  const hubs = [
    {
      href: "#",
      title: "City Lights",
      subline: "CBD • 10–5 Mon–Sat",
      status: "Open",
      subListingImages: ["/api/placeholder/1", "/api/placeholder/2", "/api/placeholder/3", "/api/placeholder/4"],
    },
    {
      href: "#",
      title: "Night Visions",
      subline: "CBD • 10–5 Mon–Sat",
      status: "Open",
      subListingImages: ["/api/placeholder/5", "/api/placeholder/6"],
    },
    {
      href: "#",
      title: "Offline Club",
      subline: "10 events",
      subListingImages: ["/api/placeholder/7", "/api/placeholder/8", "/api/placeholder/9"],
    },
  ];
  const places = [
    { title: "Studio A", dateTime: "2 for rent, 1 closed" },
    { title: "Backyard", dateTime: "1 for rent" },
  ];
  const services = [
    { title: "Catering", dateTime: "Active" },
    { title: "Photography", dateTime: "Inactive" },
  ];
  const rentals = [
    { title: "Projector", dateTime: "1 booked today" },
  ];
  const events = [
    { title: "Summer Fest", dateTime: "5 events • 2 this week" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">My Business</h1>
      
      <ProfileStrip
        name={biz?.name ?? "Business"}
        avatarUrl={biz?.logoUrl}
      />

      <QuickActions />

      <Section title="Hubs">
        <Carousel>
          {hubs.map((hub, idx) => (
            <HubCard key={idx} {...hub} />
          ))}
        </Carousel>
      </Section>

      <Section title="Places">
        <div className="space-y-3">
          {places.map((place, idx) => (
            <MiniEventCard key={idx} {...place} />
          ))}
        </div>
      </Section>

      <Section title="Services">
        <div className="space-y-3">
          {services.map((service, idx) => (
            <MiniEventCard key={idx} {...service} />
          ))}
        </div>
      </Section>

      <Section title="Rentals">
        <div className="space-y-3">
          {rentals.map((rental, idx) => (
            <MiniEventCard key={idx} {...rental} />
          ))}
        </div>
      </Section>

      <Section title="Events">
        <div className="space-y-3">
          {events.map((event, idx) => (
            <MiniEventCard key={idx} {...event} />
          ))}
        </div>
      </Section>
    </div>
  );
}
