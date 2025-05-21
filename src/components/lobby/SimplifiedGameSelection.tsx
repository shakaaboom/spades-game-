import { useNavigate } from "react-router-dom";
import { Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useGamePlayerCounts } from "@/hooks/game-player-counts";
import { toast } from "@/components/ui/use-toast";

const SimplifiedGameSelection = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { solo, partnered } = useGamePlayerCounts();

  const handleViewGames = (type: "solo" | "partnered") => {
    if (type === "partnered") {
      setTimeout(() => {
        toast({
          title: "Game mode unavailable",
          description: "Partnered games are currently not available.",
          variant: "destructive",
        });
      }, 2000); // 2000 ms = 2 seconds
      return;
    }
    navigate(`/simple-games/${type}`);
  };
  

  return (
    <div className={isMobile ? "space-y-3" : "lg:col-span-3 space-y-6"}>
      <div className="bg-card rounded-lg p-3 md:p-6 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-4">
          Select Game Type
        </h2>
        <p className="text-muted-foreground mb-3 md:mb-6 text-xs md:text-base">
          Choose a game type to view all available games including practice and real money options.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          {/* Solo Games Button */}
          <Button
            onClick={() => handleViewGames("solo")}
            variant="outline"
            className="relative h-16 md:h-24 flex flex-col items-center justify-center p-2 md:p-4"
          >
            <Shield className="h-5 w-5 md:h-8 md:w-8 mb-1 md:mb-2 text-primary" />
            <span className="font-medium text-xs md:text-base">
              Solo Games (1v3)
            </span>
            <span className="text-[10px] md:text-sm text-muted-foreground">
              View all solo game options
            </span>

            {solo > 0 && (
              <div className="absolute top-2 right-2 flex flex-col items-center">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {solo}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Active Players
                </span>
              </div>
            )}
          </Button>

          {/* Partnered Games Button */}
          <Button
            onClick={() => handleViewGames("partnered")}
            variant="outline"
            className="relative h-16 md:h-24 flex flex-col items-center justify-center p-2 md:p-4"
          >
            <Users className="h-5 w-5 md:h-8 md:w-8 mb-1 md:mb-2 text-primary" />
            <span className="font-medium text-xs md:text-base">
              Partnered Games (2v2)
            </span>
            <span className="text-[10px] md:text-sm text-muted-foreground">
              View all 2v2 game options
            </span>

            {partnered > 0 && (
              <div className="absolute top-2 right-2 flex flex-col items-center">
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {partnered}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Active Players
                </span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedGameSelection;
