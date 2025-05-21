
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlayerMovements } from "@/hooks/waiting-room/use-player-movements";
import PlayerMovementList from "./PlayerMovementList";

interface PlayerMovementChatProps {
  roomId: string;
}

const PlayerMovementChat = ({ roomId }: PlayerMovementChatProps) => {
  const { movements, formatTime } = usePlayerMovements(roomId);
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-3 border-b">
        <CardTitle className="text-base">Player Activities</CardTitle>
      </CardHeader>
      
      <PlayerMovementList 
        movements={movements} 
        formatTime={formatTime} 
      />
    </Card>
  );
};

export default PlayerMovementChat;
