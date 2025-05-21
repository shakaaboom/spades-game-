
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

interface AnimatedCardProps {
  suit?: Suit;
  rank?: Rank;
  faceUp?: boolean;
  playable?: boolean;
  selected?: boolean;
  winning?: boolean;
  dealDelay?: number;
  className?: string;
  onClick?: () => void;
}

const AnimatedCard = ({
  suit,
  rank,
  faceUp = false,
  playable = false,
  selected = false,
  winning = false,
  dealDelay = 0,
  className,
  onClick,
}: AnimatedCardProps) => {
  const [isFlipped, setIsFlipped] = useState(!faceUp);
  const [hasDealt, setHasDealt] = useState(false);
  const [isDealing, setIsDealing] = useState(false);

  // Determine card color based on suit
  const isRed = suit === "hearts" || suit === "diamonds";
  
  // Simulate card dealing animation
  useEffect(() => {
    if (dealDelay > 0) {
      const dealingTimer = setTimeout(() => {
        setIsDealing(true);
        setHasDealt(true);
        
        // Flip card after it's dealt
        const flipTimer = setTimeout(() => {
          setIsFlipped(!faceUp);
          setIsDealing(false);
        }, 300);
        
        return () => clearTimeout(flipTimer);
      }, dealDelay);
      
      return () => clearTimeout(dealingTimer);
    } else {
      setHasDealt(true);
      if (faceUp) {
        setIsFlipped(false);
      }
    }
  }, [dealDelay, faceUp]);

  const getSuitSymbol = (suit: Suit) => {
    switch (suit) {
      case "spades":
        return "♠";
      case "hearts":
        return "♥";
      case "diamonds":
        return "♦";
      case "clubs":
        return "♣";
      default:
        return "";
    }
  };

  // Return card suit and color classes
  const getSuitClasses = (suit: Suit) => {
    switch (suit) {
      case "spades":
        return "text-spades-900 dark:text-white";
      case "hearts":
        return "text-hearts-500";
      case "diamonds":
        return "text-hearts-500";
      case "clubs":
        return "text-spades-900 dark:text-white";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "perspective relative",
        playable ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default",
        selected ? "ring-2 ring-primary" : "",
        className,
        hasDealt ? "opacity-100" : "opacity-0"
      )}
      style={{ 
        transform: isDealing ? `translateY(-100px) rotate(${Math.random() * 10 - 5}deg)` : "",
        transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
        transformOrigin: "center center"
      }}
      onClick={() => {
        if (playable && onClick) {
          onClick();
        }
      }}
    >
      <div
        className={cn(
          "relative preserve-3d transition-transform duration-500",
          "w-[60px] h-[84px] md:w-[80px] md:h-[112px] lg:w-[100px] lg:h-[140px] rounded-lg shadow-md",
          selected ? "translate-y-[-10px] md:translate-y-[-15px] lg:translate-y-[-20px]" : "",
          winning ? "ring-2 ring-green-500 animate-pulse" : "",
          isFlipped ? "rotate-y-180" : ""
        )}
      >
        {/* Front of card (face up) */}
        <div className={cn(
          "absolute inset-0 backface-hidden bg-white dark:bg-spades-800 rounded-lg p-1 md:p-2",
          "border-2 border-gray-200 dark:border-spades-700",
          isRed ? "text-hearts-500" : "text-spades-900 dark:text-white"
        )}>
          {suit && rank && (
            <>
              <div className="absolute top-0 left-0 flex flex-col items-center p-0.5 md:p-1">
                <div className="text-[10px] md:text-xs lg:text-sm font-semibold">{rank}</div>
                <div className="text-[10px] md:text-xs lg:text-md">{getSuitSymbol(suit)}</div>
              </div>
              
              <div className="flex h-full justify-center items-center">
                <div className={cn(
                  "text-xl md:text-2xl lg:text-4xl",
                  getSuitClasses(suit)
                )}>
                  {getSuitSymbol(suit)}
                </div>
              </div>
              
              <div className="absolute bottom-0 right-0 flex flex-col items-center rotate-180 p-0.5 md:p-1">
                <div className="text-[10px] md:text-xs lg:text-sm font-semibold">{rank}</div>
                <div className="text-[10px] md:text-xs lg:text-md">{getSuitSymbol(suit)}</div>
              </div>
            </>
          )}
        </div>
        
        {/* Back of card (face down) */}
        <div className={cn(
          "absolute inset-0 backface-hidden rounded-lg rotate-y-180",
          "bg-gradient-to-br from-primary to-primary-foreground",
          "border-2 border-gray-200 dark:border-spades-700 overflow-hidden"
        )}>
          <div className="absolute inset-[5px] border-2 border-white/30 rounded-md flex items-center justify-center">
            <div className="text-lg md:text-xl lg:text-3xl font-bold text-white/80">♠</div>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-30">
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedCard;
