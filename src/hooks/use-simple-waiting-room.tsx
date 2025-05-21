
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

interface SimpleWaitingRoomProps {
  roomId?: string;
  mode?: 'practice' | 'real';
  gameType?: 'solo' | 'partnered';
  wagerAmount?: number;
}

interface WaitingRoomPlayer {
  id: string;
  name: string;
  avatar?: string;
  isReady: boolean;
  isHost: boolean;
  position?: string;
  isBot?: boolean;
}

interface WaitingRoomState {
  id: string;
  status: 'setup' | 'waiting' | 'starting' | 'in_progress';
  players: WaitingRoomPlayer[];
  gameMode: string;
  gameType: string;
  wagerAmount?: number;
  createdAt: Date;
}

export function useSimplifiedWaitingRoom({
  roomId,
  mode = 'practice',
  gameType = 'solo',
  wagerAmount = 0
}: SimpleWaitingRoomProps) {
  const [waitingRoom, setWaitingRoom] = useState<WaitingRoomState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Set up Supabase realtime subscription
  useEffect(() => {
    if (!roomId) return;

    console.log("Setting up realtime subscription for room:", roomId);
    
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_players',
        filter: `game_id=eq.${roomId}`
      }, () => {
        console.log("Player joined - refreshing waiting room");
        refreshWaitingRoom();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'game_players',
        filter: `game_id=eq.${roomId}`
      }, () => {
        console.log("Player left - refreshing waiting room");
        refreshWaitingRoom();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${roomId}`
      }, (payload) => {
        console.log("Game updated:", payload);
        
        // If game status changes to in_progress, redirect to game
        if (payload.new && payload.new.status === 'in_progress') {
          console.log("Game started - redirecting to game table");
          navigate(`/game/${roomId}`);
        } else {
          refreshWaitingRoom();
        }
      })
      .subscribe();
    
    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [roomId, navigate]);

  const refreshWaitingRoom = useCallback(async () => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    console.log("Refreshing waiting room data for room:", roomId);
    setIsLoading(true);
    
    try {
      // First get the game information
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (gameError) {
        console.error("Error fetching game:", gameError);
        setError("Error fetching game information");
        setIsLoading(false);
        return;
      }
      
      if (!gameData) {
        console.error("No game found with ID:", roomId);
        setError("Game not found");
        setIsLoading(false);
        return;
      }
      
      // Then get the players in this game
      const { data: playersData, error: playersError } = await supabase
        .from('game_players')
        .select('*, profiles:user_id(*)')
        .eq('game_id', roomId);
      
      if (playersError) {
        console.error("Error fetching players:", playersError);
        setError("Error fetching player information");
        setIsLoading(false);
        return;
      }
      
      // Format player data
      const formattedPlayers: WaitingRoomPlayer[] = playersData.map(player => ({
        id: player.user_id || player.id,
        name: player.is_bot 
          ? `AI Player (${player.position})` 
          : (player.profiles?.username || 'Unknown Player'),
        avatar: player.profiles?.avatar_url,
        isReady: player.is_ready,
        isHost: player.user_id === gameData.created_by,
        position: player.position,
        isBot: player.is_bot
      }));
      
      // Create the waiting room state
      const roomState: WaitingRoomState = {
        id: gameData.id,
        status: gameData.status,
        players: formattedPlayers,
        gameMode: gameData.mode,
        gameType: gameData.type,
        wagerAmount: gameData.wager_amount,
        createdAt: new Date(gameData.created_at)
      };
      
      setWaitingRoom(roomState);
      setError(null);
    } catch (err) {
      console.error("Error in refreshWaitingRoom:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // Initial load of waiting room data
  useEffect(() => {
    if (roomId) {
      refreshWaitingRoom();
    }
  }, [roomId, refreshWaitingRoom]);

  const joinWaitingRoom = useCallback(async (targetRoomId: string) => {
    if (isJoining) return false;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a game",
        variant: "destructive"
      });
      navigate('/auth');
      return false;
    }
    
    console.log("Joining waiting room:", targetRoomId);
    setIsJoining(true);
    
    try {
      // Check if the user is already in this room
      const { data: existingPlayer, error: checkError } = await supabase
        .from('game_players')
        .select('id')
        .eq('game_id', targetRoomId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking existing player:", checkError);
        toast({
          title: "Error",
          description: "Could not check if you're already in this game",
          variant: "destructive"
        });
        setIsJoining(false);
        return false;
      }
      
      // If player is already in the room, just refresh
      if (existingPlayer) {
        console.log("User already in waiting room, refreshing data");
        await refreshWaitingRoom();
        setIsJoining(false);
        return true;
      }
      
      // Check available positions
      const { data: currentPlayers, error: positionError } = await supabase
        .from('game_players')
        .select('position')
        .eq('game_id', targetRoomId);
      
      if (positionError) {
        console.error("Error checking positions:", positionError);
        toast({
          title: "Error",
          description: "Could not check available positions",
          variant: "destructive"
        });
        setIsJoining(false);
        return false;
      }
      
      // Determine available positions
      const takenPositions = currentPlayers.map(p => p.position);
      const allPositions = ['south', 'west', 'north', 'east'];
      const availablePositions = allPositions.filter(p => !takenPositions.includes(p));
      
      if (availablePositions.length === 0) {
        toast({
          title: "Room Full",
          description: "This game is already full",
          variant: "destructive"
        });
        setIsJoining(false);
        return false;
      }
      
      // Join the room with the first available position
      const position = availablePositions[0];
      
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          game_id: targetRoomId,
          user_id: user.id,
          position: position,
          is_ready: false
        });
      
      if (joinError) {
        console.error("Error joining waiting room:", joinError);
        toast({
          title: "Error",
          description: "Could not join the waiting room",
          variant: "destructive"
        });
        setIsJoining(false);
        return false;
      }
      
      // Add joined event
      await supabase
        .from('game_player_events')
        .insert({
          id: uuidv4(),
          game_id: targetRoomId,
          player_id: user.id,
          player_name: profile?.username || user.email?.split('@')[0] || 'Anonymous',
          event_type: 'joined'
        });
      
      console.log("Successfully joined waiting room");
      
      // Refresh the waiting room data
      await refreshWaitingRoom();
      setIsJoining(false);
      return true;
    } catch (err) {
      console.error("Error in joinWaitingRoom:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      setIsJoining(false);
      return false;
    }
  }, [user, profile, navigate, toast, isJoining, refreshWaitingRoom]);

  const leaveWaitingRoom = useCallback(async () => {
    if (!user || !roomId) return false;
    
    console.log("Leaving waiting room:", roomId);
    
    try {
      // Remove player from the game
      const { error: leaveError } = await supabase
        .from('game_players')
        .delete()
        .eq('game_id', roomId)
        .eq('user_id', user.id);
      
      if (leaveError) {
        console.error("Error leaving waiting room:", leaveError);
        toast({
          title: "Error",
          description: "Could not leave the waiting room",
          variant: "destructive"
        });
        return false;
      }
      
      // Add left event
      await supabase
        .from('game_player_events')
        .insert({
          id: uuidv4(),
          game_id: roomId,
          player_id: user.id,
          player_name: profile?.username || user.email?.split('@')[0] || 'Anonymous',
          event_type: 'left'
        });
      
      console.log("Successfully left waiting room");
      return true;
    } catch (err) {
      console.error("Error in leaveWaitingRoom:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [user, profile, roomId, toast]);

  const startGame = useCallback(async () => {
    if (!user || !roomId || !waitingRoom) return false;
    
    // Check if user is host
    const isHost = waitingRoom.players.some(p => p.id === user.id && p.isHost);
    
    if (!isHost) {
      toast({
        title: "Permission Denied",
        description: "Only the host can start the game",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      // Update game status to in_progress
      const { error: startError } = await supabase
        .from('games')
        .update({ status: 'in_progress' })
        .eq('id', roomId);
      
      if (startError) {
        console.error("Error starting game:", startError);
        toast({
          title: "Error",
          description: "Could not start the game",
          variant: "destructive"
        });
        return false;
      }
      
      console.log("Game started successfully");
      return true;
    } catch (err) {
      console.error("Error in startGame:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [user, roomId, waitingRoom, toast]);

  return {
    waitingRoom,
    isLoading,
    isJoining,
    error,
    joinWaitingRoom,
    leaveWaitingRoom,
    startGame,
    refreshWaitingRoom
  };
}
