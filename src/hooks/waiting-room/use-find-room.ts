
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getGamePlayers, findAvailableGames } from './use-game-queries';

interface UseRoomFinderProps {
  user: any;
  joinWaitingRoom: (roomId: string) => Promise<boolean>;
}

export const useFindRoom = ({
  user,
  joinWaitingRoom
}: UseRoomFinderProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  // Function to find an available room
  const findAvailableRoom = useCallback(async (
    gameType: string,
    gameMode: 'practice' | 'real',
    wagerAmount: number
  ): Promise<string | null> => {
    if (!user) {
      console.error("Cannot find room - no user logged in");
      toast({
        title: "Authentication Required",
        description: "Please sign in to play games",
        variant: "destructive"
      });
      return null;
    }

    console.log("Looking for available games with params:", {
      gameType,
      gameMode,
      wagerAmount
    });

    try {
      const { data: availableGames, error: gamesError } = 
        await findAvailableGames(gameType, gameMode, wagerAmount);

      if (gamesError) {
        console.error("Error finding available games:", gamesError);
        return null;
      }

      console.log("Found existing games:", availableGames);
      
      // Check which games have open slots
      if (availableGames && availableGames.length > 0) {
        for (const game of availableGames) {
          const { data: players, error: playersError } = 
            await getGamePlayers(game.id);

          if (playersError) {
            console.error("Error checking players for game:", game.id, playersError);
            continue;
          }
          
          // If the game has less than 4 players and doesn't include the current user, it's joinable
          if (players.length < 4 && !players.some(p => p.user_id === user.id)) {
            return game.id;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error in findAvailableRoom:", error);
      return null;
    }
  }, [user, toast]);

  return {
    findAvailableRoom
  };
};
