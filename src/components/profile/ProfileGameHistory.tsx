import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, User, DollarSign, CalendarDays } from "lucide-react";

const fetchGameHistory = async (playerId: string) => {
  try {
    const { data, error } = await supabase
    .from("game_players")
    .select(`
      game_id,
      scores,
      team_id,
      games(status, mode, created_at, wager_amount,current_phase),
      game_rounds(winner_id, status)
    `)
    .eq("user_id", playerId);
  

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching game history:", error);
    return [];
  }
};






const ProfileGameHistory = ({ playerId }: { playerId: string }) => {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (playerId) {
      fetchGameHistory(playerId).then((data) => {
        setGames(data);
        setLoading(false);
      });
    }
  }, [playerId]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Games</CardTitle>
        <CardDescription>Your game history and results</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading game history...</p>
        ) : games.length > 0 ? (
          <div className="space-y-4">
            {games.map((game) => (
              <div 
                key={game.game_id} 
                className="border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between"
              >
                <div className="flex-grow mb-2 sm:mb-0">
                  <div className="flex items-center mb-2">
                    {game.games?.mode === "solo" ? (
                      <User className="h-5 w-5 text-primary mr-2" />
                    ) : (
                      <Users className="h-5 w-5 text-primary mr-2" />
                    )}
                    <h3 className="font-medium">
                      {game.games?.mode === "solo" ? "Solo Spades" : "Partnered Spades"}
                    </h3>
                    <Badge 
                      className={`ml-2 ${
                        game.games?.result === "win" 
                          ? "bg-green-500 hover:bg-green-600" 
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {game.games?.current_phase?.toUpperCase() || "UNKNOWN"}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-y-1">
                    <div className="flex items-center mr-3">
                      <DollarSign className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      <span className={game.games?.wager_amount > 0 ? "text-green-500" : "text-red-500"}>
                        {game.games?.wager_amount > 0 ? "+" : ""}
                        {game.games?.wager_amount?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex items-center mr-3">
                      <CalendarDays className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      <span>{game.games?.created_at ? formatDate(game.games.created_at) : "Unknown Date"}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm mt-2">
  <span className="font-medium">Score:</span> {game.scores ? Object.entries(game.scores).map(([round, score]) => `${round}: ${score}`).join(", ") : "N/A"}
</p>

                  
                  {game.games?.mode === "partnered" && (
                    <p className="text-sm">
                      <span className="font-medium">Partner:</span> {game.games?.partner || "N/A"}
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Against:</span> {game.games?.opponents?.join(", ") || "N/A"}
                  </p>
                </div>
                
                <Button variant="ghost" size="sm" className="shrink-0">
                  Details <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p>No games found</p>
        )}
        
        <div className="mt-4 text-center">
          <Button variant="outline">
            View All Games <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileGameHistory;
