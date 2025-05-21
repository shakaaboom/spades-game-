import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, RefreshCw, Wallet } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useMediaQuery } from "@/hooks/use-media-query";

const ACTIVE_PLAYER_THRESHOLD = 60000; // 1 minute in milliseconds

const LobbyHeader = () => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const fetchOnlineCount = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, is_online, last_active_at");

        if (error) throw error;

        // Filter for truly active users
        const now = new Date().getTime();
        const activeCount = data?.filter(player => {
          const lastActiveTime = player.last_active_at ? new Date(player.last_active_at).getTime() : 0;
          return player.is_online && (now - lastActiveTime < ACTIVE_PLAYER_THRESHOLD);
        }).length || 0;

        setOnlineCount(activeCount);
      } catch (error) {
        console.error("❌ Error fetching online player count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnlineCount();

    // Set up periodic refresh
    const refreshInterval = setInterval(fetchOnlineCount, 30000); // Refresh every 30 seconds

    const subscription = supabase
      .channel("realtime-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchOnlineCount();
      })
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 md:mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Game Lobby</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Join an existing table to play
        </p>
      </div>

      <div className="mt-3 lg:mt-0 flex flex-wrap items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-secondary dark:bg-secondary/40 rounded-lg px-3 py-1 text-sm flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span>
                  <span className="font-medium">{onlineCount}</span> {!isMobile && "Players Online"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of players currently online</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 500);
                }}
                variant="ghost"
                size="icon"
                aria-label="Refresh tables"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh game tables</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Link to="/wallet" className="ml-auto md:ml-0">
          <Button variant="outline" size="sm">
            <Wallet className="h-4 w-4 mr-2" />
            Wallet
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LobbyHeader;
