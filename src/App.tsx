import { Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import WebSocketProvider from "@/contexts/WebSocketContext";
import { useEffect } from "react";
import CollapsibleChat from "@/components/chat/CollapsibleChat";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Auth from "@/pages/Auth";
import Lobby from "@/pages/Lobby";
import GamesList from "@/pages/GamesList";
import SimpleGamesList from "@/pages/SimpleGamesList";
import SimpleWaitingRoom from "@/pages/SimpleWaitingRoom";
import WaitingRoom from "@/pages/WaitingRoom";
import GameTable from "@/pages/GameTable";
import Profile from "@/pages/Profile";
import Wallet from "@/pages/Wallet";
import Admin from "@/pages/Admin";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import HowToPlay from "@/pages/HowToPlay";
import Support from "@/pages/Support";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import ResponsibleGaming from "@/pages/ResponsibleGaming";
import GameModeSelection from "@/pages/GameModeSelection";
import Leaderboard from "@/pages/Leaderboard";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Import styles
import "./App.css";
import PracticePage from "./pages/PracticePage";
import RealGamePage from "./pages/RealGamePage";
import useOnlineStatus from "./hooks/use-online-status";
import { useAuth } from "./hooks/use-auth";
// Scroll to top component - but exclude certain routes from auto-scrolling
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only scroll to top for routes that need it (excluding waiting room routes)
    if (
      !pathname.includes("waiting-room") &&
      !pathname.includes("simple-waiting-room")
    ) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

function UpdateOnlineStatus() {
  const { user } = useAuth();

  useOnlineStatus(user?.id);

  return null;
}
// Routes that should display the chat component
const chatRoutes = [
  "/lobby",
  "/leaderboard",
  "/how-to-play",
  "/wallet",
  "/profile",
  "/settings",
  "/support",
];

function App() {
  const { pathname } = useLocation();
  const shouldShowChat = chatRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  return (
    <ThemeProvider defaultTheme="dark" storageKey="spades-theme">
      <AuthProvider>
        <WebSocketProvider>
          <UpdateOnlineStatus />
          <ScrollToTop />
        
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/how-to-play" element={<HowToPlay />} />
            <Route path="/support" element={<Support />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/responsible-gaming" element={<ResponsibleGaming />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/games/:gameType" element={<GamesList />} />
              <Route
                path="/simple-games/:gameType"
                element={<SimpleGamesList />}
              />
              <Route path="/waiting-room/:id" element={<SimpleWaitingRoom />} />
              <Route
                path="/simple-waiting-room/:id"
                element={<SimpleWaitingRoom />}
              />
              <Route path="/game/practice" element={<PracticePage />} />
              <Route path="/game/:id" element={<RealGamePage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/game-mode" element={<GameModeSelection />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          {shouldShowChat && <CollapsibleChat />}
          <Toaster />
          <Sonner />
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
