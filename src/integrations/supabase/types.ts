export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          expires_at: string
          id: string
          is_admin_message: boolean | null
          message: string
          timestamp: string
          user_avatar: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          expires_at?: string
          id?: string
          is_admin_message?: boolean | null
          message: string
          timestamp?: string
          user_avatar?: string | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          expires_at?: string
          id?: string
          is_admin_message?: boolean | null
          message?: string
          timestamp?: string
          user_avatar?: string | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      game_messages: {
        Row: {
          created_at: string | null
          game_id: string | null
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_messages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_player_events: {
        Row: {
          created_at: string | null
          event_type: string
          game_id: string
          id: string
          player_id: string
          player_name: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          game_id: string
          id?: string
          player_id: string
          player_name: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          game_id?: string
          id?: string
          player_id?: string
          player_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_player_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_events_game_id_idx"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_events_player_id_idx"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          game_id: string | null
          id: string
          is_bot: boolean
          is_ready: boolean
          joined_at: string | null
          position: string | null
          scores: Json | null
          team_id: string | null
          trick_bids: Json | null
          trick_wons: Json | null
          user_id: string | null
        }
        Insert: {
          game_id?: string | null
          id?: string
          is_bot?: boolean
          is_ready?: boolean
          joined_at?: string | null
          position?: string | null
          scores?: Json | null
          team_id?: string | null
          trick_bids?: Json | null
          trick_wons?: Json | null
          user_id?: string | null
        }
        Update: {
          game_id?: string | null
          id?: string
          is_bot?: boolean
          is_ready?: boolean
          joined_at?: string | null
          position?: string | null
          scores?: Json | null
          team_id?: string | null
          trick_bids?: Json | null
          trick_wons?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rounds: {
        Row: {
          created_at: string
          current_round: number | null
          game_id: string | null
          id: number
          status: string | null
          team_id: string | null
          trick_round_id: string | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          current_round?: number | null
          game_id?: string | null
          id?: number
          status?: string | null
          team_id?: string | null
          trick_round_id?: string | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          current_round?: number | null
          game_id?: string | null
          id?: number
          status?: string | null
          team_id?: string | null
          trick_round_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_rounds_game_id_fkey1"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_team_id_fkey1"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_trick_round_id_fkey"
            columns: ["trick_round_id"]
            isOneToOne: false
            referencedRelation: "trick_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_phase: string
          current_round: number
          id: string
          mode: string | null
          spades_broken: boolean | null
          started_at: string | null
          status: string
          type: string | null
          updated_at: string | null
          wager_amount: number | null
          winner_id: string | null
          winner_team_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_phase?: string
          current_round?: number
          id?: string
          mode?: string | null
          spades_broken?: boolean | null
          started_at?: string | null
          status: string
          type?: string | null
          updated_at?: string | null
          wager_amount?: number | null
          winner_id?: string | null
          winner_team_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_phase?: string
          current_round?: number
          id?: string
          mode?: string | null
          spades_broken?: boolean | null
          started_at?: string | null
          status?: string
          type?: string | null
          updated_at?: string | null
          wager_amount?: number | null
          winner_id?: string | null
          winner_team_id?: string | null
        }
        Relationships: []
      }
      player_cards: {
        Row: {
          game_id: string | null
          id: string
          is_played: boolean
          played_at: string | null
          rank: string
          suit: string
          user_id: string | null
        }
        Insert: {
          game_id?: string | null
          id?: string
          is_played?: boolean
          played_at?: string | null
          rank: string
          suit: string
          user_id?: string | null
        }
        Update: {
          game_id?: string | null
          id?: string
          is_played?: boolean
          played_at?: string | null
          rank?: string
          suit?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_cards_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      player_hands: {
        Row: {
          cards: Json | null
          game_id: string
          id: string
          player_id: string
          trick_round_id: string | null
        }
        Insert: {
          cards?: Json | null
          game_id: string
          id?: string
          player_id: string
          trick_round_id?: string | null
        }
        Update: {
          cards?: Json | null
          game_id?: string
          id?: string
          player_id?: string
          trick_round_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_hands_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_hands_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_hands_trick_round_id_fkey"
            columns: ["trick_round_id"]
            isOneToOne: false
            referencedRelation: "trick_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number | null
          created_at: string | null
          games_played: number | null
          games_won: number | null
          id: string
          rating: number | null
          updated_at: string | null
          username: string | null
          is_online: boolean | null  // ✅ Added
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          games_played?: number | null
          games_won?: number | null
          id: string
          rating?: number | null
          updated_at?: string | null
          username?: string | null
          is_online?: boolean | null  // ✅ Added
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          games_played?: number | null
          games_won?: number | null
          id?: string
          rating?: number | null
          updated_at?: string | null
          username?: string | null
          is_online?: boolean | null  // ✅ Added
        }
        Relationships: []
      }      
      }
      solo_game_rounds: {
        Row: {
          cards_played: Json | null
          current_player: string | null
          game_id: string | null
          id: string
          round_number: number | null
        }
        Insert: {
          cards_played?: Json | null
          current_player?: string | null
          game_id?: string | null
          id?: string
          round_number?: number | null
        }
        Update: {
          cards_played?: Json | null
          current_player?: string | null
          game_id?: string | null
          id?: string
          round_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "solo_game_rounds_current_player_fkey"
            columns: ["current_player"]
            isOneToOne: false
            referencedRelation: "solo_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solo_game_rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "solo_games"
            referencedColumns: ["id"]
          },
        ]
      }
      solo_games: {
        Row: {
          created_at: string
          current_phase: string | null
          current_round: number | null
          id: string
          spades_broken: boolean | null
          status: string | null
          wager_amount: number | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          current_phase?: string | null
          current_round?: number | null
          id?: string
          spades_broken?: boolean | null
          status?: string | null
          wager_amount?: number | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          current_phase?: string | null
          current_round?: number | null
          id?: string
          spades_broken?: boolean | null
          status?: string | null
          wager_amount?: number | null
          winner_id?: string | null
        }
        Relationships: []
      }
      solo_player_hands: {
        Row: {
          cards: Json | null
          game_id: string
          id: string
          player_id: string
        }
        Insert: {
          cards?: Json | null
          game_id: string
          id?: string
          player_id: string
        }
        Update: {
          cards?: Json | null
          game_id?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solo_player_hands_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "solo_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solo_player_hands_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "solo_players"
            referencedColumns: ["id"]
          },
        ]
      }
      solo_players: {
        Row: {
          created_at: string
          game_id: string | null
          id: string
          position: number | null
          score: number | null
          tricks_bid: number | null
          tricks_won: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          game_id?: string | null
          id?: string
          position?: number | null
          score?: number | null
          tricks_bid?: number | null
          tricks_won?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          game_id?: string | null
          id?: string
          position?: number | null
          score?: number | null
          tricks_bid?: number | null
          tricks_won?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solo_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "solo_games"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          bid: number | null
          created_at: string | null
          game_id: string | null
          id: string
          name: string | null
          sandbags: number
          score: number
          tricks: number
        }
        Insert: {
          bid?: number | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          name?: string | null
          sandbags?: number
          score?: number
          tricks?: number
        }
        Update: {
          bid?: number | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          name?: string | null
          sandbags?: number
          score?: number
          tricks?: number
        }
        Relationships: [
          {
            foreignKeyName: "teams_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_id: string | null
          payment_method: string
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_id?: string | null
          payment_method: string
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_id?: string | null
          payment_method?: string
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trick_cards: {
        Row: {
          id: string
          played_at: string | null
          rank: string
          suit: string
          trick_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          played_at?: string | null
          rank: string
          suit: string
          trick_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          played_at?: string | null
          rank?: string
          suit?: string
          trick_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trick_rounds: {
        Row: {
          cards_played: Json | null
          completed_at: string | null
          current_player: string | null
          game_id: string | null
          id: string
          lead_suit: string | null
          started_at: string | null
          team_id: string | null
          trick_round_number: number
        }
        Insert: {
          cards_played?: Json | null
          completed_at?: string | null
          current_player?: string | null
          game_id?: string | null
          id?: string
          lead_suit?: string | null
          started_at?: string | null
          team_id?: string | null
          trick_round_number: number
        }
        Update: {
          cards_played?: Json | null
          completed_at?: string | null
          current_player?: string | null
          game_id?: string | null
          id?: string
          lead_suit?: string | null
          started_at?: string | null
          team_id?: string | null
          trick_round_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_rounds_current_player_fkey"
            columns: ["current_player"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_game_with_type: {
        Args: {
          p_mode: string
          p_type: string
          p_wager_amount: number
          p_created_by: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
