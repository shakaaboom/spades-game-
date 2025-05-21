export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  balance: number | null;
  rating: number | null;
  games_played: number | null;
  games_won: number | null;
  created_at: string | null;
  updated_at: string | null;
  is_online: boolean | null;
} 