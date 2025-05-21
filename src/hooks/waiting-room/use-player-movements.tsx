
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PlayerMovement } from "@/components/waiting-room/PlayerMovementItem";

export const usePlayerMovements = (roomId: string) => {
  const [movements, setMovements] = useState<PlayerMovement[]>([]);
  
  useEffect(() => {
    // Subscribe to player events through the game_player_events table
    const channel = supabase
      .channel(`room-${roomId}-player-events`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_player_events',
        filter: `game_id=eq.${roomId}`
      }, (payload) => {
        console.log("New player event:", payload);
        const event = payload.new as any;
        
        const newMovement: PlayerMovement = {
          id: event.id,
          type: event.event_type as 'join' | 'leave' | 'ready' | 'unready',
          playerName: event.player_name,
          timestamp: new Date(event.created_at)
        };
        
        setMovements(prev => [...prev, newMovement]);
      })
      .subscribe();
    
    // Fetch initial player events
    fetchPlayerMovements();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);
  
  const fetchPlayerMovements = async () => {
    try {
      // Get the last 20 player events by timestamp
      const { data, error } = await supabase
        .from('game_player_events')
        .select(`
          id,
          event_type,
          player_name,
          created_at
        `)
        .eq('game_id', roomId)
        .order('created_at', { ascending: true })
        .limit(20);
      
      if (error) {
        console.error("Error fetching player movements:", error);
        return;
      }
      
      if (data) {
        const formattedMovements = data.map((event: any) => ({
          id: event.id,
          type: event.event_type as 'join' | 'leave' | 'ready' | 'unready',
          playerName: event.player_name,
          timestamp: new Date(event.created_at)
        }));
        
        setMovements(formattedMovements);
      }
    } catch (error) {
      console.error("Error in fetchPlayerMovements:", error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return { movements, formatTime };
};
