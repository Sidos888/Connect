"use client";

import { Plus } from "lucide-react";
import { User as ConnectionUser } from "@/lib/connectionsService";
import { PageHeader } from "@/components/layout/PageSystem";
import Connections from "./Connections";

export default function CenteredConnections({
  onBack,
  onAddPerson,
  onFriendClick,
  fromProfile = false,
  showAddPersonButton = true,
  userId,
  showOnlyMutuals = false,
}: {
  onBack: () => void;
  onAddPerson?: () => void;
  onFriendClick?: (friend: ConnectionUser) => void;
  fromProfile?: boolean;
  showAddPersonButton?: boolean;
  userId?: string; // Optional: view another user's connections
  showOnlyMutuals?: boolean; // Only show mutuals tab
}) {
  console.log('🟣 CenteredConnections: Modal rendered', {
    fromProfile,
    showAddPersonButton,
    hasOnFriendClick: !!onFriendClick,
    userId,
    showOnlyMutuals,
    timestamp: new Date().toISOString()
  });

  return (
    <div 
      className="fixed inset-0 lg:relative lg:inset-auto bg-white lg:rounded-3xl w-full lg:max-w-[680px] lg:w-[680px] h-screen lg:h-[620px] overflow-hidden flex flex-col lg:shadow-2xl transform transition-all duration-300 ease-out scale-100"
      style={{ 
        '--saved-content-padding-top': '104px',
        zIndex: 50
      } as React.CSSProperties}
    >
      <PageHeader
        title="Connections"
        backButton
        backIcon={fromProfile ? "arrow" : "close"}
        onBack={onBack}
        actions={showAddPersonButton && onAddPerson ? [
          {
            icon: <Plus size={20} className="text-gray-900" />,
            onClick: onAddPerson,
            label: "Add person"
          }
        ] : []}
      />
      
      <div className="flex-1 px-8 overflow-y-auto scrollbar-hide" style={{
        paddingTop: '140px',
        paddingBottom: '32px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <Connections onFriendClick={onFriendClick} userId={userId} showOnlyMutuals={showOnlyMutuals} />
      </div>

      {/* Bottom Blur */}
      <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
        <div className="absolute bottom-0 left-0 right-0" style={{
          height: '80px',
          background: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0) 100%)'
        }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '20px', backdropFilter: 'blur(0.5px)', WebkitBackdropFilter: 'blur(0.5px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '20px', height: '20px', backdropFilter: 'blur(0.3px)', WebkitBackdropFilter: 'blur(0.3px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '40px', height: '20px', backdropFilter: 'blur(0.15px)', WebkitBackdropFilter: 'blur(0.15px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '60px', height: '20px', backdropFilter: 'blur(0.05px)', WebkitBackdropFilter: 'blur(0.05px)' }} />
      </div>
    </div>
  );
}
