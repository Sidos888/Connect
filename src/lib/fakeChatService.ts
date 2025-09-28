// Fake Chat Service for UI Testing
// This provides mock data to test the chat UI without requiring database setup

export interface FakeContact {
  id: string;
  name: string;
  profile_pic?: string;
  is_blocked?: boolean;
}

export interface FakeChat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatarUrl?: string;
  title: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isGroup: boolean;
  participants: FakeContact[];
  messages: Array<{ text: string; createdAt: string }>;
}

export interface FakeMessage {
  id: string;
  sender_id: string;
  message_text: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
}

class FakeChatService {
  private fakeContacts: FakeContact[] = [
    {
      id: 'contact-1',
      name: 'Chandan Saddi',
      profile_pic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 'contact-2', 
      name: 'Frizzy Valiyff',
      profile_pic: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 'contact-3',
      name: 'Alex Johnson',
      profile_pic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 'contact-4',
      name: 'Sarah Wilson',
      profile_pic: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    }
  ];

  private fakeChats: FakeChat[] = [
    {
      id: 'chat-1',
      type: 'direct',
      title: 'Chandan Saddi',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'Hey! How are you doing?',
      lastMessageTime: '2 min ago',
      unreadCount: 2,
      isGroup: false,
      participants: [this.fakeContacts[0]],
      messages: [
        { text: 'Hey! How are you doing?', createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
        { text: 'I\'m doing great! Thanks for asking.', createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString() }
      ]
    },
    {
      id: 'chat-2',
      type: 'direct', 
      title: 'Frizzy Valiyff',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'Thanks for the help yesterday!',
      lastMessageTime: '1 hour ago',
      unreadCount: 0,
      isGroup: false,
      participants: [this.fakeContacts[1]],
      messages: [
        { text: 'Hi Frizzy!', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { text: 'Thanks for the help yesterday!', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }
      ]
    },
    {
      id: 'chat-3',
      type: 'group',
      name: 'Team Project',
      title: 'Team Project',
      avatarUrl: undefined,
      lastMessage: 'Alex: The meeting is at 3pm',
      lastMessageTime: '3 hours ago',
      unreadCount: 5,
      isGroup: true,
      participants: [this.fakeContacts[0], this.fakeContacts[1], this.fakeContacts[2]],
      messages: [
        { text: 'The meeting is at 3pm', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
        { text: 'Got it, thanks!', createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() }
      ]
    }
  ];

  private fakeMessages: { [chatId: string]: FakeMessage[] } = {
    'chat-1': [
      {
        id: 'msg-1',
        sender_id: 'contact-1',
        message_text: 'Hey! How are you doing?',
        message_type: 'text',
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-2', 
        sender_id: 'current-user',
        message_text: 'I\'m doing great! Thanks for asking.',
        message_type: 'text',
        created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-3',
        sender_id: 'contact-1',
        message_text: 'That\'s awesome! Want to grab coffee sometime?',
        message_type: 'text',
        created_at: new Date(Date.now() - 30 * 1000).toISOString()
      }
    ],
    'chat-2': [
      {
        id: 'msg-4',
        sender_id: 'contact-2',
        message_text: 'Thanks for the help yesterday!',
        message_type: 'text',
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-5',
        sender_id: 'current-user',
        message_text: 'No problem! Happy to help anytime.',
        message_type: 'text',
        created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString()
      }
    ],
    'chat-3': [
      {
        id: 'msg-6',
        sender_id: 'contact-2',
        message_text: 'The meeting is at 3pm',
        message_type: 'text',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-7',
        sender_id: 'contact-0',
        message_text: 'Got it, thanks!',
        message_type: 'text',
        created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
      }
    ]
  };

  async getContacts(): Promise<{ contacts: FakeContact[]; error: Error | null }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { contacts: this.fakeContacts, error: null };
  }

  async getUserChats(userId: string): Promise<{ chats: FakeChat[]; error: Error | null }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return { chats: this.fakeChats, error: null };
  }

  async getChatMessages(chatId: string, userId: string): Promise<{ messages: FakeMessage[]; error: Error | null }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    const messages = this.fakeMessages[chatId] || [];
    return { messages, error: null };
  }

  async createDirectChat(otherUserId: string): Promise<{ chat: FakeChat | null; error: Error | null }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const contact = this.fakeContacts.find(c => c.id === otherUserId);
    if (!contact) {
      return { chat: null, error: new Error('Contact not found') };
    }

    // Check if chat already exists
    const existingChat = this.fakeChats.find(chat => 
      chat.type === 'direct' && 
      chat.participants.some(p => p.id === otherUserId)
    );

    if (existingChat) {
      return { chat: existingChat, error: null };
    }

    // Create new chat
    const newChat: FakeChat = {
      id: `chat-${Date.now()}`,
      type: 'direct',
      title: contact.name,
      avatarUrl: contact.profile_pic,
      lastMessage: 'Chat started',
      lastMessageTime: 'now',
      unreadCount: 0,
      isGroup: false,
      participants: [contact],
      messages: []
    };

    this.fakeChats.unshift(newChat);
    this.fakeMessages[newChat.id] = [];

    console.log('Created new chat:', newChat);
    console.log('All chats now:', this.fakeChats.map(c => ({ id: c.id, title: c.title })));

    return { chat: newChat, error: null };
  }

  async createGroupChat(name: string, participantIds: string[]): Promise<{ chat: FakeChat | null; error: Error | null }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const participants = this.fakeContacts.filter(c => participantIds.includes(c.id));
    if (participants.length === 0) {
      return { chat: null, error: new Error('No valid participants') };
    }

    const newChat: FakeChat = {
      id: `chat-${Date.now()}`,
      type: 'group',
      name: name,
      title: name,
      avatarUrl: undefined,
      lastMessage: 'Group created',
      lastMessageTime: 'now',
      unreadCount: 0,
      isGroup: true,
      participants: participants,
      messages: []
    };

    this.fakeChats.unshift(newChat);
    this.fakeMessages[newChat.id] = [];

    return { chat: newChat, error: null };
  }

  async sendMessage(chatId: string, messageText: string, senderId: string): Promise<{ message: FakeMessage | null; error: Error | null }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newMessage: FakeMessage = {
      id: `msg-${Date.now()}`,
      sender_id: senderId,
      message_text: messageText,
      message_type: 'text',
      created_at: new Date().toISOString()
    };

    if (!this.fakeMessages[chatId]) {
      this.fakeMessages[chatId] = [];
    }
    
    this.fakeMessages[chatId].push(newMessage);

    // Update chat's last message
    const chat = this.fakeChats.find(c => c.id === chatId);
    if (chat) {
      chat.lastMessage = messageText;
      chat.lastMessageTime = 'now';
    }

    return { message: newMessage, error: null };
  }

  convertChatToConversation(chat: FakeChat, userId: string) {
    return {
      id: chat.id,
      title: chat.title,
      avatarUrl: chat.avatarUrl,
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageTime,
      unreadCount: chat.unreadCount,
      isGroup: chat.isGroup
    };
  }
}

export const fakeChatService = new FakeChatService();
