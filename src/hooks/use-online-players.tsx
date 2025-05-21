import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OnlinePlayer } from "@/types/lobby";
import { useAuth } from "@/hooks/use-auth";

const ACTIVE_PLAYER_THRESHOLD = 60000; // 1 minute in milliseconds - match the threshold from use-online-status

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  rating: number | null;
  is_online: boolean;
  last_active_at: string | null;
  email?: string;
}

const useOnlinePlayers = () => {
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [totalOnlinePlayers, setTotalOnlinePlayers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Function to fetch only truly active users
  const fetchOnlinePlayers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, rating, is_online, last_active_at, email")
        .order("last_active_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter out inactive players
      const now = new Date().getTime();
      const activePlayers = (data || []).filter((player: ProfileData) => {
        const lastActiveTime = player.last_active_at ? new Date(player.last_active_at).getTime() : 0;
        const isActive = player.is_online && (now - lastActiveTime < ACTIVE_PLAYER_THRESHOLD);
        
        // Include the player if they're active OR if they're the current user
        return isActive || (user && player.id === user.id);
      }).map((player: ProfileData): OnlinePlayer => ({
        id: player.id,
        name: player.email || player.username || 'Anonymous',
        avatar: player.avatar_url || "",
        rating: player.rating || 0,
        status: player.is_online && (now - (player.last_active_at ? new Date(player.last_active_at).getTime() : 0) < ACTIVE_PLAYER_THRESHOLD) 
          ? "online" 
          : "in-game",
        lastActive: player.last_active_at ? new Date(player.last_active_at) : undefined
      }));

      // Sort players: current user first, then online players, then away players
      const sortedPlayers = activePlayers.sort((a, b) => {
        // Current user always comes first
        if (user && a.id === user.id) return -1;
        if (user && b.id === user.id) return 1;
        
        // Then sort by status (online before in-game)
        if (a.status === "online" && b.status === "in-game") return -1;
        if (a.status === "in-game" && b.status === "online") return 1;
        
        // Finally sort by last active time
        const aTime = a.lastActive?.getTime() || 0;
        const bTime = b.lastActive?.getTime() || 0;
        return bTime - aTime;
      });

      setOnlinePlayers(sortedPlayers);
      // Only count truly online players for the total
      setTotalOnlinePlayers(sortedPlayers.filter(p => p.status === "online").length);
    } catch (error) {
      console.error("Error fetching online players:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time subscription and periodic refresh
  useEffect(() => {
    fetchOnlinePlayers(); // Initial fetch

    // Set up periodic refresh
    const refreshInterval = setInterval(fetchOnlinePlayers, 30000); // Refresh every 30 seconds

    const subscription = supabase
      .channel("online-users")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          // Instead of trying to manage the state directly,
          // just refetch the whole list when any change occurs
          fetchOnlinePlayers();
        }
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(subscription);
    };
  }, [user]); // Add user to dependencies

  return {
    onlinePlayers,
    totalOnlinePlayers,
    isOnlinePlayerLoading: isLoading,
    fetchOnlinePlayers,
  };
};

export default useOnlinePlayers;
