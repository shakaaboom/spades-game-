import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const ACTIVE_PLAYER_THRESHOLD = 60000; // 1 minute in milliseconds

export const LivePlayerCount = () => {
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [tableCount, setTableCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch users with their last activity time
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, is_online, last_active_at");
        
        if (profilesError) throw profilesError;

        // Filter for truly active users
        const now = new Date().getTime();
        const activeCount = profilesData?.filter(player => {
          const lastActiveTime = player.last_active_at ? new Date(player.last_active_at).getTime() : 0;
          return player.is_online && (now - lastActiveTime < ACTIVE_PLAYER_THRESHOLD);
        }).length || 0;

        // Fetch active games
        const { data: gamesData, error: gamesError } = await supabase
          .from("games")
          .select("id")
          .in("status", ["waiting", "in_progress"]);
        
        if (gamesError) throw gamesError;

        setPlayerCount(activeCount);
        setTableCount(gamesData?.length || 0);
      } catch (error) {
        console.error("❌ Error fetching live counts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts(); // Fetch initial data

    // Set up periodic refresh
    const refreshInterval = setInterval(fetchCounts, 30000); // Refresh every 30 seconds

    // Subscribe to Supabase Realtime updates
    const subscription = supabase
      .channel("realtime-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchCounts(); // Refresh the count
      })
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(subscription); // Cleanup on unmount
    };
  }, []);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">Live Players:</span>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 font-semibold animate-pulse-subtle"
            >
              {isLoading ? "..." : playerCount}
            </Badge>
          </div>
          {/* <div>
            <Badge variant="secondary">
              {isLoading ? "..." : tableCount} 
            </Badge>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
};
