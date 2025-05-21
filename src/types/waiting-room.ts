
import { User } from "@supabase/supabase-js";

export interface WaitingRoomPlayer {
  id: string;
  name: string;
  avatar?: string;
  isReady: boolean;
  isHost: boolean;
  position?: string;
}

export interface WaitingRoomState {
  id: string;
  status: 'setup' | 'waiting' | 'starting' | 'in_progress';
  players: WaitingRoomPlayer[];
  gameMode: string;
  gameType: string;
  wagerAmount?: number;
  createdAt: Date;
}

export interface UseWaitingRoomProps {
  roomId?: string;
  mode?: 'practice' | 'real';
  gameType?: 'solo' | 'partnered';
  wagerAmount?: number;
}

export interface GameData {
  id: string;
  status: string;
  mode: string;
  current_turn?: string;
  current_phase: string;
  spades_broken: boolean;
  round_number: number;
  score_target: number;
  created_at: string;
  updated_at: string;
  winner_team_id?: string;
  created_by?: string;
  type?: string;
  wager_amount?: number;
}

export interface GamePlayerData {
  user_id: string;
  position: string;
  is_ready: boolean;
}

export interface SimpleGameData {
  id: string;
  players: GamePlayerData[];
}

export interface GameIdResult {
  id: string;
}

export interface PlayerDataResult {
  user_id: string;
  position: string;
  is_ready: boolean;
}

export interface NewGameResult {
  id: string;
}
