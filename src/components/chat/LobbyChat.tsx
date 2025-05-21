import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  userName: string;
  message: string;
  timestamp: Date;
  isSender: boolean;
}

const LobbyChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  useEffect(() => {
    loadMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const newMessage = payload.new as any;
        handleNewMessage(newMessage);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadMessages = async () => {
    try {
      console.log("Loading messages...");
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_name,
          user_avatar,
          message
        `)
        .order('id', { ascending: true });
      
      if (error) {
        console.error("Error loading messages:", error);
        toast({
          title: "Error loading messages",
          description: error.message
        });
        return;
      }
      
      if (data) {
        console.log(`Loaded ${data.length} messages`);
        const userName = profile?.username || 'Anonymous';
        const formattedMessages = data.map((msg: any) => ({
          id: msg.id,
          userName: msg.user_name || 'Anonymous',
          message: msg.message,
          timestamp: new Date(), // Using current time as there's no timestamp
          isSender: msg.user_name === userName
        }));
        
        setMessages(formattedMessages);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("Error in loadMessages:", error);
      toast({
        title: "Error loading messages",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleNewMessage = (message: any) => {
    // Check if message already exists
    if (messages.some(msg => msg.id === message.id)) {
      return;
    }
    
    console.log("New message received:", message);
    const userName = profile?.username || 'Anonymous';
    const newMessage: ChatMessage = {
      id: message.id,
      userName: message.user_name || 'Anonymous',
      message: message.message,
      timestamp: new Date(), // Current time since there's no timestamp
      isSender: message.user_name === userName
    };
    
    setMessages(prev => [...prev, newMessage]);
    setTimeout(scrollToBottom, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Add immediate UI feedback when sending a message
  const addOptimisticMessage = (content: string) => {
    const messageId = uuidv4();
    const userName = profile?.username || 'Anonymous';
    
    const newMessage: ChatMessage = {
      id: messageId,
      userName: userName,
      message: content,
      timestamp: new Date(),
      isSender: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setTimeout(scrollToBottom, 100);
    
    return messageId;
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      // Add message to UI immediately
      const messageId = addOptimisticMessage(messageInput.trim());
      
      console.log("Sending message:", messageInput.trim());
      const userName = profile?.username || 'Anonymous';
      const userAvatar = profile?.avatar_url || null;
      
      // Clear input right away for better UX
      const messageToSend = messageInput.trim();
      setMessageInput("");
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          id: messageId,
          user_name: userName,
          user_avatar: userAvatar,
          message: messageToSend
        })
        .select();
      
      if (error) {
        console.error("Error sending message:", error);
        console.error("Error details:", error.details, error.hint, error.code);
        
        // Remove the optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        toast({
          title: "Error sending message",
          description: error.message || "Please try again."
        });
      } else {
        console.log("Message sent successfully:", data);
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast({
        title: "Error sending message",
        description: "Please try again."
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col border-0 shadow-none bg-[#0A0A0B]">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
          <h3 className="font-medium text-white">Lobby Chat</h3>
        </div>
        <ChevronRight className="h-5 w-5 text-white" />
      </div>
      
      {/* Message Area */}
      <ScrollArea className="flex-grow p-3">
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              No messages yet. Be the first to say hello!
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} className="mb-6">
                {/* For sender messages (You) */}
                {message.isSender ? (
                  <div className="flex flex-col items-end">
                    <div className="text-right mb-1">
                      <div className="text-sm text-zinc-400">You</div>
                    </div>
                    <div className="bg-blue-500 text-white rounded-3xl px-4 py-2 max-w-[85%] break-words">
                      {message.message}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                ) : (
                  /* For receiver messages */
                  <div className="flex flex-col items-start">
                    <div className="mb-1">
                      <div className="text-sm text-zinc-400">{message.userName}</div>
                    </div>
                    <div className="bg-zinc-800 text-white rounded-3xl px-4 py-2 max-w-[85%] break-words">
                      {message.message}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Input Area */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-zinc-800 border-zinc-700 border text-white rounded-full"
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage} 
            disabled={!messageInput.trim() || isSending} 
            className="bg-blue-500 hover:bg-blue-600 rounded-full h-10 w-10"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LobbyChat;