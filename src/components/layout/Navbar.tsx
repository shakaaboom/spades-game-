import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import MobileNav from "./MobileNav";
import {
  LayoutGrid,
  Trophy,
  HelpCircle,
  Wallet,
  Settings,
  Menu,
  X,
  User,
  LogIn,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import BalanceDisplay from "@/components/wallet/BalanceDisplay";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const Navbar = () => {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { user, profile, signOut } = useAuth();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const pages: NavItem[] = [
    {
      name: "Lobby",
      href: "/lobby",
      icon: <LayoutGrid className="h-4 w-4 mr-2" />,
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: <Trophy className="h-4 w-4 mr-2" />,
    },
    {
      name: "How to Play",
      href: "/how-to-play",
      icon: <HelpCircle className="h-4 w-4 mr-2" />,
    },
  ];

  const accountPages: NavItem[] = [
    {
      name: "Profile",
      href: "/profile",
      icon: <User className="h-4 w-4 mr-2" />,
    },
    {
      name: "Wallet",
      href: "/wallet",
      icon: <Wallet className="h-4 w-4 mr-2" />,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <nav className="bg-background border-b border-border fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="font-bold text-xl text-primary">
                Card Game
              </Link>
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="hidden md:ml-6 md:flex md:space-x-2">
                {pages.map((page) => (
                  <Link
                    key={page.name}
                    to={page.href}
                    className={`
                      inline-flex items-center px-3 py-2 rounded-md text-sm font-medium
                      ${
                        pathname === page.href
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }
                    `}
                  >
                    {page.icon}
                    {page.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-2">
                {!isMobile && (
                  <>
                    <BalanceDisplay className="mr-2" />
                    <NavigationMenu>
                      <NavigationMenuList>
                        <NavigationMenuItem>
                          <NavigationMenuTrigger className="flex items-center gap-2 hover:bg-accent">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={profile?.avatar_url || ""}
                                alt={profile?.username || user.email || "User"}
                              />
                              <AvatarFallback>
                                {profile?.username?.slice(0, 2).toUpperCase() ||
                                  user.email?.slice(0, 2).toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {profile?.username ||
                                user.email?.split("@")[0] ||
                                "User"}
                            </span>
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <div className="w-[220px] p-2">
                              {accountPages.map((page) => (
                                <Link
                                  key={page.name}
                                  to={page.href}
                                  className="block w-full px-3 py-2 text-sm hover:bg-accent rounded-md flex items-center"
                                >
                                  {page.icon}
                                  {page.name}
                                </Link>
                              ))}
                              <div className="px-2 pt-2 mt-2 border-t border-border">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => signOut()}
                                >
                                  <LogIn className="h-4 w-4 mr-2 rotate-180" />
                                  Sign Out
                                </Button>
                              </div>
                            </div>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      </NavigationMenuList>
                    </NavigationMenu>
                  </>
                )}
              </div>
            ) : (
              <Link to="/auth">
                <Button
                  size={isMobile ? "sm" : "default"}
                  className="flex items-center"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            {isMobile && (
              <div className="ml-2 flex items-center md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobile && mobileMenuOpen && (
        <MobileNav
          isOpen={mobileMenuOpen}
          setIsOpen={setMobileMenuOpen}
          pages={pages}
          accountPages={accountPages}
          isAuthenticated={!!user}
          onSignOut={signOut}
          userProfile={{
            name: profile?.username || user?.email?.split("@")[0] || "Guest",
            avatar: profile?.avatar_url || "",
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;
