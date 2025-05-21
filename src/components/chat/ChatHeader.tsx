import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronLeft, ChevronRight, X } from "lucide-react";

interface ChatHeaderProps {
  isCollapsed: boolean;
  isMobile: boolean;
  isAdminContact?: boolean;
  title?: string;
  onToggleCollapse: () => void;
  onResetChat?: () => void;
  onClose?: () => void;
}

export const ChatHeader = ({ 
  isCollapsed, 
  isMobile, 
  isAdminContact = false,
  title,
  onToggleCollapse, 
  onResetChat,
  onClose
}: ChatHeaderProps) => {
  // When collapsed, show just the icon
  if (isCollapsed) {
    return (
      <div 
        className="h-full w-full flex items-center justify-center cursor-pointer bg-[#1C1C1E]"
        onClick={onToggleCollapse}
      >
        <MessageSquare className="h-5 w-5 text-[#0095FF]" />
      </div>
    );
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
    }
  };

  // When expanded, show the full header
  return (
    <div 
      className="p-4 border-b border-zinc-800 flex items-center justify-between cursor-pointer"
      onClick={onToggleCollapse}
    >
      <div className="flex items-center">
        <MessageSquare className="h-5 w-5 mr-2 text-[#0095FF]" />
        <h3 className="font-medium text-white">
          {title || (isAdminContact ? "Admin Contact" : "Lobby Chat")}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        {onClose && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 hover:bg-zinc-800"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </Button>
        )}
        <ChevronRight className="h-4 w-4 text-zinc-400" />
      </div>
    </div>
  );
};
