
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useFindRoom } from './use-find-room';
import { useCreateRoom } from './use-create-room';

interface UseRoomFinderProps {
  user: any;
  profile: any;
  joinWaitingRoom: (roomId: string) => Promise<boolean>;
}

export const useRoomFinder = ({
  user,
  profile,
  joinWaitingRoom
}: UseRoomFinderProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();
  
  const { findAvailableRoom } = useFindRoom({ user, joinWaitingRoom });
  const { createNewRoom } = useCreateRoom({ user });

  // Function to find an available room or create a new one
  const findOrCreateRoom = useCallback(async (gameType: string): Promise<string | null> => {
    if (!user) {
      console.error("Cannot find/create room - no user logged in");
      toast({
        title: "Authentication Required",
        description: "Please sign in to play games",
        variant: "destructive"
      });
      return null;
    }

    setIsJoining(true);
    
    try {
      // First look for an available game in practice mode
      const joinableGameId = await findAvailableRoom(gameType, 'practice', 0);
      
      if (joinableGameId) {
        console.log("Found existing room to join:", joinableGameId);
        
        // Join the room
        const success = await joinWaitingRoom(joinableGameId);
        
        if (success) {
          console.log("Successfully joined existing room:", joinableGameId);
          setIsJoining(false);
          return joinableGameId;
        } else {
          console.error("Failed to join room:", joinableGameId);
          setIsJoining(false);
          return null;
        }
      } else {
        console.log("No suitable existing game found, creating new game");
        // Create a new game in practice mode
        const newGameId = await createNewRoom(gameType, 'practice', 0);
        
        if (!newGameId) {
          console.error("Failed to create new game");
          setIsJoining(false);
          return null;
        }
        
        console.log("Created new room:", newGameId);
        
        // Now join the room
        const success = await joinWaitingRoom(newGameId);
        
        if (success) {
          console.log("Successfully joined newly created room:", newGameId);
          setIsJoining(false);
          return newGameId;
        } else {
          console.error("Failed to join room:", newGameId);
          setIsJoining(false);
          return null;
        }
      }
    } catch (error) {
      console.error("Error in findOrCreateRoom:", error);
      setIsJoining(false);
      return null;
    }
  }, [user, findAvailableRoom, createNewRoom, joinWaitingRoom, toast]);

  // Function to join a game with specific settings
  const joinGameTable = useCallback(async (
    gameType: string, 
    gameMode: 'practice' | 'real',
    wagerAmount: number
  ): Promise<string | null> => {
    if (!user) {
      console.error("Cannot join game - no user logged in");
      toast({
        title: "Authentication Required",
        description: "Please sign in to play games",
        variant: "destructive"
      });
      return null;
    }

    console.log("Joining game with parameters:", {
      gameType,
      gameMode,
      wagerAmount
    });

    setIsJoining(true);
    
    try {
      // First check if there's an existing game with these settings
      const joinableGameId = await findAvailableRoom(gameType, gameMode, wagerAmount);
      
      if (joinableGameId) {
        console.log("Found existing room to join:", joinableGameId);
        
        // Join the existing room
        const success = await joinWaitingRoom(joinableGameId);
        
        if (success) {
          console.log("Successfully joined existing room:", joinableGameId);
          setIsJoining(false);
          return joinableGameId;
        } else {
          console.error("Failed to join room:", joinableGameId);
          setIsJoining(false);
          return null;
        }
      } else {
        console.log("No suitable existing game found, creating new game");
        // Create a new game with the specified parameters
        const newGameId = await createNewRoom(gameType, gameMode, wagerAmount);
        
        if (!newGameId) {
          console.error("Failed to create new game");
          setIsJoining(false);
          return null;
        }
        
        console.log("Created new room:", newGameId);
        
        // Now join the room
        const success = await joinWaitingRoom(newGameId);
        
        if (success) {
          console.log("Successfully joined newly created room:", newGameId);
          setIsJoining(false);
          return newGameId;
        } else {
          console.error("Failed to join room:", newGameId);
          setIsJoining(false);
          return null;
        }
      }
    } catch (error) {
      console.error("Error in joinGameTable:", error);
      setIsJoining(false);
      return null;
    }
  }, [user, findAvailableRoom, createNewRoom, joinWaitingRoom, toast]);

  return {
    isJoining,
    findOrCreateRoom,
    joinGameTable
  };
};
