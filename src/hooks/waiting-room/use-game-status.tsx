
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseGameStatusProps {
  waitingRoom: any;
  user: any;
  initialized: boolean;
  profileReady: boolean;
  roomId?: string;
  joinWaitingRoom: (roomId: string) => Promise<boolean>;
  refreshWaitingRoom: () => Promise<void>;
}

export const useGameStatus = ({
  waitingRoom,
  user,
  initialized,
  profileReady,
  roomId,
  joinWaitingRoom,
  refreshWaitingRoom
}: UseGameStatusProps) => {
  const navigate = useNavigate();
  
  // Handle game progress status changes
  useEffect(() => {
    if (waitingRoom?.status === 'in_progress') {
      console.log("Game is now in progress, navigating to game page:", waitingRoom.id);
      navigate(`/game/${waitingRoom.id}`);
    }
  }, [waitingRoom?.status, waitingRoom?.id, navigate]);

  // Check and ensure user is in the room
  useEffect(() => {
    if (waitingRoom && user) {
      console.log("Current waitingRoom players:", waitingRoom.players);
      
      const currentPlayerStatus = waitingRoom.players.find(p => p.id === user.id);
      console.log("Current player's status in room:", 
        currentPlayerStatus 
          ? `Found (Ready: ${currentPlayerStatus.isReady}, Host: ${currentPlayerStatus.isHost})` 
          : "Not found in room"
      );
      
      if (!currentPlayerStatus && roomId && initialized && profileReady) {
        console.log("User not found in room but has roomId, attempting to join:", roomId);
        joinWaitingRoom(roomId).then(success => {
          if (success) {
            console.log("Auto-join successful");
            refreshWaitingRoom();
          } else {
            console.error("Auto-join failed");
          }
        });
      }
    }
  }, [waitingRoom, user, roomId, initialized, profileReady, joinWaitingRoom, refreshWaitingRoom]);
  
  return {};
};
