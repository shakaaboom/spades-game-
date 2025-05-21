import { User } from "../../types/chat";
import { Profile } from "../../types/auth";

interface ChatMessageProps {
  id: string;
  user: User;
  message: string;
  timestamp: Date;
  formatTime: (date: Date) => string;
  isAdminMessage?: boolean;
  profile?: Profile | null;
  currentUser?: User | null;
}

export const ChatMessage = ({ profile, currentUser, user, message, timestamp, formatTime, isAdminMessage }: ChatMessageProps) => {
  // Check if the message is from the current user
  const isCurrentUser = currentUser && user.id === currentUser.id;
  
  // Special styling for system messages
  if (user.id === "system") {
    return (
      <div className="bg-zinc-800/50 p-2 rounded-2xl my-2 text-center w-full max-w-xs mx-auto">
        <p className="text-xs text-zinc-400">{message}</p>
      </div>
    );
  }

  // Get display name - show "You" for current user, username for others
  const displayName = isCurrentUser ? "You" : (user.name || "Anonymous");

  return (
    <div className={`w-full mb-4 ${isCurrentUser ? "flex flex-col items-end" : "flex flex-col items-start"}`}>
      {/* Message content */}
      <div className={`max-w-[80%] ${isCurrentUser ? "items-end" : "items-start"}`}>
        {/* Always show username/You at the top */}
        <div className="text-sm text-zinc-400 mb-1 px-1">
          {displayName}
        </div>
        
        <div 
          className={`px-4 py-2 rounded-2xl break-words ${
            isCurrentUser 
              ? "bg-[#0D99FF] text-white rounded-br-none" 
              : "bg-[#1C1C1E] text-white rounded-bl-none"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message}</p>
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-zinc-500 mt-1 px-1">
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
};