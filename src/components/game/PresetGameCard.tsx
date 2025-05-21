import React from "react";
import { Bot, DollarSign, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameTypePlayerCount } from "@/pages/SimpleGamesList";
import { useMatchmakingTime } from "@/hooks/use-matchmaking-time";
import { cn } from "@/lib/utils";

interface PresetGameCardProps {
  game: GameTypePlayerCount;
  index: number;
  handleSelectGame: (game: GameTypePlayerCount) => void;
  isLoading: boolean;
}

const PresetGameCard: React.FC<PresetGameCardProps> = ({
  game,
  index,
  handleSelectGame,
  isLoading,
}) => {
  const { formattedTime, isLoading: isTimeLoading } = useMatchmakingTime({
    gameType: game.type,
    wagerAmount: game.wagerAmount,
  });

  return (
    <Button
      key={`${game.mode}-${game.type}-${game.wagerAmount}-${index}`}
      variant="outline"
      className="h-28 flex flex-col items-center justify-center p-4 hover:bg-accent relative"
      onClick={() => handleSelectGame(game)}
      disabled={isLoading}
    >
      {game.mode === "practice" ? (
        <Bot className="h-6 w-6 mb-2 text-primary" />
      ) : (
        <DollarSign className="h-6 w-6 mb-2 text-primary" />
      )}
      <span className="font-medium">
        {game.mode === "practice"
          ? "Practice Mode"
          : `$${game.wagerAmount} Game`}
      </span>
      <span className="text-sm text-muted-foreground">
        {game.type === "solo" ? "Solo (1v3)" : "Partnered (2v2)"}
      </span>
      <div className="flex items-center gap-2 mt-1">
        {game.count > 0 && (
          <Badge variant="secondary">
            {game.count} players
          </Badge>
        )}
        <Badge 
          variant="outline" 
          className={cn(
            "flex items-center gap-1",
            isTimeLoading && "opacity-50"
          )}
        >
          <Clock className="h-3 w-3" />
          <span className="text-xs">{formattedTime}</span>
        </Badge>
      </div>
    </Button>
  );
};

export default PresetGameCard;
