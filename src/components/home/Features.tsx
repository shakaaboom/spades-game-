import { Users, Trophy, Zap, ShieldCheck, Banknote, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  style?: React.CSSProperties;
}

const FeatureCard = ({ icon, title, description, className, style }: FeatureCardProps) => (
  <div 
    className={cn(
      "glass p-6 rounded-xl card-hover",
      className
    )}
    style={style}
  >
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Real-Time Multiplayer",
      description: "Play with friends or match with players around the world in real-time games."
    },
    {
      icon: <Trophy className="h-6 w-6 text-primary" />,
      title: "Multiple Game Modes",
      description: "Compete in Solo (1v3) or Partnered (2v2) modes with different strategies and payouts."
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Fast Matchmaking",
      description: "Get matched with players of similar skill levels in seconds."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: "Secure Transactions",
      description: "Safe deposits and withdrawals with multiple payment options."
    },
    {
      icon: <Banknote className="h-6 w-6 text-primary" />,
      title: "Real Money Stakes",
      description: "Play at different stake levels from $1 to $20 tables and win real cash."
    },
    {
      icon: <LineChart className="h-6 w-6 text-primary" />,
      title: "Stats & Leaderboards",
      description: "Track your performance and compete for a top spot on the leaderboards."
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Players Love Spades</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our platform combines classic card gaming with modern features to create
            the ultimate Spades experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
