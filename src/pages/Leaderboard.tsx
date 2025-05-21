import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Clock, DollarSign, User, Award, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@supabase/supabase-js";
// Mock data for the leaderboard


type LeaderboardPeriod = "weekly" | "monthly" | "allTime";
type LeaderboardType = "winRate" | "balance" | "gamesPlayed";
type Player = {
  id: number;
  rank: number;
  username: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  avatarUrl: string;
  balance: number;
  isOnline: boolean;
  lastActiveAt: string;
};
// Create a Supabase client instance
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Leaderboard = () => {
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const [type, setType] = useState<LeaderboardType>("winRate");
  const [leaderboardData, setLeaderboardData] = useState<Player[]>([]);

    useEffect(() => {
      window.scrollTo(0, 0);
      const fetchLeaderboardData = async () => {
        let fromDate;
    
        if (period === "weekly") {
          fromDate = new Date();
          fromDate.setDate(fromDate.getDate() - 7);
        } else if (period === "monthly") {
          fromDate = new Date();
          fromDate.setMonth(fromDate.getMonth() - 1);
        }
    
        let query = supabase
          .from("profiles")
          .select("id, username, rating, games_played, games_won, avatar_url, balance, is_online, last_active_at, created_at, updated_at");
    
        if (fromDate) {
          query = query.gte("updated_at", fromDate.toISOString());
        }
    
        const { data, error } = await query;
    
        if (error) {
          console.error(error.message);
          return;
        }
    
        // Process data and compute winRate
        let processedData = data?.map((player: any) => ({
          ...player,
          avatarUrl: player.avatar_url,
          gamesPlayed: player.games_played,
          gamesWon: player.games_won,
          winRate: player.games_played > 0 ? (player.games_won / player.games_played) * 100 : 0,
          balance: player.balance,
          isOnline: player.is_online,
          lastActiveAt: player.last_active_at,
        })) || [];
    
        // Sort based on the selected type
        processedData = processedData.sort((a, b) => {
          if (type === "winRate") return b.winRate - a.winRate;
          if (type === "balance") return b.balance - a.balance;
          if (type === "gamesPlayed") return b.gamesPlayed - a.gamesPlayed;
          return 0;
        });
    
        // Assign rank after sorting
        processedData = processedData.map((player, idx) => ({
          ...player,
          rank: idx + 1,
        }));
    
        // Limit the data to the first 10 players
        const top10Players = processedData.slice(0, 10);
    
        setLeaderboardData(top10Players);
      };
    
      fetchLeaderboardData();
    }, [period, type]);
    
    
    
  

  return (
    <Layout>
      <div className="pt-4 pb-20 md:pb-6 px-2 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-3 md:mb-6">
            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-4">
              Leaderboard
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Top players ranked by performance
            </p>
          </div>

          {/* Period selection tabs - Better mobile spacing */}
          <div className="mb-3 md:mb-6">
            <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="weekly" className="text-xs md:text-sm py-1.5 px-1">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs md:text-sm py-1.5 px-1">Monthly</TabsTrigger>
                <TabsTrigger value="allTime" className="text-xs md:text-sm py-1.5 px-1">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Metric selection buttons - Mobile optimized */}
          <div className="grid grid-cols-3 gap-2 mb-3 md:mb-6">
            <Button 
              variant={type === "winRate" ? "default" : "outline"} 
              size="sm"
              onClick={() => setType("winRate")}
              className="text-xs md:text-sm h-9 px-1 md:px-3 w-full"
            >
              <TrendingUp className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1.5" />
              <span className="hidden md:inline">Win Rate</span>
              <span className="md:hidden">Win %</span>
            </Button>
            <Button 
              variant={type === "balance" ? "default" : "outline"} 
              size="sm"
              onClick={() => setType("balance")}
              className="text-xs md:text-sm h-9 px-1 md:px-3 w-full"
            >
              <DollarSign className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1.5" />
              <span className="hidden md:inline">Earnings</span>
              <span className="md:hidden">Earn $</span>
            </Button>
            <Button 
              variant={type === "gamesPlayed" ? "default" : "outline"} 
              size="sm"
              onClick={() => setType("gamesPlayed")}
              className="text-xs md:text-sm h-9 px-1 md:px-3 w-full"
            >
              <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1.5" />
              <span className="hidden md:inline">Games Played</span>
              <span className="md:hidden">Games</span>
            </Button>
          </div>

          {/* Mobile-optimized leaderboard */}
          <div className="bg-card rounded-xl shadow-md overflow-hidden">
            {/* Mobile view: Card-based layout */}
            <div className="md:hidden">
              {leaderboardData.map((player) => (
                <div key={player.id} className="p-3 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 flex-shrink-0 text-center">
                      {player.rank <= 3 ? (
                        <Trophy className={`h-5 w-5 mx-auto ${
                          player.rank === 1 ? "text-yellow-500" : 
                          player.rank === 2 ? "text-gray-400" : "text-amber-700"
                        }`} />
                      ) : (
                        <span className="text-sm">{player.rank}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={player.avatarUrl} 
                          alt={player.username} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="font-medium text-sm truncate">{player.username}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-[10px]">Win %</span>
                        <span>{type === "winRate" ? player.winRate.toFixed(1) : player.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-[10px]">Games</span>
                        <span>{player.gamesPlayed}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-[10px]">Earnings</span>
                        <span className="font-semibold">${player.balance.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop view: Traditional table */}
            <div className="hidden md:block">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="w-12 text-center font-medium">#</TableHead>
                      <TableHead className="w-[40%] font-medium">Player</TableHead>
                      <TableHead className="text-center w-[20%] font-medium">Win %</TableHead>
                      <TableHead className="text-center w-[20%] font-medium">Games</TableHead>
                      <TableHead className="text-right w-[20%] font-medium">Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboardData.map((player) => (
                      <TableRow key={player.id} className="hover:bg-muted/50">
                        <TableCell className="text-center p-3 md:p-4">
                          {player.rank <= 3 ? (
                            <Trophy className={`h-4 w-4 md:h-5 md:w-5 mx-auto ${
                              player.rank === 1 ? "text-yellow-500" : 
                              player.rank === 2 ? "text-gray-400" : "text-amber-700"
                            }`} />
                          ) : (
                            <span className="text-xs md:text-sm">{player.rank}</span>
                          )}
                        </TableCell>
                        
                        <TableCell className="p-3 md:p-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="h-6 w-6 md:h-8 md:w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                              <img 
                                src={player.avatarUrl} 
                                alt={player.username} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-medium text-xs md:text-sm truncate">{player.username}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center p-3 md:p-4 text-xs md:text-sm">
                          {type === "winRate" ? player.winRate.toFixed(1) : player.winRate.toFixed(1)}%
                        </TableCell>
                        
                        <TableCell className="text-center p-3 md:p-4 text-xs md:text-sm">
                          {player.gamesPlayed}
                        </TableCell>
                        
                        <TableCell className="text-right p-3 md:p-4 font-semibold text-xs md:text-sm">
                          ${player.balance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>

          <div className="mt-4 md:mt-8 text-center">
            <p className="text-xs md:text-sm text-muted-foreground mb-3">
              Play more to improve your ranking!
            </p>
            <Button size="sm" className="md:px-6">
              Play Now
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
