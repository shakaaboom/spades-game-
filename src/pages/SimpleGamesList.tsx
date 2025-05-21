import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bot, DollarSign, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useProfileCheck } from "@/hooks/waiting-room/use-profile-check";
import { supabase } from "@/integrations/supabase/client";
import PresetGameCard from "@/components/game/PresetGameCard";
import ActiveGames from "@/components/game/ActiveGames";
import { Game } from "@/types/game";
import { useGame } from "@/hooks/use-game";

export const WAGER_PRESETS = [.5, 1, 2.5, 5, 10, 25, 50, 100];

export interface GameTypePlayerCount {
  mode: "practice" | "real";
  type: "solo" | "partnered";
  wagerAmount: number;
  count: number;
}

const SimpleGamesList = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isLoading: isAuthLoading, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileRefreshAttempted, setProfileRefreshAttempted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { activeGames, fetchActiveGames, joinGame, totalPages } = useGame();
  const [currentPage, setCurrentPage] = useState(1);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoaded, setBalanceLoaded] = useState(false); 


  useEffect(() => {
    const fetchBalance = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching balance:", error);
          toast({
            title: "Error",
            description: "Failed to fetch balance. Please try again.",
            variant: "destructive",
          });
        }

        if (data) {
          setBalance(data.balance);
        }

        setBalanceLoaded(true); // ✅ Mark as loaded even if there's an error
      }
    };

    fetchBalance();

    const balanceSub = supabase
      .channel(`profile-balance-${user?.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          setBalance(payload.new.balance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(balanceSub);
    };
  }, [user]);



  useEffect(() => {
    const gameSubscription = supabase
      .channel("game-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        (payload) => {
          console.log("Game updated:", payload);
          if (currentPage === 1) {
            fetchActiveGames(1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameSubscription);
    };
  }, []);

  useEffect(() => {
    fetchActiveGames(currentPage);
  }, [currentPage]);

  useProfileCheck({
    user,
    profile,
    profileRefreshAttempted,
    setProfileRefreshAttempted,
    setProfileReady,
    silent: true,
  });

  const validGameTypes = ["solo", "partnered"] as const;
  const validGameType: "solo" | "partnered" = validGameTypes.includes(
    gameType as any
  )
    ? (gameType as "solo" | "partnered")
    : "solo";

  const filteredGames = WAGER_PRESETS.map((wager) => ({
    mode: "real",
    type: validGameType,
    wagerAmount: wager,
    count: 0,
  }));

  const sortedGames = filteredGames.sort((a, b) => a.wagerAmount - b.wagerAmount);

  const handleJoinGame = async (game: Game) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a game",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
  
    // Fetch user's current balance
    const { data: userBalanceData, error: balanceError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();
  
    if (balanceError || !userBalanceData) {
      console.error("Error fetching user balance:", balanceError);
      toast({
        title: "Balance Check Failed",
        description: "Unable to verify your balance. Please try again.",
        variant: "destructive",
      });
      return;
    }
  
    const userBalance = userBalanceData.balance;
  
    // Check if user has enough balance for the selected wager
    if (userBalance < game.wagerAmount) {
      toast({
        title: "Insufficient Funds",
        description: `You need at least $${game.wagerAmount} to join this game.`,
        variant: "destructive",
      });
      return;
    }
  
    joinGame(game, user.id);
  };

  const createRealMoneyGame = async (game: Game) => {

    try 
    {
      setIsLoading(true);
      if (!user || !user.id) {
        throw new Error("User is not authenticated or valid.");
      }
      if (balance === null || balance < game.wagerAmount) {
        toast({
          title: "Insufficient Balance",
          description: `You need at least $${game.wagerAmount} to join or create this game.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      let gameToJoin = null;

      // Fetch an existing game that is waiting and has an open slot
      const { data: existingGames, error: existingGamesError } = await supabase
        .from("games")
        .select("id, players_count, wager_amount, status")
        .eq("wager_amount", game.wagerAmount)
        .eq("type", game.type)
        .eq("status", "waiting")
        .lt("players_count", 4) 
        .order("created_at", { ascending: true }) // Get the oldest waiting game first
        .limit(1);
  
      if (existingGamesError) throw existingGamesError;
  
      if (existingGames && existingGames.length > 0) {
        gameToJoin = existingGames[0];
  
        /* // Check if the user is already in the game
        const { data: existingPlayers, error: playersError } = await supabase
          .from("game_players")
          .select("user_id")
          .eq("game_id", gameToJoin.id);
  
        if (playersError) throw playersError;
  
        if (existingPlayers.some((p) => p.user_id === user.id)) {
          toast({
            title: "Already in Game",
            description: "You are already a participant in this game.",
            variant: "warning",
          });
          navigate(`/simple-waiting-room/${gameToJoin.id}?mode=real&type=${validGameType}&wager=${game.wagerAmount}`);
          return;
        }
  
        // Assign the user to the existing game
        const { error: updateGameError } = await supabase
          .from("games")
          .update({
            players_count: gameToJoin.players_count + 1, // Increment players count
            updated_at: new Date().toISOString(),
          })
          .eq("id", gameToJoin.id);
  
        if (updateGameError) throw updateGameError;
  
        // Insert the user into the game_players table
        const { error: playerGameError } = await supabase.from("game_players").insert({
          user_id: user.id,
          game_id: gameToJoin.id,
        });
  
        if (playerGameError) throw playerGameError;
  
        toast({
          title: "Game Joined",
          description: "You have successfully joined an existing game!",
          variant: "success",
        });
  
        navigate(`/simple-waiting-room/${gameToJoin.id}?mode=real&type=${validGameType}&wager=${game.wagerAmount}`); */
      } else {
    /*     // If no available game is found, create a new game
        // Fetch game details from Supabase
        const { data: gameDetails, error: gameDetailsError } = await supabase
          .from("game_details") // Assuming you have a table for game details
          .select("type, mode") // Fetch the necessary fields
          .single(); // Get a single record
  
        if (gameDetailsError) {
          console.error("Error fetching game details:", gameDetailsError);
          throw new Error("Failed to fetch game details.");
        } */
  
        // Create a new game using the fetched details
        const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert({
          status: "waiting",
          mode: game.mode,
          type: game.type,
          wager_amount: game.wagerAmount,
          current_phase: "setup",
          created_by: user.id,
        })
        .select("id")
        .single();
  
        if (gameError) {
          console.error("Error creating game:", gameError);
          toast({
            title: "Error",
            description: `Game creation failed: ${gameError.message}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        gameToJoin = gameData;
  /* 
        // Add the player to the newly created game
        const { data: playerGame, error: playerGameError } = await supabase
          .from("game_players")
          .insert({
            user_id: user?.id,
            game_id: newGame?.id,
          });
  
        if (playerGameError) throw playerGameError;
  
        toast({
          title: "Game Created",
          description: "You have successfully created and joined a new game!",
          variant: "success",
        });
  
        // Navigate to the waiting room
        navigate(`/simple-waiting-room/${newGame.id}?mode=real&type=${validGameType}&wager=${game.wagerAmount}`); */
      }
  
      joinGame(gameToJoin, user.id);

    } catch (error) {
      console.error("Error joining or creating game:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      
      setIsLoading(false);
    }
  };
  
  
  const createNewGame = async (game: Game) => {
    try {
      const defaultType = "real_money";
      const defaultMode = validGameType;
  
      const { data: newGame, error: createGameError } = await supabase
        .from("games")
        .insert({
          status: "waiting",
          type: defaultType,
          mode: defaultMode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          current_phase: "setup",
          current_round: 0,
          players_count: 1,
          spades_broken: false,
          wager_amount: game.wagerAmount,
        })
        .select()
        .single();
  
      if (createGameError) throw createGameError;
  
      const { error: playerGameError } = await supabase.from("game_players").insert({
        user_id: user.id,
        game_id: newGame.id,
      });
  
      if (playerGameError) throw playerGameError;
  
      toast({
        title: "Game Created",
        description: "You have successfully created and joined a new game!",
        variant: "success",
      });
  
      navigate(`/simple-waiting-room/${newGame.id}?mode=real&type=${validGameType}&wager=${game.wagerAmount}`);
  
      setIsLoading(false);
    } catch (error) {
      console.error("Error creating new game:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  
  

  return (
    <Layout>
      <div className="pt-20 pb-16">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate("/lobby")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">
              {validGameType === "solo" ? "Solo Games (1v3)" : "Partnered Games (2v2)"}
            </h1>
          </div>

          {user && (
            <>
              <h5 className="text-lg font-bold mb-4 text-left">Create a new table</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedGames.map((game, index) => (
                  <PresetGameCard
                    key={`${game.mode}-${game.type}-${game.wagerAmount}-${index}`}
                    game={game}
                    index={index}
                    handleSelectGame={createRealMoneyGame}
                    isLoading={isLoading || !balanceLoaded} 
                  />
                ))}
              </div>
            </>
          )}

          <ActiveGames
            activeGames={activeGames}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            nextPage={() => setCurrentPage(currentPage + 1)}
            previousPage={() => setCurrentPage(currentPage - 1)}
            joinGame={handleJoinGame}
          />
        </div>
      </div>
    </Layout>
  );
};

export default SimpleGamesList;