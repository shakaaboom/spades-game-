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

  // Online players state
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [totalOnlinePlayers, setTotalOnlinePlayers] = useState(0);

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

  // Fetch online players
  const fetchOnlinePlayers = async () => {
    try {
      setIsLoading(true);
      
      // First, get active players from game_players table
      const { data: activePlayers, error: activePlayersError } = await supabase
        .from('game_players')
        // .select('user_id, game_id')
        .select('user_id, game_id, games(status)')
        .in('games.status', ['waiting', 'in_progress'])
        .limit(20);

      if (activePlayersError) throw activePlayersError;
      
      // Fetch user profile data for active players
      const activePlayersList: OnlinePlayer[] = [];
      const processedUserIds = new Set<string>();
      
      if (activePlayers && activePlayers.length > 0) {
        // Get unique user IDs
        const userIds = activePlayers
          .filter(player => player.user_id)
          .map(player => player.user_id) as string[];
          
        if (userIds.length > 0) {
          // Fetch profiles for these users
          const { data: playerProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, rating')
            .in('id', userIds);
            
          if (profilesError) throw profilesError;
          
          if (playerProfiles) {
            playerProfiles.forEach(profile => {
              if (!processedUserIds.has(profile.id)) {
                processedUserIds.add(profile.id);
                activePlayersList.push({
                  id: profile.id,
                  name: profile.username || 'Unknown Player',
                  avatar: profile.avatar_url || '',
                  rating: profile.rating || 1000,
                  status: 'in-game'
                });
              }
            });
          }
        }
      }
      
      // Fetch recent profiles for "online" users
      const { data: recentProfiles, error: recentProfilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, rating')
        .order('updated_at', { ascending: false })
        .limit(30);
        
      if (recentProfilesError) throw recentProfilesError;
      
      // Add other recent profiles as "online" users
      if (recentProfiles) {
        recentProfiles.forEach(profile => {
          if (!processedUserIds.has(profile.id)) {
            processedUserIds.add(profile.id);
            activePlayersList.push({
              id: profile.id,
              name: profile.username || 'Unknown Player',
              avatar: profile.avatar_url || '',
              rating: profile.rating || 1000,
              status: 'online'
            });
          }
        });
      }
      
      // Add current user to online players list if authenticated
      if (user && profile && !processedUserIds.has(user.id)) {
        activePlayersList.unshift({
          id: user.id,
          name: profile.username || user.email?.split('@')[0] || 'Anonymous',
          avatar: profile.avatar_url || '',
          rating: profile.rating || 1000,
          status: "online"
        });
      }
      
      setOnlinePlayers(activePlayersList);
      setTotalOnlinePlayers(activePlayersList.length);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching online players:", error);
      setIsLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchGameStats();
    fetchOnlinePlayers();
    
    // Refresh data periodically
    const refreshInterval = setInterval(() => {
      fetchGameStats();
      fetchOnlinePlayers();
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
          <LobbyHeader 
            onlineCount={totalOnlinePlayers}
            onRefresh={() => {
              setIsLoading(true);
              Promise.all([fetchGameStats(), fetchOnlinePlayers()]);
            }}
            isLoading={isLoading}
          />
          
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