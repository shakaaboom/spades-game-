
import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface UseInitialJoinProps {
  roomId?: string;
  user: any; 
  initialized: boolean;
  profileReady: boolean;
  setInitialized: (value: boolean) => void;
  joinWaitingRoom: (roomId: string) => Promise<boolean>;
  refreshWaitingRoom: () => Promise<void>;
}

export const useInitialJoin = ({
  roomId,
  user,
  initialized,
  profileReady,
  setInitialized,
  joinWaitingRoom,
  refreshWaitingRoom
}: UseInitialJoinProps) => {
  const { toast } = useToast();
  
  // Handle initial join on component mount
  useEffect(() => {
    if (roomId && user && !initialized && profileReady) {
      console.log("Initial join attempt for room:", roomId, "user:", user.id);
      
      const initialJoin = async () => {
        try {
          const joinSuccess = await joinWaitingRoom(roomId);
          console.log("Initial join result:", joinSuccess);
          
          if (joinSuccess) {
            await refreshWaitingRoom();
            console.log("Initial join completed and room refreshed");
          } else {
            console.error("Failed to join room:", roomId);
            toast({
              title: "Error",
              description: "Failed to join waiting room",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Error in initial join:", error);
        } finally {
          setInitialized(true);
        }
      };
      
      initialJoin();
    } else if (user && !initialized && profileReady) {
      setInitialized(true);
    }
  }, [roomId, user, initialized, profileReady, joinWaitingRoom, refreshWaitingRoom, setInitialized, toast]);
  
  return {};
};
