
import { useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { createGame } from './use-game-queries';

interface UseCreateRoomProps {
  user: any;
}

export const useCreateRoom = ({
  user
}: UseCreateRoomProps) => {
  const { toast } = useToast();

  // Function to create a new room
  const createNewRoom = useCallback(async (
    gameType: string,
    gameMode: 'practice' | 'real',
    wagerAmount: number
  ): Promise<string | null> => {
    if (!user) {
      console.error("Cannot create room - no user logged in");
      toast({
        title: "Authentication Required",
        description: "Please sign in to play games",
        variant: "destructive"
      });
      return null;
    }

    console.log("Creating new game with parameters:", {
      gameType,
      gameMode,
      wagerAmount
    });
    
    try {
      const gameId = await createGame(gameMode, gameType, wagerAmount, user.id);
      
      if (!gameId) {
        console.error("Failed to create game");
        return null;
      }
      
      return gameId;
    } catch (error) {
      console.error("Error in createNewRoom:", error);
      return null;
    }
  }, [user, toast]);

  return {
    createNewRoom
  };
};
