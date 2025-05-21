import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Game } from "@/types/game";

const STALE_GAME_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds - more aggressive cleanup
const ACTIVE_PLAYER_THRESHOLD = 60000; // 1 minute in milliseconds - match online status threshold

export const useGame = () => {
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();

  const cleanupStaleGames = async () => {
    try {
      const staleTime = new Date(Date.now() - STALE_GAME_THRESHOLD).toISOString();
      
      // Delete games that are in 'waiting' status but haven't been updated recently
      await supabase
        .from('games')
        .delete()
        .eq('status', 'waiting')
        .lt('updated_at', staleTime);
    } catch (error) {
      console.error('Error cleaning up stale games:', error);
    }
  };

  const fetchActiveGames = useCallback(
    async (page: number = 1, limit: number = 12) => {
      try {
        setIsLoading(true);
        
        // First cleanup stale games
        await cleanupStaleGames();

        // Now fetch active games with player profiles
        const {
          data: games,
          count: totalCount,
          error,
        } = await supabase
          .from("games")
          .select(
            `
            *,
            solo_players (
              user_id,
              profiles (
                id,
                is_online,
                last_active_at
              )
            )
            `,
            { count: "exact" }
          )
          .eq("mode", "real")
          .eq("status", "waiting")
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (error) {
          console.error("Error fetching games:", error);
          toast({
            title: "Error fetching active games",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        // Filter out games where all players are inactive
        const now = new Date().getTime();
        const activeGamesFiltered = games.filter(game => {
          const players = game.solo_players || [];
          return players.some(player => {
            const profile = player.profiles;
            if (!profile) return false;

            // Consider a player active if they're either:
            // 1. Currently marked as online
            // 2. Have been active within the threshold
            const lastActiveTime = profile.last_active_at ? new Date(profile.last_active_at).getTime() : 0;
            return profile.is_online && (now - lastActiveTime < ACTIVE_PLAYER_THRESHOLD);
          });
        });

        // Transform the data to include only active player count
        const gamesWithPlayerCount = activeGamesFiltered.map((game) => {
          const now = new Date().getTime();
          const activePlayers = (game.solo_players || []).filter(player => {
            const profile = player.profiles;
            if (!profile) return false;
            const lastActiveTime = profile.last_active_at ? new Date(profile.last_active_at).getTime() : 0;
            return profile.is_online && (now - lastActiveTime < ACTIVE_PLAYER_THRESHOLD);
          });

          return {
            ...game,
            player_count: activePlayers.length,
          };
        });

        // Calculate total pages based on filtered games
        const totalPages = Math.ceil(activeGamesFiltered.length / limit);

        setActiveGames(gamesWithPlayerCount);
        setTotalPages(totalPages);
      } catch (error) {
        console.error('Error fetching games:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch active games',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchActiveGames();

    // Set up real-time subscriptions
    const gameSubscription = supabase
      .channel("game-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        () => fetchActiveGames()
      )
      .subscribe();

    const playerSubscription = supabase
      .channel("game-player-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solo_players" },
        () => fetchActiveGames()
      )
      .subscribe();

    const profileSubscription = supabase
      .channel("profile-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchActiveGames()
      )
      .subscribe();

    // Refresh active games periodically
    const refreshInterval = setInterval(fetchActiveGames, 30000);

    return () => {
      supabase.removeChannel(gameSubscription);
      supabase.removeChannel(playerSubscription);
      supabase.removeChannel(profileSubscription);
      clearInterval(refreshInterval);
    };
  }, [fetchActiveGames]);

  const joinGame = async (game: Game, userId: string) => {
    try {
      // Verify game is still active
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*, solo_players(user_id, profiles(is_online, last_active_at))')
        .eq('id', game.id)
        .eq('status', 'waiting')
        .single();

      if (gameError || !gameData) {
        toast({
          title: 'Game Not Available',
          description: 'This game is no longer available',
          variant: 'destructive',
        });
        return;
      }

      // Check if game is stale
      const lastUpdate = new Date(gameData.updated_at).getTime();
      if (Date.now() - lastUpdate > STALE_GAME_THRESHOLD) {
        await supabase
          .from('games')
          .delete()
          .eq('id', game.id);
        
        toast({
          title: 'Game Expired',
          description: 'This game session has expired',
          variant: 'destructive',
        });
        return;
      }

      // Verify there are active players
      const now = new Date().getTime();
      const hasActivePlayers = (gameData.solo_players || []).some(player => {
        const profile = player.profiles;
        if (!profile) return false;
        const lastActiveTime = profile.last_active_at ? new Date(profile.last_active_at).getTime() : 0;
        return profile.is_online && (now - lastActiveTime < ACTIVE_PLAYER_THRESHOLD);
      });

      if (!hasActivePlayers) {
        toast({
          title: 'Game Inactive',
          description: 'This game has no active players',
          variant: 'destructive',
        });
        return;
      }

      // Join the game
      const { error: joinError } = await supabase
        .from('solo_players')
        .insert({
          game_id: game.id,
          user_id: userId,
        });

      if (joinError) throw joinError;

      // Update game's updated_at timestamp
      await supabase
        .from('games')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', game.id);

      navigate(
        `/simple-waiting-room/${game.id}?mode=${game.mode}&type=${game.type}&wager=${game.wager_amount}`
      );
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        title: 'Error',
        description: 'Failed to join the game',
        variant: 'destructive',
      });
    }
  };

  return { activeGames, isLoading, totalPages, fetchActiveGames, joinGame };
};
