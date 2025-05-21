import { useEffect } from "react";
import { Users, MessageSquare, UserCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import useOnlinePlayers from "@/hooks/use-online-players";
import { OnlinePlayer } from "@/types/lobby";

const ACTIVE_PLAYER_THRESHOLD = 60000; // 1 minute in milliseconds

const OnlinePlayersList = () => {
  const { onlinePlayers, totalOnlinePlayers, fetchOnlinePlayers } = useOnlinePlayers();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Initial fetch
    fetchOnlinePlayers();

    // Set up periodic refresh
    const refreshInterval = setInterval(fetchOnlinePlayers, 30000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchOnlinePlayers]);

  const handleMessagePlayer = (playerName: string) => {
    toast({
      title: "Message Feature Coming Soon",
      description: `You'll be able to message ${playerName} directly soon!`,
    });
  };

  const handleViewAllPlayers = () => {
    toast({
      title: "Coming Soon",
      description: "The full player directory will be available in a future update!",
    });
  };

  const getStatusColor = (status: OnlinePlayer["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "in-game":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: OnlinePlayer["status"]) => {
    switch (status) {
      case "online":
        return "Online";
      case "in-game":
        return "In Game";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="border border-border bg-card rounded-lg shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          <span>Online Players</span>
        </div>
        <span className="text-sm font-normal text-muted-foreground">
          {totalOnlinePlayers} online
        </span>
      </h3>

      <ScrollArea className="h-[320px] md:h-[360px] pr-4">
        {onlinePlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <UserCircle className="h-12 w-12 mb-2 opacity-50" />
            <p>No players online right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {onlinePlayers.map((player) => {
              const isCurrentUser = user && player.id === user.id;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between border-b border-border/40 pb-3 ${
                    isCurrentUser ? "bg-primary/5 -mx-2 px-2 rounded-md" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="font-medium text-sm">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center">
                        <p className="font-medium text-sm truncate max-w-[100px] md:max-w-full">
                          {player.name}
                          {isCurrentUser && <span className="ml-1 text-xs">(You)</span>}
                        </p>
                        <span
                          className={`inline-block w-2 h-2 rounded-full ml-2 ${getStatusColor(player.status)}`}
                        ></span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        Rating: {player.rating ?? "N/A"}
                        <span className="ml-2 text-xs capitalize">
                          {getStatusText(player.status)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMessagePlayer(player.name)}
                    disabled={isCurrentUser}
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="mt-4 md:mt-6 text-center">
        <Button variant="outline" size="sm" className="w-full" onClick={handleViewAllPlayers}>
          <Users className="h-4 w-4 mr-2" />
          View All Players
        </Button>
      </div>
    </div>
  );
};

export default OnlinePlayersList;
