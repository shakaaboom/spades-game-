import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import ActiveGameCard from "./ActiveGameCard";
import { Game } from "@/types/game";
import { ChevronRight, ChevronLeft } from "lucide-react";
import GameFilterBar, { GameFilters } from "../lobby/GameFilterBar";

interface ActiveGamesProps {
  activeGames: Game[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  previousPage: () => void;
  joinGame: (game: Game) => void;
}

const ActiveGames: React.FC<ActiveGamesProps> = ({
  activeGames,
  isLoading,
  currentPage,
  totalPages,
  joinGame,
  nextPage,
  previousPage,
}) => {
  const [filters, setFilters] = useState<GameFilters>({ 
    mode: "real", 
    type: "solo", 
    wagerAmount: null 
  });

  // Apply wager filter
  const filteredGames = activeGames.filter(game => {
    const wagerAmount = (game as any).wager_amount;
    return filters.wagerAmount ? wagerAmount === filters.wagerAmount : true;
  });

  const showPagination = filteredGames.length > 0 && totalPages > 0;

  return (
    <div className="my-8">
      <h5 className="text-lg font-bold mb-4 text-left">Active Games</h5>
      
      {/* Wager Filter Bar */}
      <GameFilterBar filters={filters} onFilterChange={setFilters} onStartGame={() => {}} />
      
      {filteredGames.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No active games found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game, index) => (
            <ActiveGameCard
              key={`${(game as any).mode}-${(game as any).type}-${(game as any).wager_amount}-${index}`}
              game={game}
              index={index}
              isLoading={isLoading}
              joinGame={joinGame}
            />
          ))}
        </div>
      )}
      
      {showPagination && (
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="outline" 
            onClick={previousPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <Button 
            variant="outline" 
            onClick={nextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActiveGames;
