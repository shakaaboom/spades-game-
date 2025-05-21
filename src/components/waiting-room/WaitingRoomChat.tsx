import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/hooks/use-auth";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
}

interface ProfileData {
  username?: string | null;
  avatar_url?: string | null;
}

interface MessageData {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: ProfileData | null;
}

interface WaitingRoomChatProps {
  roomId: string;
}

const WaitingRoomChat = ({ roomId }: WaitingRoomChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    // Load existing messages
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room-${roomId}-chat`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_messages',
        filter: `game_id=eq.${roomId}`
      }, (payload) => {
        handleNewMessage(payload.new as any);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);
  
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('game_messages')
        .select(`
          id,
          user_id,
          message,
          created_at,
          profiles:user_id (username, avatar_url)
        `)
        .eq('game_id', roomId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error loading messages:", error);
        return;
      }
      
      if (data) {
        const formattedMessages = data.map((msg: any) => ({
          id: msg.id,
          userId: msg.user_id,
          userName: msg.profiles?.username || 'Unknown User',
          userAvatar: msg.profiles?.avatar_url || '',
          content: msg.message,
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error in loadMessages:", error);
    }
  };
  
  const handleNewMessage = (message: any) => {
    const isCurrentUser = message.user_id === user?.id;
    
    const newMessage: ChatMessage = {
      id: message.id,
      userId: message.user_id,
      userName: isCurrentUser ? (profile?.username || 'You') : 'Player', // In a real app, get from profiles
      userAvatar: isCurrentUser ? (profile?.avatar_url || '') : '',
      content: message.message,
      timestamp: new Date(message.created_at)
    };
    
    setMessages(prev => [...prev, newMessage]);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user) return;
    
    try {
      const { error } = await supabase
        .from('game_messages')
        .insert({
          id: uuidv4(),
          game_id: roomId,
          user_id: user.id,
          message: messageInput
        });
      
      if (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error sending message",
          description: "Please try again."
        });
        return;
      }
      
      // Clear input
      setMessageInput("");
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-3 md:p-4 border-b">
        <CardTitle className="text-base flex items-center">
          <MessageSquare className="h-4 w-4 mr-2 text-primary" />
          Room Chat
        </CardTitle>
      </CardHeader>
      
      <ScrollArea className="flex-grow p-3 md:p-4">
        <div className="space-y-3 md:space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Be the first to say hello!
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} className="flex items-start gap-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={message.userAvatar} />
                  <AvatarFallback>
                    {message.userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline flex-wrap">
                    <p className={`font-medium text-sm ${message.userId === user?.id ? "text-primary" : ""}`}>
                      {message.userId === user?.id ? "You" : message.userName}
                    </p>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm break-words">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <CardContent className="p-3 md:p-4 border-t mt-auto">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={!user}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage} 
            disabled={!messageInput.trim() || !user}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!user && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Please <Link to="/auth" className="text-primary hover:underline">sign in</Link> to join the conversation
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WaitingRoomChat;
