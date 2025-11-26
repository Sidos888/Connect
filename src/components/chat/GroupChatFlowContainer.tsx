"use client";

import { useState, useEffect } from 'react';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import NewChatSlideModal from './NewChatSlideModal';
import AddMembersSlideModal from './AddMembersSlideModal';
import NewGroupChatSlideModal from './NewGroupChatSlideModal';

interface GroupChatFlowContainerProps {
  currentStep: 'new-chat' | 'add-members' | 'new-group-chat';
  selectedMemberIds: string[];
  onClose: () => void;
  onSelectContact: (contactId: string) => void;
  onStepChange: (step: 'new-chat' | 'add-members' | 'new-group-chat') => void;
  onSelectedMembersChange: (ids: string[]) => void;
}

export default function GroupChatFlowContainer({
  currentStep,
  selectedMemberIds,
  onClose,
  onSelectContact,
  onStepChange,
  onSelectedMembersChange,
}: GroupChatFlowContainerProps) {
  const [cornerRadius, setCornerRadius] = useState<number>(45);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  // Detect device corner radius on mount
  useEffect(() => {
    getDeviceCornerRadius().then(radius => {
      setCornerRadius(radius);
    });
  }, []);

  // Calculate transform for each step
  const getStepTransform = (step: 'new-chat' | 'add-members' | 'new-group-chat') => {
    if (!isVisible) {
      if (step === 'new-chat') return 'translateX(0)';
      if (step === 'add-members') return 'translateX(100%)';
      return 'translateX(200%)';
    }

    const stepOrder: Array<'new-chat' | 'add-members' | 'new-group-chat'> = ['new-chat', 'add-members', 'new-group-chat'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    const offset = (stepIndex - currentIndex) * 100;
    return `translateX(${offset}%)`;
  };

  const handleShowAddMembers = () => {
    onStepChange('add-members');
  };

  const handleAddMembersNext = (selectedIds: string[]) => {
    onSelectedMembersChange(selectedIds);
    onStepChange('new-group-chat');
  };

  const handleAddMembersBack = () => {
    onStepChange('new-chat');
  };

  const handleNewGroupChatBack = () => {
    onStepChange('add-members');
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: 1
        }}
        onClick={onClose}
      />
      
      {/* Horizontal Container */}
      <div 
        className="relative overflow-hidden"
        style={{
          width: '100%',
          height: '92vh',
          height: '92dvh',
          marginTop: '20px',
          marginBottom: '0px',
        }}
      >
        {/* New Chat View */}
        <div
          className="absolute inset-y-0 left-0 bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
          style={{
            width: '100%',
            borderTopLeftRadius: `${cornerRadius}px`,
            borderTopRightRadius: `${cornerRadius}px`,
            borderBottomLeftRadius: `${cornerRadius}px`,
            borderBottomRightRadius: `${cornerRadius}px`,
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            transform: getStepTransform('new-chat'),
          }}
        >
          <NewChatSlideModal
            isOpen={currentStep === 'new-chat'}
            onClose={onClose}
            onSelectContact={onSelectContact}
            onShowAddMembers={handleShowAddMembers}
            hideBackdrop={true}
            hideContainer={true}
          />
        </div>

        {/* Add Members View */}
        <div
          className="absolute inset-y-0 left-0 bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
          style={{
            width: '100%',
            borderTopLeftRadius: `${cornerRadius}px`,
            borderTopRightRadius: `${cornerRadius}px`,
            borderBottomLeftRadius: `${cornerRadius}px`,
            borderBottomRightRadius: `${cornerRadius}px`,
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            transform: getStepTransform('add-members'),
          }}
        >
          <AddMembersSlideModal
            isOpen={currentStep === 'add-members'}
            onClose={handleAddMembersBack}
            onNext={handleAddMembersNext}
            hideBackdrop={true}
            hideContainer={true}
          />
        </div>

        {/* New Group Chat View */}
        <div
          className="absolute inset-y-0 left-0 bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
          style={{
            width: '100%',
            borderTopLeftRadius: `${cornerRadius}px`,
            borderTopRightRadius: `${cornerRadius}px`,
            borderBottomLeftRadius: `${cornerRadius}px`,
            borderBottomRightRadius: `${cornerRadius}px`,
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            transform: getStepTransform('new-group-chat'),
          }}
        >
          <NewGroupChatSlideModal
            isOpen={currentStep === 'new-group-chat'}
            onClose={handleNewGroupChatBack}
            selectedContactIds={selectedMemberIds}
            hideBackdrop={true}
            hideContainer={true}
          />
        </div>
      </div>
    </div>
  );
}

