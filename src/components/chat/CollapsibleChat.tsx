import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ChatHeader } from "./ChatHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface ChatMessage {
  id: string;
  userName: string;
  message: string;
  timestamp: Date;
  isSender: boolean;
}

interface CollapsibleChatProps {
  adminContact?: boolean;
}

const CollapsibleChat = ({ adminContact = false }: CollapsibleChatProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    loadMessages();
    
    // Subscribe to messages from chat_messages table
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, payload => {
        console.log('New message received:', payload);
        const newMessage = payload.new as any;
        handleNewMessage(newMessage);
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]); 
  
  const loadMessages = async () => {
    try {
      // Query the exact structure of your table, including user_id
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          user_name,
          user_avatar,
          message,
          timestamp
        `)
        .order('timestamp', { ascending: true });
        
      if (error) {
        console.error('Error loading messages:', error);
        toast({
          title: 'Error loading messages',
          description: error.message
        });
        return;
      }
      
      if (data && data.length > 0) {
        console.log('Loaded messages:', data);
        
        const formattedMessages = data.map(msg => {
          // Check if the current user is the sender using user_id
          const isSender = msg.user_id === user?.id;
          
          return {
            id: msg.id,
            userName: msg.user_name || 'Anonymous',
            message: msg.message,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            isSender: isSender
          };
        });
        
        // Sort messages by timestamp
        const sortedMessages = formattedMessages.sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        setMessages(sortedMessages);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error in loadMessages:', error);
      toast({
        title: 'Error loading messages',
        description: error instanceof Error ? error.message : 'Please refresh the page.'
      });
    }
  };
  
  const handleNewMessage = (message: any) => {
    // Check if message already exists in our state
    const messageExists = messages.some(msg => msg.id === message.id);
    if (messageExists) {
      return;
    }

    // Use user_id to determine if the message is from the current user
    const isSender = message.user_id === user?.id;
    
    const newMessage: ChatMessage = {
      id: message.id,
      userName: message.user_name || 'Anonymous',
      message: message.message,
      timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
      isSender: isSender
    };
    
    setMessages(prev => {
      // Add new message and sort by timestamp
      const updatedMessages = [...prev, newMessage].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      return updatedMessages;
    });
    
    setTimeout(scrollToBottom, 100);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isCollapsed) {
      scrollToBottom();
    }
  }, [messages, isCollapsed]);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    try {
      const messageId = uuidv4();
      const userName = profile?.username || 'Anonymous';
      const userAvatar = profile?.avatar_url || null;
      const currentTime = new Date();
      
      // Optimistically add the message to the local state
      const newMessage: ChatMessage = {
        id: messageId,
        userName: userName,
        message: messageInput.trim(),
        timestamp: currentTime,
        isSender: true
      };
      
      setMessages(prev => {
        const updatedMessages = [...prev, newMessage].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        return updatedMessages;
      });
      
      setTimeout(scrollToBottom, 100);

      // Insert into Supabase, including user_id
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          id: messageId,
          user_id: user?.id, // Add user_id
          user_name: userName,
          user_avatar: userAvatar,
          message: messageInput.trim(),
          timestamp: currentTime.toISOString()
        });
        
      if (error) {
        console.error('Error sending message:', error);
        console.error('Error details:', error.details, error.hint, error.code);
        
        // If there's an error, remove the optimistically added message
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        toast({
          title: 'Error sending message',
          description: error.message || 'Please try again.'
        });
        return;
      }
      
      setMessageInput("");
    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast({
        title: 'Error sending message',
        description: 'Please try again.'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    
    messages.forEach(message => {
      const dateStr = formatDate(message.timestamp);
      const existingGroup = groups.find(group => group.date === dateStr);
      
      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({ date: dateStr, messages: [message] });
      }
    });
    
    return groups;
  };
  
  const messageGroups = groupMessagesByDate();

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 md:p-6">
      <Card className={`transition-all duration-200 ease-in-out ${
        isCollapsed 
          ? 'w-14 h-14' 
          : 'w-[350px] md:w-[400px] h-[500px] md:h-[600px]'
      } flex flex-col bg-[#0A0A0B] border-zinc-800`}>
        <ChatHeader 
          isCollapsed={isCollapsed}
          isMobile={false}
          isAdminContact={adminContact}
          onToggleCollapse={handleToggleCollapse}
        />
        
        {!isCollapsed && (
          <>
            <ScrollArea className="flex-grow p-3">
              <div className="space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center text-zinc-500 py-8">
                    No messages yet. Be the first to say hello!
                  </div>
                ) : (
                  messageGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="mb-6">
                      <div className="flex justify-center mb-4">
                        <div className="bg-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-400">
                          {group.date}
                        </div>
                      </div>
                      
                      {group.messages.map((message) => (
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
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={adminContact ? "Send message to admin..." : "Type a message..."}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-zinc-800 border-0 text-white rounded-full"
                />
                <Button 
                  size="icon" 
                  onClick={handleSendMessage} 
                  disabled={!messageInput.trim()}
                  className="bg-blue-500 hover:bg-blue-600 rounded-full h-10 w-10"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default CollapsibleChat;