
import { supabase } from "@/integrations/supabase/client";
import { GameIdResult, PlayerDataResult } from "@/types/waiting-room";

/**
 * Finds available games matching the given criteria
 */
export const findAvailableGames = async (
  gameType: string,
  gameMode: 'practice' | 'real',
  wagerAmount: number
) => {
  return await supabase
    .from('games')
    .select('id')
    .eq('status', 'waiting')
    .eq('type', gameType)
    .eq('mode', gameMode)
    .eq('wager_amount', wagerAmount)
    .limit(5);
};

/**
 * Gets player data for a specific game
 */
export const getGamePlayers = async (gameId: string) => {
  return await supabase
    .from('game_players')
    .select('user_id, position, is_ready')
    .eq('game_id', gameId);
};

/**
 * Creates a new game with the given parameters
 */
export const createGame = async (
  gameMode: 'practice' | 'real',
  gameType: string,
  wagerAmount: number,
  userId: string
) => {
  try {
    console.log("Creating new game with parameters:", {
      gameMode,
      gameType,
      wagerAmount,
      userId
    });
    
    // Try direct insert first
    const { data: newGame, error: createError } = await supabase
      .from('games')
      .insert({
        status: 'waiting',
        mode: gameMode,
        type: gameType,
        wager_amount: wagerAmount,
        current_phase: 'setup',
        created_by: userId
      })
      .select('id')
      .single();

    if (createError) {
      console.error("Error creating game:", createError);
      console.error("Received error details:", createError.details);
      console.error("Received error hint:", createError.hint);
      
      // Fall back to RPC if direct insert fails
      console.log("Trying RPC as fallback...");
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('create_game_with_type', { 
          p_mode: gameMode, 
          p_type: gameType, 
          p_wager_amount: wagerAmount, 
          p_created_by: userId 
        });

      if (rpcError) {
        console.error("Both direct insert and RPC failed:", rpcError);
        console.error("Received RPC error details:", rpcError.details);
        console.error("Received RPC error hint:", rpcError.hint);
        return null;
      }
      
      return rpcResult;
    }
    
    console.log("Successfully created game with ID:", newGame.id);
    return newGame.id;
  } catch (error) {
    console.error("Unexpected error creating game:", error);
    return null;
  }
};
