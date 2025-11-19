"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import PersonalChatPanel from "../PersonalChatPanel";
import MobileTitle from "@/components/MobileTitle";
import { ArrowLeft } from "lucide-react";

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const { id } = params;
  const router = useRouter();
  const { account } = useAuth();
  const chatService = useChatService();
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConversation = async () => {
      if (!account?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get all chats to find the one with this ID
        if (!chatService) {
          console.error('ChatDisabledPage: ChatService not available');
          return;
        }
        const { chats, error: chatsError } = await chatService.getUserChats();
        
        if (chatsError) {
          setError('Failed to load conversation');
          return;
        }

        console.log('Looking for chat ID:', id);
        console.log('Available chats:', chats.map(c => ({ id: c.id, title: c.title })));
        
        const foundChat = chats.find(chat => chat.id === id);
        
        if (!foundChat) {
          setError('Conversation not found');
          return;
        }

        // Convert fake chat to conversation format
        const conversationData = {
          id: foundChat.id,
          title: foundChat.title,
          avatarUrl: foundChat.avatarUrl,
          lastMessage: foundChat.lastMessage,
          lastMessageTime: foundChat.lastMessageTime,
          unreadCount: foundChat.unreadCount,
          isGroup: foundChat.isGroup
        };

        setConversation(conversationData);
      } catch (error) {
        console.error('Error loading conversation:', error);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [id, account?.id]);

  const handleBack = () => {
    router.push('/chat');
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <MobileTitle
            title="Chat"
            action={
              <button
                onClick={handleBack}
                className="p-0 bg-transparent"
              >
                <span className="action-btn-circle">
                  <ArrowLeft className="w-5 h-5 text-gray-900" />
                </span>
              </button>
            }
          />
        </div>

        {/* Loading State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-500">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="h-screen bg-white flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <MobileTitle
            title="Chat"
            action={
              <button
                onClick={handleBack}
                className="p-0 bg-transparent"
              >
                <span className="action-btn-circle">
                  <ArrowLeft className="w-5 h-5 text-gray-900" />
                </span>
              </button>
            }
          />
        </div>

        {/* Error State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl">💬</div>
            <h2 className="text-xl font-semibold text-gray-900">Conversation not found</h2>
            <p className="text-gray-500">The chat you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Chats
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileTitle
          title={conversation.title}
          action={
            <button
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          }
        />
      </div>

      {/* Chat Panel */}
      <div className="flex-1 overflow-hidden">
        <PersonalChatPanel conversation={conversation} />
      </div>
    </div>
  );
}