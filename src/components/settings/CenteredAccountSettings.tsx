"use client";

import { PageHeader } from "@/components/layout/PageSystem";
import AccountSettings from "@/components/settings/AccountSettings";

interface CenteredAccountSettingsProps {
  onClose: () => void;
  onDeleteAccount: () => void;
}

export default function CenteredAccountSettings({
  onClose,
  onDeleteAccount,
}: CenteredAccountSettingsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimming overlay */}
      <div
        className="fixed inset-0 transition-opacity duration-300 ease-in-out"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
        onClick={onClose}
      />

      {/* Modal card */}
      <div 
        className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative"
        style={{ '--saved-content-padding-top': '104px' } as React.CSSProperties}
      >
        <PageHeader
          title="Account Settings"
          backButton
          backIcon="close"
          onBack={onClose}
        />
        
        <AccountSettings onDeleteAccount={onDeleteAccount} />
        
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
    </div>
  );
}




