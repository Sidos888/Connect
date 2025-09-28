import { getSupabaseClient } from '../supabaseClient';
import { simpleChatService } from '../simpleChatService';

export interface Contact {
  id: string;
  name: string;
  profile_pic?: string;
  connect_id?: string;
  type: 'person' | 'business';
  is_blocked?: boolean;
}

export interface SelectedContact extends Contact {
  isSelected: boolean;
}

export interface GroupSetupData {
  name: string;
  photo?: string;
}

export type NewMessageFlowState = 
  | 'idle'
  | 'selecting_contacts'
  | 'group_setup'
  | 'creating_dm'
  | 'creating_group'
  | 'completed';

export interface NewMessageFlowContext {
  state: NewMessageFlowState;
  contacts: Contact[];
  selectedContacts: SelectedContact[];
  searchQuery: string;
  groupSetupData: GroupSetupData;
  isLoading: boolean;
  error: string | null;
}

export class NewMessageFlow {
  private context: NewMessageFlowContext;
  private listeners: Array<(context: NewMessageFlowContext) => void> = [];

  constructor() {
    this.context = {
      state: 'idle',
      contacts: [],
      selectedContacts: [],
      searchQuery: '',
      groupSetupData: { name: '' },
      isLoading: false,
      error: null,
    };
  }

  subscribe(listener: (context: NewMessageFlowContext) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.context));
  }

  private updateContext(updates: Partial<NewMessageFlowContext>) {
    this.context = { ...this.context, ...updates };
    this.notify();
  }

  async startFlow() {
    this.updateContext({ 
      state: 'selecting_contacts',
      isLoading: true,
      error: null 
    });

    try {
      const contacts = await this.loadContacts();
      this.updateContext({ 
        contacts,
        isLoading: false 
      });
    } catch (error) {
      this.updateContext({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load contacts'
      });
    }
  }

  private async loadContacts(): Promise<Contact[]> {
    console.log('NewMessageFlow: loadContacts called');
    
    // Get current user ID
    const { data: { user } } = await getSupabaseClient().auth.getUser();
    console.log('NewMessageFlow: User from auth:', user?.id);
    
    if (!user) {
      console.log('NewMessageFlow: No user found');
      throw new Error('User not authenticated');
    }
    
    // Use real chat service
    console.log('NewMessageFlow: Calling simpleChatService.getContacts with userId:', user.id);
    const { contacts, error } = await simpleChatService.getContacts(user.id);
    
    console.log('NewMessageFlow: ChatService response:', { contacts, error });
    
    if (error) {
      console.log('NewMessageFlow: Error from simpleChatService:', error);
      throw new Error('Failed to load contacts');
    }
    
    // Convert real contacts to the expected format
    const formattedContacts = contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      profilePic: contact.profile_pic,
      type: 'person' as const
    }));
    
    console.log('NewMessageFlow: Formatted contacts:', formattedContacts);
    return formattedContacts;
  }

  updateSearchQuery(query: string) {
    this.updateContext({ searchQuery: query });
  }

  toggleContactSelection(contactId: string) {
    const contact = this.context.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const existingSelection = this.context.selectedContacts.find(c => c.id === contactId);
    
    if (existingSelection) {
      // Remove from selection
      this.updateContext({
        selectedContacts: this.context.selectedContacts.filter(c => c.id !== contactId)
      });
    } else {
      // Add to selection (max 32 for groups)
      if (this.context.selectedContacts.length >= 32) {
        this.updateContext({ error: 'Maximum 32 participants allowed' });
        return;
      }

      this.updateContext({
        selectedContacts: [
          ...this.context.selectedContacts,
          { ...contact, isSelected: true }
        ],
        error: null
      });
    }
  }

  getFilteredContacts(): Contact[] {
    const { contacts, searchQuery } = this.context;
    
    if (!searchQuery.trim()) {
      return contacts;
    }

    const query = searchQuery.toLowerCase();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.connect_id?.toLowerCase().includes(query)
    );
  }

  getGroupedContacts(): { friends: Contact[]; businesses: Contact[] } {
    const filtered = this.getFilteredContacts();
    
    return {
      friends: filtered.filter(c => c.type === 'person'),
      businesses: filtered.filter(c => c.type === 'business')
    };
  }

  canProceed(): boolean {
    return this.context.selectedContacts.length > 0;
  }

  getPrimaryButtonText(): string {
    const count = this.context.selectedContacts.length;
    if (count === 0) return 'Select contacts';
    if (count === 1) return 'Start DM';
    return 'Continue';
  }

  async proceedToNextStep() {
    const { selectedContacts } = this.context;
    
    if (selectedContacts.length === 0) {
      this.updateContext({ error: 'Please select at least one contact' });
      return;
    }

    if (selectedContacts.length === 1) {
      // Direct message - create or go to existing DM
      await this.createDirectMessage();
    } else {
      // Group message - check if group exists first
      await this.handleGroupSelection();
    }
  }

  private async handleGroupSelection() {
    const { selectedContacts } = this.context;
    
    this.updateContext({ 
      state: 'checking_group',
      isLoading: true,
      error: null 
    });

    try {
      // Check if a group with these exact participants already exists
      const existingGroup = await this.findExistingGroup(selectedContacts);
      
      if (existingGroup) {
        // Group exists - go directly to it
        this.updateContext({
          state: 'completed',
          isLoading: false,
          result: { chat: existingGroup, isExisting: true }
        });
      } else {
        // Group doesn't exist - go to group setup
        this.updateContext({ 
          state: 'group_setup',
          isLoading: false,
          error: null 
        });
      }
    } catch (error) {
      this.updateContext({
        state: 'idle',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check for existing group'
      });
    }
  }

  private async findExistingGroup(participants: Contact[]): Promise<any> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const participantIds = [user.id, ...participants.map(p => p.id)].sort();
    
    // Find groups where the current user is a participant
    const { data: userGroups, error } = await supabase
      .from('chats')
      .select(`
        id, type, name, created_at,
        chat_participants!inner(
          user_id
        )
      `)
      .eq('type', 'group')
      .eq('chat_participants.user_id', user.id);

    if (error) throw error;

    // Check each group to see if it has the exact same participants
    for (const group of userGroups || []) {
      const { data: groupParticipants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', group.id);

      if (participantsError) continue;

      const groupParticipantIds = groupParticipants?.map(p => p.user_id).sort() || [];
      
      // Check if the participant lists match exactly
      if (JSON.stringify(participantIds) === JSON.stringify(groupParticipantIds)) {
        return group;
      }
    }

    return null;
  }

  proceedToGroupSetup() {
    this.updateContext({ 
      state: 'group_setup',
      error: null 
    });
  }

  updateGroupSetupData(data: Partial<GroupSetupData>) {
    this.updateContext({
      groupSetupData: { ...this.context.groupSetupData, ...data }
    });
  }

  async createGroup() {
    const { selectedContacts, groupSetupData } = this.context;
    
    if (!groupSetupData.name.trim()) {
      this.updateContext({ error: 'Group name is required' });
      return;
    }

    this.updateContext({ 
      state: 'creating_group',
      isLoading: true,
      error: null 
    });

    try {
      // Check if identical group already exists
      const existingGroup = await this.checkForExistingGroup(selectedContacts);
      
      if (existingGroup) {
        // TODO: Show dialog to choose between existing group or create new
        // For now, just use the existing group
        this.updateContext({
          state: 'completed',
          isLoading: false
        });
        return existingGroup;
      }

      // Create new group
      const groupChat = await simpleChatService.createGroupChat(
        groupSetupData.name,
        selectedContacts.map(c => c.id),
        groupSetupData.photo
      );

      this.updateContext({
        state: 'completed',
        isLoading: false
      });

      return groupChat;
    } catch (error) {
      this.updateContext({
        state: 'group_setup',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create group'
      });
    }
  }

  private async createDirectMessage() {
    const { selectedContacts } = this.context;
    const contact = selectedContacts[0];

    this.updateContext({ 
      state: 'creating_dm',
      isLoading: true,
      error: null 
    });

    try {
      // Get current user ID
      const { data: { user } } = await getSupabaseClient().auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Use the current session user ID (exists in REST API accounts table)
      const correctUserId = user.id; // 4f04235f-d166-48d9-ae07-a97a6421a328
      
          const { chat, error } = await simpleChatService.createDirectChat(contact.id, correctUserId);

      if (error) {
        throw error;
      }

      this.updateContext({
        state: 'completed',
        isLoading: false
      });

      return chat;
    } catch (error) {
      this.updateContext({
        state: 'selecting_contacts',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create direct message'
      });
    }
  }

  private async checkForExistingGroup(selectedContacts: SelectedContact[]): Promise<any> {
    // TODO: Implement logic to check if a group with the same participants already exists
    // This would involve querying the database for groups with the exact same participant set
    return null;
  }

  reset() {
    this.updateContext({
      state: 'idle',
      contacts: [],
      selectedContacts: [],
      searchQuery: '',
      groupSetupData: { name: '' },
      isLoading: false,
      error: null
    });
  }

  getContext(): NewMessageFlowContext {
    return this.context;
  }
}

// Singleton instance
export const newMessageFlow = new NewMessageFlow();
