
import { Button } from "@/components/ui/button";
import AnimatedCard from "@/components/ui/AnimatedCard";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface GameModeCardProps {
  title: string;
  description: string;
  price: string;
  features: string[];
  popular?: boolean;
  className?: string;
}

const GameModeCard = ({
  title,
  description,
  price,
  features,
  popular = false,
  className,
}: GameModeCardProps) => (
  <div
    className={cn(
      "glass border border-border rounded-xl overflow-hidden",
      popular ? "ring-2 ring-primary" : "",
      className
    )}
  >
    {popular && (
      <div className="bg-primary text-primary-foreground text-xs font-medium py-1 px-3 text-center">
        MOST POPULAR
      </div>
    )}
    
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm mb-6">{description}</p>
      
      <div className="mb-6">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-muted-foreground ml-1">buy-in</span>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Link to="/lobby">
        <Button
          variant={popular ? "default" : "outline"}
          className="w-full"
        >
          Play Now <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  </div>
);

const GameModes = () => {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
      
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Game Mode</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select from different game modes and stake levels to match your play style and budget.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Solo Mode */}
          <div className="lg:col-span-1 relative">
            <div className="absolute -top-10 -right-10 rotate-12 opacity-50 hidden lg:block">
              <AnimatedCard suit="spades" rank="A" faceUp />
            </div>
            <GameModeCard
              title="Solo Spades (1v3)"
              description="Compete individually against three others"
              price="$1 - $20"
              features={[
                "150-300 points to win (based on stake)",
                "Winner receives 2x entry fee",
                "Second place gets entry fee back",
                "Fast-paced gameplay",
                "Perfect for solo players"
              ]}
              className="h-full"
            />
          </div>
          
          {/* Partnered Mode */}
          <div className="lg:col-span-1 relative">
            <div className="absolute -top-10 -left-10 -rotate-12 opacity-50 hidden lg:block">
              <AnimatedCard suit="hearts" rank="K" faceUp />
            </div>
            <GameModeCard
              title="Partnered Spades (2v2)"
              description="Form a team with another player"
              price="$1 - $20"
              features={[
                "150-300 points to win (based on stake)",
                "Winners receive 1.5x entry fee each",
                "Team coordination and strategy",
                "In-game team chat",
                "Ideal for friends and strategic players"
              ]}
              popular
              className="h-full"
            />
          </div>
          
          {/* Stake Levels */}
          <div className="lg:col-span-1">
            <div className="glass border border-border rounded-xl overflow-hidden h-full">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">Stake Levels</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background">
                    <div>
                      <p className="font-medium">$1 Tables</p>
                      <p className="text-xs text-muted-foreground">Beginner Friendly</p>
                    </div>
                    <p className="text-sm">150 points to win</p>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background">
                    <div>
                      <p className="font-medium">$2.50 Tables</p>
                      <p className="text-xs text-muted-foreground">Casual Players</p>
                    </div>
                    <p className="text-sm">200 points to win</p>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background">
                    <div>
                      <p className="font-medium">$5 Tables</p>
                      <p className="text-xs text-muted-foreground">Intermediate</p>
                    </div>
                    <p className="text-sm">300 points to win</p>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background">
                    <div>
                      <p className="font-medium">$10 Tables</p>
                      <p className="text-xs text-muted-foreground">Advanced</p>
                    </div>
                    <p className="text-sm">300 points to win</p>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background">
                    <div>
                      <p className="font-medium">$20 Tables</p>
                      <p className="text-xs text-muted-foreground">Expert</p>
                    </div>
                    <p className="text-sm">300 points to win</p>
                  </div>
                </div>
                
                <div className="mt-8">
                  <Link to="/lobby">
                    <Button variant="outline" className="w-full">
                      View All Tables
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameModes;
