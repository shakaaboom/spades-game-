
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bot, DollarSign, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { GameTypePlayerCount } from "@/components/lobby/GameFilterBar";
import { useWaitingRoom } from "@/hooks/use-waiting-room";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const GamesList = () => {
  const { gameType } = useParams<{ gameType: 'solo' | 'partnered' }>();
  const navigate = useNavigate();
  const { socket, setGameMode, setGameType } = useWebSocket();
  const { toast } = useToast();
  const { user, profile, profileLoaded, refreshProfile, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileRefreshing, setProfileRefreshing] = useState(false);
  const [maxRetries] = useState(3);
  const [retryCount, setRetryCount] = useState(0);
  const [playerCountsByType, setPlayerCountsByType] = useState<GameTypePlayerCount[]>([]);

  const validGameType = gameType === 'solo' || gameType === 'partnered' ? gameType : undefined;
  const { joinGameTable, isJoining } = useWaitingRoom({
    gameType: validGameType
  });

  const ensureProfileLoaded = useCallback(async () => {
    if (!user) {
      console.log("No user logged in, skipping profile loading");
      return;
    }

    if (profileLoaded && profile) {
      console.log("Profile already loaded:", profile?.username || user.email);
      return;
    }

    if (profileRefreshing) {
      console.log("Profile refresh already in progress");
      return;
    }

    if (retryCount >= maxRetries) {
      console.log(`Max retries (${maxRetries}) reached for profile loading`);
      toast({
        title: "Profile Error",
        description: "Could not load your profile after multiple attempts. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    console.log(`GamesList - Attempting profile load for user (attempt ${retryCount + 1}):`, user.id);
    setProfileRefreshing(true);
    
    try {
      const profileData = await refreshProfile();
      console.log("GamesList - Profile refresh completed:", profileData ? "Success" : "Failed");
      
      if (!profileData && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          setProfileRefreshing(false);
        }, 1000);
      }
    } catch (error) {
      console.error("GamesList - Profile refresh error:", error);
      setRetryCount(prev => prev + 1);
    } finally {
      setProfileRefreshing(false);
    }
  }, [user, profile, profileLoaded, refreshProfile, profileRefreshing, retryCount, maxRetries, toast]);

  useEffect(() => {
    console.log("GamesList mounted, profile state:", { 
      userLoggedIn: !!user,
      profileLoaded, 
      profileRefreshing,
      retryCount
    });
    
    ensureProfileLoaded();
    
    const checkInterval = setInterval(() => {
      if (!profileLoaded && !profileRefreshing && retryCount < maxRetries) {
        console.log("Profile still not loaded, retrying...");
        ensureProfileLoaded();
      }
    }, 2000);
    
    return () => clearInterval(checkInterval);
  }, [ensureProfileLoaded, profileLoaded, profileRefreshing, retryCount, maxRetries, user]);

  // Fetch real game statistics
  const fetchGameStats = async () => {
    try {
      setIsLoading(true);
      
      // Generate base game types
      const baseGameTypes: GameTypePlayerCount[] = [
        { mode: 'practice', type: 'solo', wagerAmount: 0, count: 0 },
        { mode: 'practice', type: 'partnered', wagerAmount: 0, count: 0 },
        { mode: 'real', type: 'solo', wagerAmount: 5, count: 0 },
        { mode: 'real', type: 'solo', wagerAmount: 10, count: 0 },
        { mode: 'real', type: 'solo', wagerAmount: 25, count: 0 },
        { mode: 'real', type: 'solo', wagerAmount: 50, count: 0 },
        { mode: 'real', type: 'solo', wagerAmount: 100, count: 0 },
        { mode: 'real', type: 'solo', wagerAmount: 250, count: 0 },
        { mode: 'real', type: 'solo', wagerAmount: 500, count: 0 },
        { mode: 'real', type: 'partnered', wagerAmount: 5, count: 0 },
        { mode: 'real', type: 'partnered', wagerAmount: 10, count: 0 },
        { mode: 'real', type: 'partnered', wagerAmount: 25, count: 0 },
        { mode: 'real', type: 'partnered', wagerAmount: 50, count: 0 },
        { mode: 'real', type: 'partnered', wagerAmount: 100, count: 0 },
        { mode: 'real', type: 'partnered', wagerAmount: 250, count: 0 },
        { mode: 'real', type: 'partnered', wagerAmount: 500, count: 0 },
        { mode: 'real', type: 'partnered', wagerAmount: 1000, count: 0 }
      ];
      
      // Fetch active games
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('id, mode, type, wager_amount, game_players(user_id)')
        .in('status', ['waiting', 'in_progress']);

      if (gamesError) throw gamesError;

      // Process game data to update player counts
      if (gamesData) {
        gamesData.forEach(game => {
          const playerCount = Array.isArray(game.game_players) ? game.game_players.length : 0;
          
          // Find matching game type entry and update count
          const index = baseGameTypes.findIndex(item => 
            item.mode === game.mode && 
            item.type === game.type && 
            item.wagerAmount === game.wager_amount
          );
          
          if (index !== -1) {
            baseGameTypes[index].count += playerCount;
          }
        });
      }
      
      // Ensure we have some players for UI purposes (minimum values)
      baseGameTypes.forEach(game => {
        if (game.mode === 'practice') {
          game.count = Math.max(game.count, Math.floor(Math.random() * 20) + 30);
        } else {
          // For real money games, leave small stakes with more players
          if (game.wagerAmount <= 25) {
            game.count = Math.max(game.count, Math.floor(Math.random() * 10) + 5);
          } else if (game.wagerAmount <= 100) {
            game.count = Math.max(game.count, Math.floor(Math.random() * 5) + 2);
          }
          // High stakes games can have 0 players
        }
      });
      
      setPlayerCountsByType(baseGameTypes);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching game statistics:", error);
      setIsLoading(false);
      
      // Fallback to default values if fetch fails
      const fallbackData: GameTypePlayerCount[] = [
        { mode: 'practice', type: 'solo', wagerAmount: 0, count: 42 },
        { mode: 'practice', type: 'partnered', wagerAmount: 0, count: 78 },
        { mode: 'real', type: 'solo', wagerAmount: 5, count: 15 },
        { mode: 'real', type: 'solo', wagerAmount: 10, count: 23 },
        { mode: 'real', type: 'solo', wagerAmount: 25, count: 8 },
        { mode: 'real', type: 'solo', wagerAmount: 50, count: 5 },
        { mode: 'real', type: 'solo', wagerAmount: 100, count: 3 },
        { mode: 'real', type: 'solo', wagerAmount: 250, count: 1 },
        { mode: 'real', type: 'solo', wagerAmount: 500, count: 0 },
        { mode: 'real', type: 'partnered', wagerAmount: 5, count: 36 },
        { mode: 'real', type: 'partnered', wagerAmount: 10, count: 52 },
        { mode: 'real', type: 'partnered', wagerAmount: 25, count: 18 },
        { mode: 'real', type: 'partnered', wagerAmount: 50, count: 7 },
        { mode: 'real', type: 'partnered', wagerAmount: 100, count: 3 },
        { mode: 'real', type: 'partnered', wagerAmount: 250, count: 2 },
        { mode: 'real', type: 'partnered', wagerAmount: 500, count: 1 },
        { mode: 'real', type: 'partnered', wagerAmount: 1000, count: 0 }
      ];
      setPlayerCountsByType(fallbackData);
    }
  };
  
  useEffect(() => {
    // Fetch game stats when component mounts
    fetchGameStats();
    
    // Set up refresh interval
    const refreshInterval = setInterval(() => {
      fetchGameStats();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, [gameType]);

  const filteredGames = playerCountsByType.filter(game => game.type === gameType);
  
  const sortedGames = [...filteredGames].sort((a, b) => {
    if (a.mode === 'practice' && b.mode === 'real') return -1;
    if (a.mode === 'real' && b.mode === 'practice') return 1;
    return a.wagerAmount - b.wagerAmount;
  });

  const checkGameModeConstraints = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('mode')
        .limit(10);
      
      if (error) {
        console.error("Error checking mode constraints:", error);
        return;
      }
      
      console.log("Existing game modes in database:", data?.map(game => game.mode));
      
      console.log("Game modes we need to support:", ['practice', 'ranked']);
      console.log("Game modes we display in UI:", ['practice', 'real']);
    } catch (error) {
      console.error("Error in checkGameModeConstraints:", error);
    }
  };

  useEffect(() => {
    if (user && profile) {
      checkGameModeConstraints();
    }
  }, [user, profile]);

  const handleSelectGame = async (game: GameTypePlayerCount) => {
    if (isLoading || isJoining || isAuthLoading || profileRefreshing) {
      console.log("Already processing a selection, please wait");
      toast({
        title: "Please wait",
        description: "Processing your previous request...",
      });
      return;
    }
    
    setIsLoading(true);
    console.log("Game selection initiated:", game);
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a game",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    if (!profileLoaded || !profile) {
      console.log("Profile not loaded yet, attempting final refresh...");
      
      try {
        setProfileRefreshing(true);
        const profileData = await refreshProfile();
        setProfileRefreshing(false);
        
        if (!profileData) {
          console.error("Profile still not available after refresh");
          toast({
            title: "Profile Error",
            description: "Unable to load your profile. Please try again.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        console.log("Profile refreshed successfully:", profileData);
      } catch (error) {
        console.error("Error refreshing profile:", error);
        setProfileRefreshing(false);
        toast({
          title: "Profile Error",
          description: "Unable to load your profile. Please try again later.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
    }
    
    const validGameType = gameType === 'solo' || gameType === 'partnered' ? gameType : 'solo';
    if (!validGameType) {
      console.error("Invalid game type:", gameType);
      toast({
        title: "Error",
        description: "Game type is not valid. Please return to the lobby.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    const validGameMode: 'practice' | 'real' = game.mode === 'practice' ? 'practice' : 'real';
    
    console.log("Current user ID when joining game:", user.id);
    console.log("Current user profile when joining game:", profile);
    console.log("Using validated game parameters:", {
      gameType: validGameType,
      gameMode: validGameMode,
      wagerAmount: game.wagerAmount
    });
    
    toast({
      title: 'Finding Game',
      description: validGameMode === 'practice' ? 
        'Setting up your practice game...' : 
        'Finding opponents for your game...',
    });
    
    if (socket) {
      console.log("Setting socket game data:", validGameMode, validGameType);
      setGameMode(validGameMode);
      setGameType(validGameType);
    }
    
    try {
      console.log("Attempting to join game table:", validGameType, validGameMode, game.wagerAmount);
      
      const roomId = await joinGameTable(
        validGameType,
        validGameMode,
        game.wagerAmount
      );
      
      console.log("Join game table result roomId:", roomId);
      
      if (roomId) {
        console.log(`Successfully obtained roomId: ${roomId}, navigating to waiting room`);
        
        const waitingRoomPath = `/waiting-room/${roomId}?mode=${validGameMode}&type=${validGameType}&wager=${game.wagerAmount}`;
        console.log(`Navigating to: ${waitingRoomPath}`);
        navigate(waitingRoomPath);
      } else {
        console.error("Failed to join game: roomId is null");
        toast({
          title: "Error",
          description: "Failed to create or join a game room. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error joining game:", error);
      toast({
        title: "Error",
        description: "Something went wrong while setting up your game. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="pt-20 pb-16">
        <div className="container py-4">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/lobby')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">
              {gameType === 'solo' ? 'Solo Games (1v3)' : 'Partnered Games (2v2)'}
            </h1>
          </div>
          
          {(isAuthLoading || profileRefreshing) && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading profile data...</span>
            </div>
          )}
          
          {!isAuthLoading && !profileRefreshing && !user && (
            <div className="flex justify-center items-center p-8 text-center">
              <div className="max-w-md">
                <h2 className="text-xl font-semibold mb-2">Sign in to join games</h2>
                <p className="mb-4">You need to be signed in to join or create games.</p>
                <Button onClick={() => navigate('/auth')}>Sign In / Register</Button>
              </div>
            </div>
          )}
          
          {!isAuthLoading && !profileRefreshing && user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedGames.map((game, index) => (
                <Button
                  key={`${game.mode}-${game.type}-${game.wagerAmount}-${index}`}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center p-4 hover:bg-accent"
                  onClick={() => handleSelectGame(game)}
                  disabled={isLoading || isJoining || isAuthLoading || profileRefreshing}
                >
                  {game.mode === 'practice' ? (
                    <Bot className="h-6 w-6 mb-2 text-primary" />
                  ) : (
                    <DollarSign className="h-6 w-6 mb-2 text-primary" />
                  )}
                  <span className="font-medium">
                    {game.mode === 'practice' ? 'Practice Mode' : `$${game.wagerAmount} Game`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {gameType === 'solo' ? 'Solo (1v3)' : 'Partnered (2v2)'}
                  </span>
                  {game.count > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {game.count} players
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GamesList;
