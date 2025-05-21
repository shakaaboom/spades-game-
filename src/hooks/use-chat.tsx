import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface ChatMessageType {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  message: string;
  timestamp: Date;
  isAdminMessage: boolean;
  recipientId?: string;
}

interface UseChatProps {
  messages: ChatMessageType[];
  isAdminContact: boolean;
  formatTime: (date: Date) => string;
  loading: boolean;
  sendMessage: (message: string, recipientId?: string) => void;
  startAdminContact: () => void;
  resetChat: () => void;
}

export const useChat = (recipientId?: string): UseChatProps => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isAdminContact, setIsAdminContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Format time helper
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Ensure user is always defined
  const currentUser = {
    id: user?.id || 'anonymous',
    name: user?.email?.split('@')[0] || 'Guest',
    avatar: '',
  };

  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        let query = supabase
          .from('chat_messages')
          .select('*')
          .gte('timestamp', oneHourAgo.toISOString())
          .order('timestamp', { ascending: true });

        // If recipientId is provided, filter for direct messages between current user and recipient
        if (recipientId && user) {
          query = query.or(`and(user_id.eq.${user.id},recipient_id.eq.${recipientId}),and(user_id.eq.${recipientId},recipient_id.eq.${user.id})`);
        } else {
          // For lobby chat, only show messages without recipient_id
          query = query.is('recipient_id', null);
        }

        const { data, error } = await query.limit(100);

        if (error) {
          console.error('Error fetching messages:', error);
          toast.error('Could not load chat messages');
          return;
        }

        if (data && mounted) {
          setMessages(data.map(msg => ({
            id: msg.id,
            user: {
              id: msg.user_id,
              name: msg.user_name || 'Unknown',
              avatar: msg.user_avatar || '',
            },
            message: msg.message,
            timestamp: new Date(msg.timestamp),
            isAdminMessage: msg.is_admin_message || false,
            recipientId: msg.recipient_id,
          })));
        }
      } catch (err) {
        console.error('Unexpected error loading messages:', err);
        toast.error('Something went wrong loading the chat');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel('direct-messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: recipientId 
            ? `or(and(user_id.eq.${user?.id},recipient_id.eq.${recipientId}),and(user_id.eq.${recipientId},recipient_id.eq.${user?.id}))`
            : 'recipient_id.is.null'
        },
        (payload) => {
          if (!payload.new) return;

          const newMsg = {
            id: payload.new.id,
            user: {
              id: payload.new.user_id,
              name: payload.new.user_name || 'Unknown',
              avatar: payload.new.user_avatar || '',
            },
            message: payload.new.message,
            timestamp: new Date(payload.new.timestamp),
            isAdminMessage: payload.new.is_admin_message || false,
            recipientId: payload.new.recipient_id,
          };

          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, recipientId]);

  const sendMessage = async (message: string, toRecipientId?: string) => {
    if (!message.trim() || !user) return;

    const messageId = uuidv4();
    const timestamp = new Date();

    const newMessage: ChatMessageType = {
      id: messageId,
      user: currentUser,
      message,
      timestamp,
      isAdminMessage: isAdminContact,
      recipientId: toRecipientId || recipientId,
    };

    // Optimistically add to UI
    setMessages(prev => [...prev, newMessage]);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          id: messageId,
          user_id: user.id,
          user_name: currentUser.name,
          user_avatar: currentUser.avatar,
          message,
          timestamp: timestamp.toISOString(),
          is_admin_message: isAdminContact,
          recipient_id: toRecipientId || recipientId,
        });

      if (error) {
        console.error('Error saving message:', error);
        toast.error('Failed to send message');
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (err) {
      console.error('Unexpected error sending message:', err);
      toast.error('Something went wrong');
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }
  };

  return {
    messages,
    isAdminContact,
    formatTime,
    loading,
    sendMessage,
    startAdminContact: () => setIsAdminContact(true),
    resetChat: () => setMessages([]),
  };
};
