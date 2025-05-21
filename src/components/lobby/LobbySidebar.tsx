
import OnlinePlayersList from "@/components/lobby/OnlinePlayersList";
import { OnlinePlayer } from "@/types/lobby";

interface LobbySidebarProps {
  onlinePlayers: OnlinePlayer[];
  totalOnlinePlayers: number;
}

const LobbySidebar = ({ onlinePlayers, totalOnlinePlayers }: LobbySidebarProps) => {
  return (
    <div className="space-y-4 md:space-y-6">
      <OnlinePlayersList 
        players={onlinePlayers}
        totalOnline={totalOnlinePlayers}
      />
      {/* Removed LobbyChat since we're using CollapsibleChat globally */}
    </div>
  );
};

export default LobbySidebar;
