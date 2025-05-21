import { FC } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogIn, LogOut } from "lucide-react";
import BalanceDisplay from "@/components/wallet/BalanceDisplay";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface MobileNavProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  pages: NavItem[];
  accountPages: NavItem[];
  isAuthenticated: boolean;
  onSignOut: () => Promise<boolean>;
  userProfile: {
    name: string;
    avatar: string;
  };
}

const MobileNav: FC<MobileNavProps> = ({
  isOpen,
  setIsOpen,
  pages,
  accountPages,
  isAuthenticated,
  onSignOut,
  userProfile
}) => {
  return (
    <div className="md:hidden bg-background border-b border-border">
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        {isAuthenticated && (
          <div className="p-3">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar>
                <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                <AvatarFallback>{userProfile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <BalanceDisplay className="mr-2" />
              <div>
                <p className="font-medium">{userProfile.name}</p>
                <p className="text-xs text-muted-foreground">Player Account</p>
              </div>
            </div>
            <Separator />
          </div>
        )}

        {pages.map((page) => (
          <Link
            key={page.name}
            to={page.href}
            className="flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground"
            onClick={() => setIsOpen(false)}
          >
            {page.icon}
            {page.name}
          </Link>
        ))}
        
        {isAuthenticated && (
          <>
            <Separator className="my-2" />
            
            {accountPages.map((page) => (
              <Link
                key={page.name}
                to={page.href}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsOpen(false)}
              >
                {page.icon}
                {page.name}
              </Link>
            ))}
            
            <div className="px-3 py-2">
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </>
        )}
        
        {!isAuthenticated && (
          <div className="px-3 py-2">
            <Link to="/auth" onClick={() => setIsOpen(false)}>
              <Button className="w-full flex items-center">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileNav;
