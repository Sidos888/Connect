"use client";

import { Search, Calendar, MessageCircle, Menu, Building } from "lucide-react";
import TabBar from "../TabBar";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";

export default function MobileBottomNavigation() {
  const { context } = useAppStore();
  const { user } = useAuth();
  
  const navigationItems = [
    { href: "/explore", label: "Explore", icon: <Search size={22} strokeWidth={2} /> },
    { 
      href: user ? "/my-life" : "/my-life", 
      label: context.type === "business" ? "My Business" : "My Life", 
      icon: context.type === "business" ? <Building size={22} strokeWidth={2} /> : <Calendar size={22} strokeWidth={2} />
    },
    { href: user ? "/chat" : "/chat", label: "Chat", icon: <MessageCircle size={22} strokeWidth={2} /> },
    { href: user ? "/menu" : "/menu", label: "Menu", icon: <Menu size={22} strokeWidth={2} /> },
  ];

  return <TabBar items={navigationItems} />;
}
