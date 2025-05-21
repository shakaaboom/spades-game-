import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const useGamePlayerCounts = () => {
  const [counts, setCounts] = useState({ solo: 0, partnered: 0 });

  const fetchCounts = async () => {
    try {
      // 1️⃣ Fetch all players with game type and user_id (grouped by user_id and game type)
      const { data: players, error: playersError } = await supabase
        .from("solo_players")
        .select("user_id, game:games(status, type)")
        .not("game.status", "eq", "finished");

      if (playersError) throw playersError;

      if (!players || players.length === 0) {
        setCounts({ solo: 0, partnered: 0 });
        return;
      }

      // 2️⃣ Group players by user_id and game type
      const userGameMap: { [userId: string]: Set<string> } = {}; // userId -> Set of game types
      players.forEach((player) => {
        if (player.user_id && player.game?.type) {
          if (!userGameMap[player.user_id]) {
            userGameMap[player.user_id] = new Set();
          }
          userGameMap[player.user_id].add(player.game.type);
        }
      });

      // 3️⃣ Fetch profiles of only the unique user_ids
      const userIds = Object.keys(userGameMap);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id")
        .in("id", userIds)
        .eq("is_online", true);

      if (profilesError) throw profilesError;

      // 4️⃣ Filter online players (userIds that are online)
      const onlineUserIds = new Set(profiles.map((profile) => profile.id));

      // 5️⃣ Count online players by game type (solo and partnered)
      let soloCount = 0;
      let partneredCount = 0;


      Object.entries(userGameMap).forEach(([userId, gameTypes]) => {
        // Only consider players who are online
        if (onlineUserIds.has(userId)) {
          if (gameTypes.has("solo")) soloCount++;
          if (gameTypes.has("partnered")) partneredCount++;
        }
      });

      console.log("onlineUserIds", onlineUserIds)

      // 🔥 Set the final counts
      setCounts({ solo: soloCount, partnered: partneredCount });

    } catch (error) {
      console.error("❌ Error fetching game player counts:", error);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Subscribe to changes in solo_players and profiles tables
    const sub = supabase
      .channel("game_player_counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "solo_players" }, fetchCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  return counts;
};
