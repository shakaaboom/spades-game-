
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createGame } from "@/hooks/waiting-room/use-game-queries";

export const useSoloFiveDollarGame = () => {
  const [isJoining, setIsJoining] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const joinSoloFiveDollarGame = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a game",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setIsJoining(true);
    
    try {
      // First check if there's an available $5 solo real money game
      const { data: availableGames, error: gamesError } = await supabase
        .from('games')
        .select('id')
        .eq('status', 'waiting')
        .eq('type', 'solo')
        .eq('mode', 'real')
        .eq('wager_amount', 5)
        .limit(5);

      if (gamesError) {
        console.error("Error finding available games:", gamesError);
        toast({
          title: "Error",
          description: "Failed to find available games. Please try again.",
          variant: "destructive"
        });
        setIsJoining(false);
        return;
      }

      let gameId = null;

      // If there are available games, try to join one
      if (availableGames && availableGames.length > 0) {
        // Check each game to see if user can join
        for (const game of availableGames) {
          // Check if game has space and user isn't already in it
          const { data: players, error: playersError } = await supabase
            .from('game_players')
            .select('user_id')
            .eq('game_id', game.id);

          if (playersError) {
            console.error("Error checking players for game:", game.id, playersError);
            continue;
          }
          
          // If the game has less than 4 players and doesn't include the current user, it's joinable
          if (players.length < 4 && !players.some(p => p.user_id === user.id)) {
            gameId = game.id;
            break;
          }
        }
      }

      // If no suitable existing game found, create a new one
      if (!gameId) {
        console.log("No suitable existing game found, creating new game");
        
        gameId = await createGame('real', 'solo', 5, user.id);
        
        if (!gameId) {
          console.error("Error creating game");
          toast({
            title: "Error",
            description: "Failed to create a new game. Please try again.",
            variant: "destructive"
          });
          setIsJoining(false);
          return;
        }
        
        console.log("Created new game with ID:", gameId);
      }

      // Now join the game
      if (gameId) {
        // First get position - check which positions are already taken
        const { data: existingPlayers, error: existingError } = await supabase
          .from('game_players')
          .select('position')
          .eq('game_id', gameId);
          
        if (existingError) {
          console.error("Error getting existing players:", existingError);
          setIsJoining(false);
          return;
        }
        
        const positions = ['south', 'west', 'north', 'east'];
        const takenPositions = existingPlayers?.map(p => p.position) || [];
        const availablePosition = positions.find(p => !takenPositions.includes(p)) || 'south';
        
        // Add user to game with proper username from profile
        const { error: joinError } = await supabase
          .from('game_players')
          .insert({
            game_id: gameId,
            user_id: user.id,
            position: availablePosition,
            is_ready: false
          });

        if (joinError) {
          console.error("Error joining game:", joinError);
          toast({
            title: "Error",
            description: "Failed to join the game. Please try again.",
            variant: "destructive"
          });
          setIsJoining(false);
          return;
        }

        // Add a player event to track joining
        const playerName = profile?.username || user.email?.split('@')[0] || 'Unknown Player';
        await supabase
          .from('game_player_events')
          .insert({
            game_id: gameId,
            player_id: user.id,
            player_name: playerName,
            event_type: 'join'
          });

        // Updated to direct to SimpleWaitingRoom instead of WaitingRoom
        toast({
          title: "Success",
          description: "Joined $5 solo game waiting room!",
        });
        
        navigate(`/simple-waiting-room/${gameId}?mode=real&type=solo&wager=5`);
      }
    } catch (error) {
      console.error("Error joining solo $5 game:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  }, [user, profile, toast, navigate]);

  return {
    isJoining,
    joinSoloFiveDollarGame
  };
};
