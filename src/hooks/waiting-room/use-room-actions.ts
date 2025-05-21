
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WaitingRoomState } from "@/types/waiting-room";
import { User } from "@supabase/supabase-js";
import { v4 as uuidv4 } from 'uuid';

interface UseRoomActionsProps {
  roomId?: string;
  user: User | null;
  waitingRoom: WaitingRoomState | null;
  channels: any[];
  refreshWaitingRoom: () => Promise<void>;
  joinWaitingRoomFn: (roomId: string) => Promise<boolean>;
}

export const useRoomActions = ({ 
  roomId, 
  user, 
  waitingRoom, 
  channels, 
  refreshWaitingRoom,
  joinWaitingRoomFn
}: UseRoomActionsProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const { toast } = useToast();

  const leaveWaitingRoom = async (): Promise<boolean> => {
    if (!roomId || !user) {
      console.error("Cannot leave room - missing roomId or userId");
      return false;
    }

    setIsLeaving(true);
    console.log("Leaving room:", roomId, "User:", user.id);
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      
      const playerName = profileData?.username || user.email?.split('@')[0] || 'Unknown Player';
      
      await supabase
        .from('game_player_events')
        .insert({
          game_id: roomId,
          player_id: user.id,
          player_name: playerName,
          event_type: 'leave'
        });
      
      const { error } = await supabase
        .from('game_players')
        .delete()
        .eq('game_id', roomId)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error leaving waiting room:", error);
        toast({
          title: "Error",
          description: "Failed to leave the waiting room",
          variant: "destructive"
        });
        setIsLeaving(false);
        return false;
      }

      channels.forEach(channel => supabase.removeChannel(channel));
      setIsLeaving(false);
      return true;
    } catch (error) {
      console.error("Error in leaveWaitingRoom:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      setIsLeaving(false);
      return false;
    }
  };

  const setPlayerReady = async (isReady: boolean): Promise<boolean> => {
    if (!roomId || !user) {
      console.error("Cannot set ready status - missing roomId or userId");
      return false;
    }

    console.log("Setting player ready status:", isReady, "for user:", user.id, "in room:", roomId);
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      
      const playerName = profileData?.username || user.email?.split('@')[0] || 'Unknown Player';
      
      await supabase
        .from('game_player_events')
        .insert({
          game_id: roomId,
          player_id: user.id,
          player_name: playerName,
          event_type: isReady ? 'ready' : 'unready'
        });
      
      const { error } = await supabase
        .from('game_players')
        .update({ is_ready: isReady })
        .eq('game_id', roomId)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error setting player ready status:", error);
        toast({
          title: "Error",
          description: "Failed to update ready status",
          variant: "destructive"
        });
        return false;
      }

      await refreshWaitingRoom();
      return true;
    } catch (error) {
      console.error("Error in setPlayerReady:", error);
      return false;
    }
  };

  const startGame = async () => {
    if (!user || !roomId || !waitingRoom) {
      console.error("Cannot start game - missing required data", { userId: user?.id, roomId, hasWaitingRoom: !!waitingRoom });
      return false;
    }

    console.log("Attempting to start game for room", roomId);

    const isHost = waitingRoom.players.find(p => p.id === user.id)?.isHost;
    if (!isHost) {
      console.log("User is not host, cannot start game");
      toast({
        title: "Permission Denied",
        description: "Only the host can start the game",
        variant: "destructive"
      });
      return false;
    }

    const allReady = waitingRoom.players.every(p => p.isReady);
    if (!allReady) {
      console.log("Not all players are ready");
      toast({
        title: "Players Not Ready",
        description: "All players must be ready to start the game",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'in_progress',
          current_phase: 'playing'
        })
        .eq('id', roomId);

      if (error) {
        console.error("Error starting game:", error);
        return false;
      }

      console.log("Successfully started game");
      return true;
    } catch (error) {
      console.error("Error starting game:", error);
      return false;
    }
  };

  const joinWaitingRoom = async (targetRoomId: string): Promise<boolean> => {
    if (isJoining) return false;
    
    setIsJoining(true);
    try {
      const success = await joinWaitingRoomFn(targetRoomId);
      
      if (success && user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        const playerName = profileData?.username || user.email?.split('@')[0] || 'Unknown Player';
        
        await supabase
          .from('game_player_events')
          .insert({
            game_id: targetRoomId,
            player_id: user.id,
            player_name: playerName,
            event_type: 'join'
          });
      }
      
      setIsJoining(false);
      return success;
    } catch (error) {
      console.error("Error in joinWaitingRoom:", error);
      setIsJoining(false);
      return false;
    }
  };

  return {
    isJoining,
    isLeaving,
    leaveWaitingRoom,
    setPlayerReady,
    startGame,
    joinWaitingRoom
  };
};
