
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
  onContactAdmin?: () => void;
}

const Footer = ({ className, onContactAdmin }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: "Game",
      links: [
        { name: "Lobby", path: "/lobby" },
        { name: "Leaderboard", path: "/leaderboard" },
        { name: "How to Play", path: "/how-to-play" },
      ],
    },
    {
      title: "Account",
      links: [
        { name: "Sign In", path: "/login" },
        { name: "Sign Up", path: "/register" },
        { name: "Settings", path: "/settings" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Terms of Service", path: "/terms" },
        { name: "Privacy Policy", path: "/privacy" },
        { name: "Responsible Gaming", path: "/responsible-gaming" },
      ],
    },
  ];

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onContactAdmin) {
      onContactAdmin();
    }
  };

  return (
    <footer className={cn("bg-background border-t border-border py-6", className)}>
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Spades for Cash
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              A real-money multiplayer Spades game where players can compete in solo
              and partnered modes with real-time gameplay.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Spades for Cash. A subsidiary of New Folder Corporation. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <button
              onClick={handleContactClick}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </button>
            <Link
              to="/support"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
