
import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PlayerMovementItem, { PlayerMovement } from "./PlayerMovementItem";

interface PlayerMovementListProps {
  movements: PlayerMovement[];
  formatTime: (date: Date) => string;
}

const PlayerMovementList = ({ movements, formatTime }: PlayerMovementListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [movements]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <ScrollArea className="flex-grow p-3">
      <div className="space-y-2">
        {movements.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No player activity yet.
          </div>
        ) : (
          movements.map(movement => (
            <PlayerMovementItem 
              key={movement.id} 
              movement={movement} 
              formatTime={formatTime} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default PlayerMovementList;
