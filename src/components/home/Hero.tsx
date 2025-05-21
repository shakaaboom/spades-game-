import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedCard from "@/components/ui/AnimatedCard";
import { ArrowRight } from "lucide-react";
import useOnlinePlayers from "@/hooks/use-online-players";

const Hero = () => {
  const [showCards, setShowCards] = useState(false);
  const { totalOnlinePlayers } = useOnlinePlayers();
  
  useEffect(() => {
    // Delay showing cards for animation
    const timer = setTimeout(() => {
      setShowCards(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="pt-32 pb-24 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
      
      {/* Floating cards for decoration */}
      <div className="absolute top-[10%] right-[10%] opacity-50 animate-float hidden lg:block">
        <AnimatedCard suit="spades" rank="A" faceUp />
      </div>
      <div className="absolute bottom-[15%] left-[15%] opacity-30 animate-float hidden lg:block" style={{ animationDelay: '2s' }}>
        <AnimatedCard suit="hearts" rank="K" faceUp />
      </div>
      <div className="absolute top-[20%] left-[5%] opacity-40 animate-float hidden lg:block" style={{ animationDelay: '1s' }}>
        <AnimatedCard suit="clubs" rank="Q" faceUp />
      </div>
      <div className="absolute bottom-[10%] right-[20%] opacity-30 animate-float hidden lg:block" style={{ animationDelay: '3s' }}>
        <AnimatedCard suit="diamonds" rank="J" faceUp />
      </div>
      
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Real Money
              </span>{" "}
              Multiplayer Spades
            </h1>
            
            <p className="mt-6 text-lg text-muted-foreground max-w-xl text-balance">
              Compete in solo and partnered modes with real-time gameplay, 
              matchmaking, and cash prizes. Join thousands of players and 
              test your skills in the ultimate card game.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Play Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/how-to-play">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  How To Play
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 flex items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-medium">
                    {i}
                  </div>
                ))}
              </div>
              <div className="ml-4">
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {totalOnlinePlayers.toLocaleString()}
                  </span> players online
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 relative flex justify-center perspective">
            <div className="relative w-[280px] h-[280px]">
              {showCards && (
                <>
                  <div className="absolute -left-10 -top-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <AnimatedCard suit="spades" rank="A" faceUp dealDelay={200} />
                  </div>
                  <div className="absolute left-20 -top-5 animate-slide-up" style={{ animationDelay: '300ms' }}>
                    <AnimatedCard suit="hearts" rank="K" faceUp dealDelay={300} />
                  </div>
                  <div className="absolute right-0 top-0 animate-slide-up" style={{ animationDelay: '400ms' }}>
                    <AnimatedCard suit="clubs" rank="Q" faceUp dealDelay={400} />
                  </div>
                  <div className="absolute -left-5 top-32 animate-slide-up" style={{ animationDelay: '500ms' }}>
                    <AnimatedCard suit="diamonds" rank="J" faceUp dealDelay={500} />
                  </div>
                  <div className="absolute right-10 top-40 animate-slide-up" style={{ animationDelay: '600ms' }}>
                    <AnimatedCard suit="spades" rank="10" faceUp dealDelay={600} />
                  </div>
                  <div className="absolute bottom-0 left-0 animate-slide-up" style={{ animationDelay: '700ms' }}>
                    <AnimatedCard suit="hearts" rank="9" faceUp dealDelay={700} />
                  </div>
                  <div className="absolute bottom-10 right-5 animate-slide-up" style={{ animationDelay: '800ms' }}>
                    <AnimatedCard suit="clubs" rank="8" faceUp dealDelay={800} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
