import { useState, useEffect, useMemo } from "react";
import LobbyHeader from "@/components/lobby/LobbyHeader";
import { OnlinePlayer } from "@/types/lobby";
import { useWebSocket } from "@/hooks/use-websocket";
import { LivePlayerCount } from "@/components/lobby/LivePlayerCount";
import { useViewportHeight } from "@/hooks/use-viewport-height";
import SimplifiedGameSelection from "@/components/lobby/SimplifiedGameSelection";
import LobbySidebar from "@/components/lobby/LobbySidebar";
import { GameTypePlayerCount } from "@/components/lobby/GameFilterBar";
import { useAuth } from "@/hooks/use-auth";
import CollapsibleChat from "@/components/chat/CollapsibleChat";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import useOnlinePlayers from "@/hooks/use-online-players";

const Lobby = () => {
  const { socket } = useWebSocket();
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminContact, setShowAdminContact] = useState(false);

  // Apply viewport height fix
  useViewportHeight();

  // Player counts by game type and wager amount
  const [playerCountsByType, setPlayerCountsByType] = useState<GameTypePlayerCount[]>([
    { mode: 'practice', type: 'solo', wagerAmount: 0, count: 0 },
    { mode: 'practice', type: 'partnered', wagerAmount: 0, count: 0 },
    { mode: 'real', type: 'solo', wagerAmount: 5, count: 0 },
    { mode: 'real', type: 'solo', wagerAmount: 10, count: 0 },
    { mode: 'real', type: 'solo', wagerAmount: 25, count: 0 },
    { mode: 'real', type: 'solo', wagerAmount: 50, count: 0 },
    { mode: 'real', type: 'solo', wagerAmount: 100, count: 0 },
    { mode: 'real', type: 'solo', wagerAmount: 250, count: 0 },
    { mode: 'real', type: 'partnered', wagerAmount: 5, count: 0 },
    { mode: 'real', type: 'partnered', wagerAmount: 10, count: 0 },
    { mode: 'real', type: 'partnered', wagerAmount: 25, count: 0 },
    { mode: 'real', type: 'partnered', wagerAmount: 50, count: 0 },
    { mode: 'real', type: 'partnered', wagerAmount: 100, count: 0 },
    { mode: 'real', type: 'partnered', wagerAmount: 250, count: 0 }
  ]);

  // Use the online players hook for consistent data
  const { onlinePlayers, totalOnlinePlayers } = useOnlinePlayers();

  // Fetch game statistics
  const fetchGameStats = async () => {
    try {
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('id, mode, type, wager_amount, game_players(user_id)')
        .in('status', ['waiting', 'in_progress']);

      if (gamesError) throw gamesError;

      // Process game data to update player counts
      const updatedCounts = [...playerCountsByType];
      
      if (gamesData) {
        gamesData.forEach(game => {
          const playerCount = Array.isArray(game.game_players) ? game.game_players.length : 0;
          
          // Find matching game type entry and update count
          const index = updatedCounts.findIndex(item => 
            item.mode === game.mode && 
            item.type === game.type && 
            item.wagerAmount === game.wager_amount
          );
          
          if (index !== -1) {
            updatedCounts[index].count += playerCount;
          }
        });
      }
      
      setPlayerCountsByType(updatedCounts);
    } catch (error) {
      console.error("Error fetching game statistics:", error);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchGameStats();
    // No need to fetch online players here, handled by hook
    
    // Refresh data periodically
    const refreshInterval = setInterval(() => {
      fetchGameStats();
    }, 60000); // Every minute
    
    return () => clearInterval(refreshInterval);
  }, [user, profile]);

  // Handle contacting admin
  const handleContactAdmin = () => {
    setShowAdminContact(true);
  };

  return (
    <Layout onContactAdmin={handleContactAdmin}>
      <div className="py-6">
        <div className="container">
          <LobbyHeader />
          
          <div className="mb-4">
            <LivePlayerCount />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
            <SimplifiedGameSelection />
            <LobbySidebar 
              onlinePlayers={onlinePlayers} 
              totalOnlinePlayers={totalOnlinePlayers} 
            />
          </div>
        </div>
        <CollapsibleChat adminContact={showAdminContact} />
      </div>
    </Layout>
  );
};

export default Lobby;