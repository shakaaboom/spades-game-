import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Trophy, TrendingUp, CircleDollarSign, Activity } from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ProfileStats = ({ userId = "" }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Fetching profile stats for userId:", userId); // Debug log
    const fetchProfileStats = async () => {
      if (!userId) {
        console.warn("No userId provided, skipping fetch.");
        setLoading(false);
        return;
      }
  
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("rating, games_played, games_won, balance")
        .eq("id", userId)
        .single();
  
      if (error) {
        console.error("Error fetching profile stats:", error);
        setStats(null);
      } else {
        console.log("Setting state with data:", data);
        setStats({
          rating: data.rating,
          winRate: data.games_played
            ? ((data.games_won / data.games_played) * 100).toFixed(2)
            : 0,
          gamesPlayed: data.games_played,
          earnings: data.balance,
        });
      }
      setLoading(false);
    };
  
    fetchProfileStats();
  }, [userId]);
  
  

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!stats) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 text-primary mr-2" />
          <span className="text-sm">Rating</span>
        </div>
        <span className="font-semibold">{stats.rating}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Trophy className="h-4 w-4 text-primary mr-2" />
          <span className="text-sm">Win Rate</span>
        </div>
        <span className="font-semibold">{stats.winRate}%</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Activity className="h-4 w-4 text-primary mr-2" />
          <span className="text-sm">Games Played</span>
        </div>
        <span className="font-semibold">{stats.gamesPlayed}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CircleDollarSign className="h-4 w-4 text-primary mr-2" />
          <span className="text-sm">Total Earnings</span>
        </div>
        <span className="font-semibold">${stats.earnings.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default ProfileStats;
