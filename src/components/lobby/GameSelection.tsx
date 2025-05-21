import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import GameFilterBar, { GameFilters, GameTypePlayerCount } from "@/components/lobby/GameFilterBar";

interface GameSelectionProps {
  playerCountsByType: GameTypePlayerCount[];
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

const GameSelection = ({ 
  playerCountsByType, 
  isLoading = false, 
  setIsLoading 
}: GameSelectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { socket, setGameMode, setGameType } = useWebSocket();
  
  // Define game filter state
  const [gameFilters, setGameFilters] = useState<GameFilters>({
    mode: 'practice',
    type: 'partnered',
    wagerAmount: null
  });
  
  // Track previously played games for recommendations
  const [recentGames, setRecentGames] = useState<GameFilters[]>(() => {
    const saved = localStorage.getItem('recentGames');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Save recent games to localStorage when updated
  useEffect(() => {
    localStorage.setItem('recentGames', JSON.stringify(recentGames));
  }, [recentGames]);
  
  // Get recommended game based on play history
  const getRecommendedGame = (): GameFilters | null => {
    if (recentGames.length === 0) return null;
    
    // Count occurrences of each game type
    const gameCounts = recentGames.reduce<Record<string, number>>((acc, game) => {
      const key = `${game.mode}-${game.type}-${game.wagerAmount || 0}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    // Find the most frequently played game
    let mostPlayed = '';
    let highestCount = 0;
    
    Object.entries(gameCounts).forEach(([key, count]) => {
      if (count > highestCount) {
        mostPlayed = key;
        highestCount = count;
      }
    });
    
    if (!mostPlayed) return null;
    
    // Convert key back to game filter
    const [mode, type, wagerAmountStr] = mostPlayed.split('-');
    const wagerAmount = wagerAmountStr === '0' ? null : Number(wagerAmountStr);
    
    return {
      mode: mode as 'practice' | 'real',
      type: type as 'solo' | 'partnered',
      wagerAmount
    };
  };
  
  // Handle starting a game with current filters
  const handleStartGame = () => {
    if (!socket || isLoading) return;
    
    if (setIsLoading) setIsLoading(true);
    setGameMode(gameFilters.mode);
    setGameType(gameFilters.type);
    
    // Add current game to recent games
    setRecentGames(prev => {
      // Keep only the 10 most recent games
      const updated = [gameFilters, ...prev].slice(0, 10);
      return updated;
    });
    
    // Show toast based on selected mode
    toast({
      title: 'Preparing Game',
      description: gameFilters.mode === 'practice' ? 
        'Setting up your practice game with AI bots...' : 
        'Finding opponents for your game...',
    });
    
    // Tell the server our selection
    if (gameFilters.mode === 'practice') {
      socket.emit('selectGameMode', gameFilters.mode, gameFilters.type);
      
      // Navigate to game page after small delay
      setTimeout(() => {
        navigate(`/game/${gameFilters.type === 'solo' ? 'solo' : 'partnered'}-${Date.now()}`);
      }, 1500);
    } else {
      // For real money games, include wager amount
      socket.emit('selectGameMode', gameFilters.mode, gameFilters.type, gameFilters.wagerAmount);
      
      // Navigate to a waiting room page specific to the wager amount
      setTimeout(() => {
        navigate(`/waiting-room/table-${gameFilters.wagerAmount}-${Date.now()}`, { 
          state: { 
            gameType: gameFilters.type,
            wagerAmount: gameFilters.wagerAmount
          } 
        });
      }, 1500);
    }
  };
  
  // Handle quick play recommendation
  const handleQuickPlay = (filters: GameFilters) => {
    setGameFilters(filters);
    setTimeout(() => {
      handleStartGame();
    }, 100);
  };

  return (
    <div className="lg:col-span-3 space-y-4 md:space-y-6">
      {/* Recommended Quick Play */}
      {getRecommendedGame() && (
        <div className="bg-card rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-medium flex items-center gap-2 mb-3">
            <div className="bg-primary/10 rounded-full p-1">
              <div className="text-primary">
                {getRecommendedGame()?.mode === 'practice' ? "🎮" : "💰"}
              </div>
            </div>
            Quick Play
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {getRecommendedGame() && (
              <button
                onClick={() => handleQuickPlay(getRecommendedGame()!)}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <div className="text-xl mb-1">
                  {getRecommendedGame()?.mode === 'practice' 
                    ? "🎮" 
                    : `💰 $${getRecommendedGame()?.wagerAmount}`}
                </div>
                <span className="font-medium">
                  {getRecommendedGame()?.mode === 'practice' ? 'Practice' : 'Real Money'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {getRecommendedGame()?.type === 'solo' ? 'Solo (1v3)' : 'Partnered (2v2)'}
                </span>
              </button>
            )}
            
            {/* Some predefined quick games */}
            <button
              onClick={() => handleQuickPlay({mode: 'practice', type: 'solo', wagerAmount: null})}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-3 bg-card rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <div className="text-xl mb-1">🎮</div>
              <span className="font-medium">Practice</span>
              <span className="text-sm text-muted-foreground">Solo (1v3)</span>
            </button>
            
            <button
              onClick={() => handleQuickPlay({mode: 'practice', type: 'partnered', wagerAmount: null})}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-3 bg-card rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <div className="text-xl mb-1">🎮</div>
              <span className="font-medium">Practice</span>
              <span className="text-sm text-muted-foreground">Partnered (2v2)</span>
            </button>
            
            <button
              onClick={() => handleQuickPlay({mode: 'real', type: 'partnered', wagerAmount: 5})}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-3 bg-card rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <div className="text-xl mb-1">💰</div>
              <span className="font-medium">$5 Game</span>
              <span className="text-sm text-muted-foreground">Partnered (2v2)</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Game Filter Bar */}
      <GameFilterBar 
        filters={gameFilters}
        onFilterChange={setGameFilters}
        onStartGame={handleStartGame}
        playerCounts={playerCountsByType}
      />
      
      {/* Additional lobby content */}
      <div className="bg-card rounded-lg p-4 md:p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Recent Games</h2>
        <p className="text-muted-foreground">
          No recent games found. Start a new game to see your history here.
        </p>
      </div>
    </div>
  );
};

export default GameSelection;
