import React from "react";
import { Bot, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Game } from "@/types/game";

interface ActiveGameCardProps {
  game: Game;
  index: number;
  isLoading: boolean;
  joinGame: (game: Game) => void;
}

const ActiveGameCard: React.FC<ActiveGameCardProps> = ({
  game,
  index,
  isLoading,
  joinGame,
}) => {
  return (
    <div
      key={`${game.mode}-${game.type}-${game.wager_amount}-${index}`}
      className="flex flex-col items-center justify-betweeen gap-3 p-4 border rounded-md"
    >
      <div className="flex justify-between items-center mb-4 w-full">
        <span className="text-base font-semibold">
          Game #{game.id.slice(0, 8)}
        </span>
        <span
          className={`text-sm px-2 py-1 rounded ${
            game.status === "waiting"
              ? "bg-yellow-700"
              : game.status === "in_progress"
              ? "bg-green-600"
              : "bg-red-600"
          }`}
        >
          {game.status === "waiting"
            ? "Waiting"
            : game.status === "in_progress"
            ? "Playing"
            : "Ended"}
        </span>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Players: {game.player_count}/4</span>
        </div>
        {game.wager_amount && (
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Wager: ${game.wager_amount}</span>
          </div>
        )}
      </div>
      {/* <Button
        onClick={() => joinGame(game)}
        variant="outline"
        className="w-full py-2 rounded-md transition"
      >
        Join Game
      </Button> */}
    </div>
  );
};

export default ActiveGameCard;
