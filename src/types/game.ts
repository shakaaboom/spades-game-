import { Suit, Rank, Card } from "@/hooks/use-websocket";
import { Tables } from "@/integrations/supabase/types";

export interface Game extends Tables<"games"> {
  player_count?: number;
  human_players?: number;
  ready_players?: number;
  game_players?: {
    user_id: string | null;
    is_bot: boolean;
    is_ready: boolean;
  }[];
}
export interface SoloGame extends Tables<"solo_games"> {
  player_count?: number;
  human_players?: number;
  ready_players?: number;
  game_players?: {
    user_id: string | null;
    is_bot: boolean;
    is_ready: boolean;
  }[];
}

export interface Team {
  id: string;
  game_id: string;
  name?: string;
  bid: number | null;
  tricks: number;
  score: number;
  sandbags: number;
  created_at: Date;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  team_id?: string;
  position?: 'north' | 'east' | 'south' | 'west';
  is_bot: boolean;
  is_ready: boolean;
  joined_at: Date;
  score: number;
  tricks_bid?: number;
  tricks_won?: number;
}

export interface PlayerCard {
  id: string;
  game_id: string;
  user_id: string;
  suit: Suit;
  rank: Rank;
  is_played: boolean;
  played_at?: Date;
}

export interface Trick {
  id: string;
  game_id: string;
  round_number: number;
  lead_suit?: Suit;
  winner_id?: string;
  team_id?: string;
  completed_at?: Date;
}

export interface TrickCard {
  id: string;
  trick_id: string;
  user_id: string;
  suit: Suit;
  rank: Rank;
  played_at: Date;
}

export interface GameMessage {
  id: string;
  game_id: string;
  user_id: string;
  message: string;
  created_at: Date;
}

export interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  rating: number;
  games_played: number;
  games_won: number;
  created_at: Date;
  updated_at: Date;
}

export interface GameState {
  id: string;
  phase: 'setup' | 'bidding' | 'playing' | 'scoring';
  players: {
    id: string;
    name: string;
    position?: string;
    isBot?: boolean;
    isPartner?: boolean;
    avatar?: string;
  }[];
  teams: {
    id: string;
    players: string[];
    bid: number | null;
    tricks: number;
    score: number;
    sandbags?: number;
  }[];
  currentTurn: string;
  currentHand?: Card[];
  centerCards?: Record<string, Card>;
  spadesBroken?: boolean;
  roundNumber?: number;
  scoreTarget: number;
  roundWinner?: string;
  gameType?: 'solo' | 'partnered'; // Added gameType property
}

// Add WebSocketContextProps here for better type checking across the app
export interface WebSocketContextProps {
  isConnected: boolean;
  socket: any;
  gameMode: string | null;
  gameType: string | null;
  gameState: GameState | null;
  setGameMode: (mode: string) => void;
  setGameType: (type: string) => void;
  joinGame: (gameId: string) => void;
  leaveGame: () => void;
  createGame: (mode: string, type: string, stake: number, pointsToWin: number) => Promise<string | null>;
  sendMessage: (gameId: string, message: string) => void;
  placeBid: (gameId: string, bid: number) => void;
  playCard: (gameId: string, card: Card) => void;
}
