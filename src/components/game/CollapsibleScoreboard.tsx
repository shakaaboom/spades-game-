
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Trophy, ChevronUp, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Team } from "@/types/game";

export interface CollapsibleScoreboardProps {
  teams: Team[];
  scoreTarget: number;
}

const CollapsibleScoreboard = ({ teams, scoreTarget }: CollapsibleScoreboardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const isMobileView = useMediaQuery("(max-width: 640px)");

  // Set mobile state based on screen size
  useEffect(() => {
    setIsMobile(isMobileView);
  }, [isMobileView]);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Position scoreboard at the top of the screen
  const scoreboardPositionStyle = isMobile
    ? cn(
        "fixed left-0 top-14 z-30 transition-all duration-300 w-full",
        isCollapsed ? "h-10" : "max-h-[60vh] overflow-auto"
      )
    : cn(
        "fixed left-1/2 -translate-x-1/2 top-16 z-30 transition-all duration-300",
        isCollapsed ? "w-48 h-10" : "w-80"
      );

  // Change the card style to have rounded corners on the bottom only when collapsed
  const cardStyle = cn(
    "h-full flex flex-col border border-border overflow-hidden shadow-lg",
    isCollapsed ? "rounded-b-lg rounded-t-none" : "rounded-lg"
  );

  return (
    <div className={scoreboardPositionStyle}>
      <Card className={cardStyle}>
        <div className="flex items-center justify-between p-2 bg-primary text-primary-foreground">
          <div className="flex items-center">
            <Trophy className="h-4 w-4 mr-2" />
            <span className="font-medium text-sm">
              {isCollapsed ? "Scoreboard" : "Game Scoreboard"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleCollapse}
            className="h-6 w-6 p-0 hover:bg-primary-foreground/20"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4 text-primary-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-primary-foreground" />
            )}
          </Button>
        </div>
        
        {!isCollapsed && (
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Teams</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Goal: {scoreTarget} pts
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Team</TableHead>
                  <TableHead className="text-center">Bid</TableHead>
                  <TableHead className="text-center">Tricks</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name || "Team"}</TableCell>
                    <TableCell className="text-center">{team.bid === null ? '-' : (team.bid === 0 ? 'Nil' : team.bid)}</TableCell>
                    <TableCell className="text-center">{team.tricks}</TableCell>
                    <TableCell className="text-right">{team.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {teams.some(team => team.sandbags > 0) && (
              <div className="mt-3 text-xs text-amber-500">
                <div className="font-medium mb-1">Sandbags:</div>
                <div className="space-y-1">
                  {teams.map(team => team.sandbags > 0 && (
                    <div key={`${team.id}-sandbags`} className="flex justify-between">
                      <span>{team.name || "Team"}:</span>
                      <span>{team.sandbags}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CollapsibleScoreboard;
