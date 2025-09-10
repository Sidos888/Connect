"use client";

import { Search, Calendar, MessageCircle, Menu, Building } from "lucide-react";
import TabBar from "../TabBar";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";

export default function MobileBottomNavigation() {
  const { context } = useAppStore();
  const { user } = useAuth();
  
  const navigationItems = [
    { href: "/", label: "Explore", icon: <Search size={20} /> },
    { 
      href: user ? "/my-life" : "/", 
      label: context.type === "business" ? "My Business" : "My Life", 
      icon: context.type === "business" ? <Building size={20} /> : <Calendar size={20} />
    },
    { href: user ? "/chat" : "/", label: "Chat", icon: <MessageCircle size={20} /> },
    { href: user ? "/menu" : "/", label: "Menu", icon: <Menu size={20} /> },
  ];

  return <TabBar items={navigationItems} />;
}
