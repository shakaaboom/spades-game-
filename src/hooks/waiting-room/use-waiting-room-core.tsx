
import { useState, useCallback } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useRoomData } from "@/hooks/waiting-room/use-room-data";
import { useRoomActions } from "@/hooks/waiting-room/use-room-actions";
import { useRoomFinder } from "@/hooks/waiting-room/use-room-finder";
import { WaitingRoomState } from "@/types/waiting-room";

interface UseWaitingRoomCoreProps {
  roomId?: string;
  mode?: 'practice' | 'real';
  gameType?: 'solo' | 'partnered';
  wagerAmount?: number;
}

export const useWaitingRoomCore = ({ 
  roomId, 
  mode, 
  gameType, 
  wagerAmount 
}: UseWaitingRoomCoreProps = {}) => {
  const { user, profile } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileRefreshAttempted, setProfileRefreshAttempted] = useState(false);
  
  console.log("useWaitingRoomCore initialized with:", { 
    roomId: roomId || 'undefined',
    mode: mode || 'undefined', 
    gameType: gameType || 'undefined',
    wagerAmount: wagerAmount !== undefined ? wagerAmount : 'undefined'
  });
  
  console.log("Current user info:", { 
    userId: user?.id, 
    username: profile?.username || user?.email,
    profileLoaded: !!profile
  });

  return {
    user,
    profile,
    roomId,
    mode,
    gameType,
    wagerAmount,
    initialized,
    setInitialized,
    profileReady,
    setProfileReady,
    profileRefreshAttempted,
    setProfileRefreshAttempted
  };
};
