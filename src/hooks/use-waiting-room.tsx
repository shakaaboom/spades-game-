
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWaitingRoomCore } from './waiting-room/use-waiting-room-core';
import { useProfileCheck } from './waiting-room/use-profile-check';
import { useJoinWaitingRoom } from './waiting-room/use-join-waiting-room';
import { useGameStatus } from './waiting-room/use-game-status';
import { useInitialJoin } from './waiting-room/use-initial-join';
import { useRoomData } from '@/hooks/waiting-room/use-room-data';
import { useRoomActions } from '@/hooks/waiting-room/use-room-actions';
import { useRoomFinder } from '@/hooks/waiting-room/use-room-finder';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UseWaitingRoomProps, WaitingRoomState } from "@/types/waiting-room";

export type { WaitingRoomPlayer, WaitingRoomState } from "@/types/waiting-room";

export const useWaitingRoom = (props: UseWaitingRoomProps = {}) => {
  const { roomId, mode, gameType, wagerAmount } = props;
  const core = useWaitingRoomCore(props);
  const { user, profile, initialized, setInitialized, profileReady, setProfileReady, profileRefreshAttempted, setProfileRefreshAttempted } = core;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isValidRoomId = roomId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
  const validatedRoomId = isValidRoomId ? roomId : undefined;
  
  const { refreshProfile } = useProfileCheck({
    user,
    profile,
    profileRefreshAttempted,
    setProfileRefreshAttempted,
    setProfileReady
  });

  const { 
    waitingRoom, 
    isLoading, 
    channels, 
    refreshWaitingRoom,
    setWaitingRoom
  } = useRoomData({ 
    roomId: validatedRoomId, 
    user, 
    profile 
  });

  const { joinWaitingRoom: memoizedJoinWaitingRoom } = useJoinWaitingRoom({
    user,
    profile,
    refreshProfile,
    refreshWaitingRoom
  });

  const {
    isLeaving,
    leaveWaitingRoom,
    setPlayerReady,
    startGame,
    joinWaitingRoom: handleJoinWaitingRoom
  } = useRoomActions({ 
    roomId: validatedRoomId, 
    user, 
    waitingRoom, 
    channels,
    refreshWaitingRoom,
    joinWaitingRoomFn: memoizedJoinWaitingRoom
  });

  const {
    isJoining,
    findOrCreateRoom,
    joinGameTable
  } = useRoomFinder({ 
    user,
    profile,
    joinWaitingRoom: memoizedJoinWaitingRoom
  });

  useGameStatus({
    waitingRoom,
    user,
    initialized,
    profileReady,
    roomId,
    joinWaitingRoom: memoizedJoinWaitingRoom,
    refreshWaitingRoom
  });

  useInitialJoin({
    roomId,
    user,
    initialized,
    profileReady,
    setInitialized,
    joinWaitingRoom: memoizedJoinWaitingRoom,
    refreshWaitingRoom
  });

  console.log("useWaitingRoom initialized with parameters:", {
    roomId: roomId || "undefined",
    mode: mode || "undefined",
    gameType: gameType || "undefined",
    wagerAmount: wagerAmount !== undefined ? wagerAmount : "undefined",
  });

  useEffect(() => {
    // Check for valid game modes in development mode
    if (process.env.NODE_ENV === 'development') {
      const checkModeConstraint = async () => {
        try {
          // Simplified approach - just fetch some sample games to see their modes
          const { data, error } = await supabase
            .from('games')
            .select('mode')
            .limit(10);
          
          if (error) {
            console.error("Error fetching game modes:", error);
            return;
          }
          
          console.log("Existing game modes in database:", data.map(game => game.mode));
        } catch (e) {
          console.error("Debug check failed:", e);
        }
      };
      
      checkModeConstraint();
    }
  }, []);

  const joinWaitingRoom = async (targetRoomId: string): Promise<boolean> => {
    console.log("Combined joinWaitingRoom called with:", targetRoomId);
    
    if (!targetRoomId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetRoomId)) {
      console.error("Invalid room ID format:", targetRoomId);
      toast({
        title: "Invalid Room ID", 
        description: "The room ID format is not valid",
        variant: "destructive"
      });
      return false;
    }
    
    if (user && !profile) {
      console.log("Profile not loaded yet, refreshing before join...");
      const profileData = await refreshProfile();
      if (!profileData) {
        console.error("Profile still not available after refresh");
        toast({
          title: "Profile Error", 
          description: "Unable to load your profile data",
          variant: "destructive"
        });
        return false;
      }
    }
    
    const directJoinResult = await memoizedJoinWaitingRoom(targetRoomId);
    
    if (directJoinResult) {
      console.log("Direct DB join succeeded");
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Direct DB join failed, trying handler method");
    return await handleJoinWaitingRoom(targetRoomId);
  };

  return {
    waitingRoom,
    isLoading,
    isJoining,
    isLeaving,
    joinGameTable,
    joinWaitingRoom,
    leaveWaitingRoom,
    setPlayerReady,
    startGame,
    refreshWaitingRoom,
    findOrCreateRoom
  };
};
