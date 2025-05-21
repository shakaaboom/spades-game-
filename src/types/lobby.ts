
export interface GameTable {
  id: string;
  mode: "solo" | "partnered";
  stake: number;
  players: number;
  maxPlayers: number;
  pointsToWin: number;
  status: "open" | "in-progress" | "full";
  createdAt?: Date;
  createdBy?: string;
}

export interface OnlinePlayer {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  status: "online" | "in-game";
  lastActive?: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
}

export interface TableFilters {
  stake: number | null;
  pointsToWin: number | null;
  playersCount: number | null;
}

export interface WalletTransaction {
  id: string;
  type: "deposit" | "withdrawal" | "game-entry" | "game-winnings";
  amount: number;
  status: "pending" | "completed" | "failed";
  timestamp: Date;
  details?: string;
}
