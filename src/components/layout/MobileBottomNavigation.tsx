"use client";

import { Search, Calendar, MessageCircle, Menu, Building } from "lucide-react";
import TabBar from "../TabBar";
import { useAppStore } from "@/lib/store";

export default function MobileBottomNavigation() {
  const { context } = useAppStore();
  
  const navigationItems = [
    { href: "/", label: "Explore", icon: <Search size={20} /> },
    { 
      href: "/my-life", 
      label: context.type === "business" ? "My Business" : "My Life", 
      icon: context.type === "business" ? <Building size={20} /> : <Calendar size={20} />
    },
    { href: "/chat", label: "Chat", icon: <MessageCircle size={20} /> },
    { href: "/menu", label: "Menu", icon: <Menu size={20} /> },
  ];

  return <TabBar items={navigationItems} />;
}
