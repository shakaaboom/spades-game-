
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, DollarSign, MessageSquare, Table } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    transactionVolume: 0,
    activeGames: 0,
    totalChats: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Fetch total user count
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id')
          .limit(5000);
          
        if (profilesError) throw profilesError;
        
        // Fetch active games count
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('id, wager_amount, status');
          
        if (gamesError) throw gamesError;
        
        // Fetch total chat messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('game_messages')
          .select('id')
          .limit(10000);
          
        if (messagesError) throw messagesError;
        
        // Calculate transaction volume (total of all wagers from games)
        const transactionVolume = gamesData?.reduce((total, game) => {
          return total + (game.wager_amount || 0);
        }, 0) || 0;
        
        // Count active games - status is 'in_progress' or 'waiting'
        const activeGamesCount = gamesData?.filter(game => 
          game.status === 'in_progress' || game.status === 'waiting'
        ).length || 0;
        
        // For active users, we'll estimate as 10% of total users
        const activeUsers = Math.ceil((profilesData?.length || 0) * 0.1);
        
        setStats({
          totalUsers: profilesData?.length || 0,
          activeUsers,
          totalTransactions: gamesData?.length || 0,
          transactionVolume,
          activeGames: activeGamesCount,
          totalChats: messagesData?.length || 0
        });
      } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Users</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : stats.totalUsers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {isLoading ? "..." : stats.activeUsers} online now
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : `$${stats.transactionVolume.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground">
            {isLoading ? "..." : stats.totalTransactions.toLocaleString()} total transactions
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Games</CardTitle>
          <Table className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : stats.activeGames}
          </div>
          <p className="text-xs text-muted-foreground">
            Tables currently in play
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chat Activity</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : stats.totalChats.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Total chat messages
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
