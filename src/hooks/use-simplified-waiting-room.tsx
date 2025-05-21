import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useWebSocket } from "@/hooks/use-websocket";
import { startGameRound } from "@/lib/gameLogic";

interface WaitingRoomPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isBot?: boolean;
  position: number;
}

interface WaitingRoomState {
  id: string;
  status: string;
  gameType: "solo" | "partnered";
  gameMode: "practice" | "real";
  wagerAmount: number;
  players: WaitingRoomPlayer[];
}

interface SimpleWaitingRoomProps {
  roomId?: string;
  mode: "practice" | "real";
  gameType: "solo" | "partnered";
  wagerAmount: number;
}

export const useSimplifiedWaitingRoom = (props: SimpleWaitingRoomProps) => {
  const { roomId, mode, gameType, wagerAmount } = props;
  const [waitingRoom, setWaitingRoom] = useState<WaitingRoomState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setGameMode, setGameType } = useWebSocket();

  useEffect(() => {
    if (!roomId) return;

    console.log("Setting up realtime subscription for waiting room:", roomId);

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "solo_players",
          filter: `game_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Game player change detected:", payload);
          refreshWaitingRoom();
        }
      )
      .subscribe();

    const gamesChannel = supabase
      .channel(`games-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Game data change detected:", payload);
          refreshWaitingRoom();
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up subscription");
      supabase.removeChannel(channel);
      supabase.removeChannel(gamesChannel);
    };
  }, [roomId]);

  useEffect(() => {
    if (roomId) {
      console.log("Initial waiting room fetch for:", roomId);
      setIsLoading(true);
      refreshWaitingRoom();
    }
  }, [roomId, user]);

  const refreshWaitingRoom = useCallback(async () => {
    if (!roomId) return false;

    try {
      setIsLoading(true);
      setError(null);
      console.log("Refreshing waiting room data for room:", roomId);

      // First, clean up inactive players (those who haven't updated their status in the last 4 minutes)
      const fourMinutesAgo = new Date(Date.now() - 4 * 60 * 1000).toISOString();
      
      await supabase
        .from("solo_players")
        .delete()
        .eq("game_id", roomId)
        .lt("last_active_at", fourMinutesAgo);

      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      if (gameError) {
        console.error("Error fetching waiting room:", gameError);
        setError(`Database error: ${gameError.message}`);
        setIsLoading(false);
        return false;
      }

      if (!gameData) {
        console.error("No game found with ID:", roomId);
        setError(`No waiting room found with ID: ${roomId}`);
        toast({
          title: "Room not found",
          description: `The waiting room with ID ${roomId} doesn't exist.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }

      console.log("Received waiting room data:", gameData);

      setGameMode(gameData.mode);
      setGameType(gameData.type);

      // Only fetch active players
      const { data: playersData, error: playersError } = await supabase
        .from("solo_players")
        .select("*, profiles(username, avatar_url, is_online, last_active_at)")
        .eq("game_id", roomId)
        .gt("last_active_at", fourMinutesAgo);

      if (playersError) {
        console.error("Error fetching players:", playersError);
        setError(`Error fetching players: ${playersError.message}`);
        setIsLoading(false);
        return false;
      }

      console.log("Received players data:", playersData);

      const players: WaitingRoomPlayer[] = playersData
        .filter(player => player.profiles?.is_online || player.user_id === user?.id)
        .map(player => ({
          id: player.user_id || player.id,
          name: player.profiles?.username || player.user_id?.split("-")[0] || "Unknown Player",
          avatar: player.profiles?.avatar_url || "",
          isHost: player.user_id === gameData.created_by,
          isBot: false,
          position: player.position || 0,
        }));

      console.log("Processed players:", players);

      setWaitingRoom({
        id: gameData.id,
        status: gameData.status,
        gameType: gameData.type,
        gameMode: gameData.mode,
        wagerAmount: gameData.wager_amount,
        players: players,
      });

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error in refreshWaitingRoom:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      setIsLoading(false);
      return false;
    }
  }, [roomId, user?.id, setGameMode, setGameType, toast]);

  const joinWaitingRoom = useCallback(
    async (id: string) => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to join a waiting room",
          variant: "destructive",
        });
        navigate("/auth");
        return false;
      }

      try {
        setIsJoining(true);
        setError(null);
        console.log("Attempting to join waiting room:", id);

        const { data: gameData, error: gameError } = await supabase
          .from("games")
          .select("status, type, mode")
          .eq("id", id)
          .maybeSingle();

        if (gameError) {
          console.error("Error checking game status:", gameError);
          setError(`Database error: ${gameError.message}`);
          toast({
            title: "Error",
            description: "Could not find the waiting room",
            variant: "destructive",
          });
          return false;
        }

        if (!gameData) {
          console.error("No game found with ID:", id);
          setError(`No waiting room found with ID: ${id}`);
          toast({
            title: "Room not found",
            description: `The waiting room with ID ${id} doesn't exist.`,
            variant: "destructive",
          });
          return false;
        }

        if (gameData.status !== "waiting") {
          console.log("Game is no longer accepting players:", gameData.status);
          setError(
            `Game status is ${gameData.status}, not accepting new players`
          );
          toast({
            title: "Game Unavailable",
            description: "This game has already started or is full",
            variant: "destructive",
          });
          return false;
        }

        const { data: existingPlayers, error: playersError } = await supabase
          .from("solo_players")
          .select("user_id, position")
          .eq("game_id", id);

        if (playersError) {
          console.error("Error checking existing players:", playersError);
          setError(`Error checking players: ${playersError.message}`);
          return false;
        }

        const userAlreadyJoined = existingPlayers?.some(
          (p) => p.user_id === user.id
        );

        if (userAlreadyJoined) {
          console.log("User already joined this room");
          await refreshWaitingRoom();
          return true;
        }

        if (existingPlayers && existingPlayers.length >= 4) {
          console.log("Room is already full");
          setError("Room is already full with 4 players");
          toast({
            title: "Room Full",
            description: "This game room already has 4 players",
            variant: "destructive",
          });
          return false;
        }

        const availablePosition = existingPlayers?.length || 0;

        console.log("Adding player to room with position:", availablePosition);

        const { error } = await supabase.from("solo_players").insert({
          game_id: id,
          user_id: user.id,
          position: availablePosition,
        });

        if (error) {
          console.error("Error joining waiting room:", error);
          setError(`Error joining room: ${error.message}`);
          toast({
            title: "Error",
            description: "Failed to join waiting room. Please try again.",
            variant: "destructive",
          });
          return false;
        }

        console.log("Successfully joined waiting room");
        await refreshWaitingRoom();
        return true;
      } catch (error) {
        console.error("Error joining waiting room:", error);
        setError(
          `Error joining room: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        return false;
      } finally {
        setIsJoining(false);
      }
    },
    [user, toast, navigate, refreshWaitingRoom]
  );

  const leaveWaitingRoom = useCallback(async () => {
    if (!user || !roomId) return false;

    try {
      console.log("Attempting to leave waiting room:", roomId);
      console.log("User ID:", user.id);

      try {
        // First verify if the record exists
        const { data: existingPlayer } = await supabase
          .from("solo_players")
          .select("*")
          .eq("game_id", roomId)
          .eq("user_id", user.id)
          .single();

        if (!existingPlayer) {
          console.log("No player record found to delete");
          return;
        }

        const { data, error } = await supabase
          .from("solo_players")
          .delete()
          .eq("game_id", roomId)
          .eq("user_id", user.id)
          .select(); // Add .select() to return the deleted row

        if (error) {
          console.error("Error deleting player:", error);
          toast({
            title: "Error leaving game",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        // get the game data
        const { data: gameData, error: gameDataError } = await supabase
          .from("games")
          .select("created_by")
          .eq("id", roomId)
          .maybeSingle();

        if (gameDataError) {
          console.error("Error fetching game data:", gameDataError);
          return;
        }

        // if the player is the host, we need to delete the game
        if (existingPlayer.user_id === gameData?.created_by) {
          await supabase.from("games").delete().eq("id", roomId);
        }

        if (data && data.length > 0) {
          console.log("Successfully deleted player record:", data[0]);
          toast({
            title: "Left game",
            description: "You have successfully left the game",
          });
        } else {
          console.log("No records were deleted");
        }
      } catch (error) {
        console.error("Error in delete operation:", error);
      }

      console.log("Successfully left waiting room");
      navigate("/lobby");
      return true;
    } catch (error) {
      console.error("Error leaving waiting room:", error);
      setError(
        `Error leaving room: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  }, [user, roomId, navigate]);

  const setPlayerReady = useCallback(
    async (isReady: boolean) => {
      if (!user || !roomId) return false;

      try {
        console.log("Setting player ready status to:", isReady);

        const { error } = await supabase
          .from("game_players")
          .update({ is_ready: isReady })
          .eq("game_id", roomId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating ready status:", error);
          setError(`Error updating ready status: ${error.message}`);
          return false;
        }

        console.log("Successfully updated ready status");
        await refreshWaitingRoom();
        return true;
      } catch (error) {
        console.error("Error updating ready status:", error);
        setError(
          `Error updating ready status: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        return false;
      }
    },
    [user, roomId, refreshWaitingRoom]
  );

  const startGame = useCallback(async () => {
    if (!user || !roomId || !waitingRoom) return false;

    if (waitingRoom.players.length !== 4) {
      toast({
        title: "Not Enough Players",
        description: "Need 4 players to start the game",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log("Starting game");

      const { error } = await supabase
        .from("games")
        .update({
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .eq("id", roomId);

      // update the game_rounds table
      console.log("waitingRoom.players[0].id: ", waitingRoom.players[0].id);
      const currentPlayerId = waitingRoom.players[0].id;
      // check if the player is host
      const isHost =
        waitingRoom?.players.some(
          (player) => player.id === user?.id && player.isHost
        ) || false;

      // get player data
      const { data: playerData, error: playerError } = await supabase
        .from("solo_players")
        .select("*")
        .eq("user_id", currentPlayerId)
        .eq("game_id", roomId)
        .maybeSingle();
      if (playerError) {
        console.error("Error getting player data:", playerError);
        return false;
      }
      if (isHost) {
        const { data: roundData, error: roundError } = await supabase
          .from("solo_game_rounds")
          .select("*")
          .eq("game_id", roomId)
          .maybeSingle();
        if (roundError) {
          console.error("Error getting round data:", roundError);
          return false;
        }
        if (roundData) {
          // await startGameRound(roomId, roundData.round_number);
          console.log("Round data:", roundData);
        } else {
          await startGameRound(roomId, 1);
        }
      }

      if (error) {
        console.error("Error starting game:", error);
        setError(`Error starting game: ${error.message}`);
        return false;
      }
      
      console.log("Game started successfully");
      toast({
        title: "Game Started",
        description: "Your game has begun!",
      });
      navigate(`/game/${roomId}`);
      return true;
    } catch (error) {
      console.error("Error starting game:", error);
      setError(
        `Error starting game: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  }, [user, roomId, waitingRoom, toast, navigate]);

  const startGame_original = useCallback(async () => {
    if (!user || !roomId || !waitingRoom) return false;

    if (waitingRoom.players.length !== 4) {
      toast({
        title: "Not Enough Players",
        description: "Need 4 players to start the game",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log("Starting game");

      const { error } = await supabase
        .from("games")
        .update({
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .eq("id", roomId);

      // update the game_rounds table
      console.log("waitingRoom.players[0].id: ", waitingRoom.players[0].id);
      const currentPlayerId = waitingRoom.players[0].id;
      // get player data
      const { data: playerData, error: playerError } = await supabase
        .from("game_players")
        .select("*")
        .eq("user_id", currentPlayerId)
        .eq("game_id", roomId)
        .maybeSingle();
      if (playerError) {
        console.error("Error getting player data:", playerError);
        return false;
      }
      const { error: roundError } = await supabase.from("game_rounds").insert({
        game_id: roomId,
        round_number: 1,
        current_player: playerData.id,
        status: "in_progress",
        started_at: new Date().toISOString(),
      });
      if (roundError) {
        console.error("Error starting game:", roundError);
        setError(`Error starting game: ${roundError.message}`);
        return false;
      }

      if (error) {
        console.error("Error starting game:", error);
        setError(`Error starting game: ${error.message}`);
        return false;
      }

      console.log("Game started successfully");
      toast({
        title: "Game Started",
        description: "Your game has begun!",
      });
      navigate(`/game/${roomId}`);
      return true;
    } catch (error) {
      console.error("Error starting game:", error);
      setError(
        `Error starting game: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  }, [user, roomId, waitingRoom, toast, navigate]);

  return {
    waitingRoom,
    isLoading,
    isJoining,
    error,
    joinWaitingRoom,
    leaveWaitingRoom,
    setPlayerReady,
    startGame,
    refreshWaitingRoom,
  };
};
