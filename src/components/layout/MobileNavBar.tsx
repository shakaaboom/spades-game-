
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Trophy, HelpCircle, User, Wallet, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const MobileNavBar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Navigation items - match with the ones in Layout.tsx for consistency
  const navItems = [
    { name: "Lobby", href: "/lobby", icon: <LayoutGrid className="h-5 w-5" /> },
    { name: "Leaderboard", href: "/leaderboard", icon: <Trophy className="h-5 w-5" /> },
    { name: "Help", href: "/how-to-play", icon: <HelpCircle className="h-5 w-5" /> },
    { name: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
    { name: "Wallet", href: "/wallet", icon: <Wallet className="h-5 w-5" /> },
  ];

  // Show navigation bar for all users regardless of login status
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border safe-bottom">
      <nav className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex flex-col items-center py-2 px-3 mobile-touch-feedback",
              location.pathname === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default MobileNavBar;
