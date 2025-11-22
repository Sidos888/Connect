"use client";

import { Search, Building } from "lucide-react";
import { MenuIconCustom } from "@/components/icons/MenuIconCustom";
import { MyLifeIconCustom } from "@/components/icons/MyLifeIconCustom";
import { ChatIconCustom } from "@/components/icons/ChatIconCustom";
import TabBar from "../TabBar";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";

export default function MobileBottomNavigation() {
  const { context } = useAppStore();
  const { user } = useAuth();
  
  const navigationItems = [
    { href: "/explore", label: "Explore", icon: Search },
    { 
      href: user ? "/my-life" : "/my-life", 
      label: context.type === "business" ? "My Business" : "My Life", 
      icon: context.type === "business" ? Building : MyLifeIconCustom
    },
    { href: user ? "/chat" : "/chat", label: "Chats", icon: ChatIconCustom },
    { href: user ? "/menu" : "/menu", label: "Menu", icon: MenuIconCustom },
  ];

  return <TabBar items={navigationItems} />;
}
