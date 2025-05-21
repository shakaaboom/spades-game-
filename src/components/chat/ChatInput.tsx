import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
}

export const ChatInput = ({ onSendMessage, placeholder = "Type a message..." }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  
  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="p-3 border-t border-zinc-800">
      {user ? (
        <div className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 bg-[#1C1C1E] border-zinc-700"
          />
          <Button 
            size="icon"
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-[#0D99FF] hover:bg-[#0D99FF]/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-center text-zinc-400">
          Please <Link to="/auth" className="text-[#0D99FF] hover:underline">sign in</Link> to join the conversation
        </p>
      )}
    </div>
  );
};
