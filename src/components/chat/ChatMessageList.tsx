import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@/types/chat";

interface ChatMessageListProps {
  messages: {
    id: string;
    user: User;
    message: string;
    timestamp: Date;
    isAdminMessage?: boolean;
  }[];
  formatTime: (date: Date) => string;
}

export const ChatMessageList = ({ messages, formatTime }: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser, profile } = useAuth();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  return (
    <ScrollArea className="flex-1 p-3">
      <div className="space-y-3">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            {...message}
            profile={profile}
            currentUser={currentUser ? {
              id: currentUser.id,
              name: profile?.username || 'You',
              avatar: profile?.avatar_url || undefined
            } : null}
            formatTime={formatTime}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
