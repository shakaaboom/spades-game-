
import { UserPlus, UserMinus, CheckCircle } from "lucide-react";

export interface PlayerMovement {
  id: string;
  type: 'join' | 'leave' | 'ready' | 'unready';
  playerName: string;
  timestamp: Date;
}

interface PlayerMovementItemProps {
  movement: PlayerMovement;
  formatTime: (date: Date) => string;
}

const PlayerMovementItem = ({ movement, formatTime }: PlayerMovementItemProps) => {
  const getMovementIcon = (type: 'join' | 'leave' | 'ready' | 'unready') => {
    switch (type) {
      case 'join':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'leave':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unready':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getMovementText = (type: 'join' | 'leave' | 'ready' | 'unready', playerName: string) => {
    switch (type) {
      case 'join':
        return `${playerName} joined the room`;
      case 'leave':
        return `${playerName} left the room`;
      case 'ready':
        return `${playerName} is ready to play`;
      case 'unready':
        return `${playerName} is no longer ready`;
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {getMovementIcon(movement.type)}
      <div className="flex-1">
        {getMovementText(movement.type, movement.playerName)}
      </div>
      <span className="text-xs text-muted-foreground">
        {formatTime(movement.timestamp)}
      </span>
    </div>
  );
};

export default PlayerMovementItem;
