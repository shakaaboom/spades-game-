import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WaitingRoomState, GameData } from "@/types/waiting-room";
import { User } from "@supabase/supabase-js";

interface UseRoomDataProps {
  roomId?: string;
  user: User | null;
  profile: any;
}

export const useRoomData = ({ roomId, user, profile }: UseRoomDataProps) => {
  const [waitingRoom, setWaitingRoom] = useState<WaitingRoomState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [channels]);

  useEffect(() => {
    console.log("useRoomData effect triggered with roomId:", roomId, "and user:", user?.id);
    
    if (!roomId || !user) {
      console.log("Missing roomId or user - skipping fetch", { roomId, userId: user?.id });
      setIsLoading(false);
      return;
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId)) {
      console.error("Invalid roomId format:", roomId);
      toast({
        title: "Error",
        description: "Invalid waiting room ID format",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    const fetchAndSubscribe = async () => {
      setIsLoading(true);
      console.log("Fetching game data for room:", roomId);
      
      try {
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', roomId)
          .maybeSingle();
          
        if (gameError || !gameData) {
          console.error("Error fetching game:", gameError);
          toast({
            title: "Error",
            description: "Could not find the waiting room",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        console.log("Game data fetched successfully:", gameData);

        console.log("Fetching player data with profiles...");
        const { data: playersData, error: playersError } = await supabase
          .from('game_players')
          .select(`
            *,
            profiles(id, username, avatar_url)
          `)
          .eq('game_id', roomId);

        if (playersError) {
          console.error("Error fetching players:", playersError);
          setIsLoading(false);
          return;
        }

        console.log("Raw player data with profiles:", JSON.stringify(playersData, null, 2));

        const players = playersData.map((player: any) => {
          const profileData = player.profiles;
          
          console.log(`Processing player ${player.user_id}, profile data:`, 
            JSON.stringify(profileData, null, 2));
          
          let username = 'Unknown Player';
          let avatarUrl = '';
          
          if (Array.isArray(profileData) && profileData.length > 0) {
            username = profileData[0].username || 'Unknown Player';
            avatarUrl = profileData[0].avatar_url || '';
          } else if (profileData && typeof profileData === 'object') {
            username = profileData.username || 'Unknown Player';
            avatarUrl = profileData.avatar_url || '';
          }
          
          if (player.user_id === user.id && profile) {
            if (profile.username) {
              username = profile.username;
              console.log(`Using current user profile name: ${username}`);
            }
            if (profile.avatar_url) {
              avatarUrl = profile.avatar_url;
            }
          } else {
            console.log(`Using fetched profile name for ${player.user_id}: ${username}`);
          }
          
          if (username === 'Unknown Player' && player.user_id) {
            const shortId = player.user_id.split('-')[0];
            username = `Player_${shortId}`;
            console.log(`Generated fallback name: ${username}`);
          }
          
          return {
            id: player.user_id,
            name: username,
            avatar: avatarUrl,
            isReady: player.is_ready,
            isHost: player.user_id === gameData.created_by,
            position: player.position
          };
        });

        console.log("Processed players with names:", players.map(p => ({ id: p.id, name: p.name })));

        const validStatus = gameData.status as 'setup' | 'waiting' | 'starting' | 'in_progress';
        const typedGameData = gameData as GameData;

        setWaitingRoom({
          id: typedGameData.id,
          status: validStatus,
          players,
          gameMode: typedGameData.mode,
          gameType: typedGameData.type || 'solo',
          wagerAmount: typedGameData.wager_amount || 0,
          createdAt: new Date(typedGameData.created_at)
        });

        const roomChannel = supabase
          .channel(`room-${roomId}`)
          .on('presence', { event: 'sync' }, () => {
            console.log('Presence state synced:', roomChannel.presenceState());
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('User joined:', key, newPresences);
            toast({
              title: "Player joined",
              description: `${newPresences[0]?.user_name || 'A player'} has joined the room`
            });
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('User left:', key, leftPresences);
            toast({
              title: "Player left",
              description: `${leftPresences[0]?.user_name || 'A player'} has left the room`
            });
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await roomChannel.track({
                user_id: user.id,
                user_name: profile?.username || user.email?.split('@')[0] || 'Guest',
                online_at: new Date().toISOString(),
                ready: false
              });
            }
          });

        const dbChangesChannel = supabase
          .channel('room-db-changes')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public',
            table: 'games',
            filter: `id=eq.${roomId}` 
          }, (payload) => {
            console.log('Game updated:', payload);
            refreshWaitingRoom();
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'game_players',
            filter: `game_id=eq.${roomId}`
          }, (payload) => {
            console.log('Players updated:', payload);
            refreshWaitingRoom();
          })
          .subscribe();

        setChannels(prev => [...prev, roomChannel, dbChangesChannel]);
        setIsLoading(false);
      } catch (error) {
        console.error("Error setting up waiting room:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load waiting room data",
          variant: "destructive"
        });
      }
    };

    fetchAndSubscribe();
  }, [roomId, user, profile, toast]);

  const refreshWaitingRoom = async () => {
    if (!roomId || !user) {
      console.log("Can't refresh - missing roomId or userId", { roomId, userId: user?.id });
      return;
    }

    console.log("Refreshing waiting room data for room:", roomId, "user:", user.id);

    try {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();
        
      if (gameError || !gameData) {
        console.error("Error refreshing game:", gameError);
        return;
      }

      console.log("Game data refreshed successfully:", gameData);

      console.log("Refreshing player data with profiles...");
      const { data: playersData, error: playersError } = await supabase
        .from('game_players')
        .select(`
          *,
          profiles(id, username, avatar_url)
        `)
        .eq('game_id', roomId);

      if (playersError) {
        console.error("Error refreshing players:", playersError);
        return;
      }

      console.log("Refreshed raw player data with profiles:", JSON.stringify(playersData, null, 2));

      const players = playersData.map((player: any) => {
        const profileData = player.profiles;
        
        console.log(`Processing refreshed player ${player.user_id}, profile data:`, 
          JSON.stringify(profileData, null, 2));
        
        let username = 'Unknown Player';
        let avatarUrl = '';
        
        if (Array.isArray(profileData) && profileData.length > 0) {
          username = profileData[0].username || 'Unknown Player';
          avatarUrl = profileData[0].avatar_url || '';
        } else if (profileData && typeof profileData === 'object') {
          username = profileData.username || 'Unknown Player';
          avatarUrl = profileData.avatar_url || '';
        }
        
        if (player.user_id === user.id && profile) {
          if (profile.username) {
            username = profile.username;
            console.log(`Using current user profile name: ${username}`);
          }
          if (profile.avatar_url) {
            avatarUrl = profile.avatar_url;
          }
        } else {
          console.log(`Using fetched profile name for ${player.user_id}: ${username}`);
        }
        
        if (username === 'Unknown Player' && player.user_id) {
          const shortId = player.user_id.split('-')[0];
          username = `Player_${shortId}`;
          console.log(`Generated fallback name: ${username}`);
        }
        
        return {
          id: player.user_id,
          name: username,
          avatar: avatarUrl,
          isReady: player.is_ready,
          isHost: player.user_id === gameData.created_by,
          position: player.position
        };
      });

      console.log("Processed refreshed players with names:", players.map(p => ({ id: p.id, name: p.name })));

      const validStatus = gameData.status as 'setup' | 'waiting' | 'starting' | 'in_progress';
      const typedGameData = gameData as GameData;

      setWaitingRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: validStatus,
          players,
          gameType: typedGameData.type || 'solo',
          wagerAmount: typedGameData.wager_amount || 0
        };
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error refreshing waiting room:", error);
    }
  };

  return {
    waitingRoom,
    isLoading,
    channels,
    refreshWaitingRoom,
    setWaitingRoom
  };
};
