"use client";

import { Search, Building } from "lucide-react";
import { MenuIconCustom } from "@/components/icons/MenuIconCustom";
import { MyLifeIconCustom } from "@/components/icons/MyLifeIconCustom";
import { ChatIconCustom } from "@/components/icons/ChatIconCustom";
import TabBar from "../TabBar";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { useUnreadChatsCount } from "@/lib/chatQueries";
import { useUnreadNotificationsCount } from "@/lib/notificationsQueries";

export default function MobileBottomNavigation() {
  const { context } = useAppStore();
  const { user } = useAuth();
  const chatService = useChatService();
  
  // Get unread counts for badges
  const { data: unreadChatsCount = 0 } = useUnreadChatsCount(chatService, user?.id || null);
  const { data: unreadNotificationsCount = 0 } = useUnreadNotificationsCount(user?.id || null);
  
  const navigationItems = [
    { href: "/explore", label: "Explore", icon: Search },
    { 
      href: user ? "/my-life" : "/my-life", 
      label: context.type === "business" ? "My Business" : "My Life", 
      icon: context.type === "business" ? Building : MyLifeIconCustom
    },
    { 
      href: user ? "/chat" : "/chat", 
      label: "Chats", 
      icon: ChatIconCustom,
      badgeCount: unreadChatsCount > 0 ? unreadChatsCount : undefined,
      badgeType: 'number' as const
    },
    { 
      href: user ? "/menu" : "/menu", 
      label: "Menu", 
      icon: MenuIconCustom,
      badgeCount: unreadNotificationsCount > 0 ? 1 : undefined, // Show dot (count=1) if there are unread notifications
      badgeType: 'dot' as const
    },
  ];

  return <TabBar items={navigationItems} />;
}
