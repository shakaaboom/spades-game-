
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GameState, WebSocketContextProps } from "@/types/game";
import { useAuth } from "@/hooks/use-auth";

// Define card types
export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
}

const WebSocketContext = createContext<WebSocketContextProps>({
  isConnected: false,
  socket: null,
  gameMode: null,
  gameType: null,
  gameState: null,
  setGameMode: () => {},
  setGameType: () => {},
  joinGame: () => {},
  leaveGame: () => {},
  createGame: async () => null,
  sendMessage: () => {},
  placeBid: () => {},
  playCard: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [gameMode, setGameMode] = useState<string | null>(null);
  const [gameType, setGameType] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const { toast } = useToast();
  const [socket, setSocket] = useState<any>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    const initConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          setIsConnected(false);
          return;
        }
        setIsConnected(true);
      } catch (error) {
        console.error("Error initializing connection:", error);
        setIsConnected(false);
      }
    };

    initConnection();

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [channels]);

  const handleSetGameMode = (mode: string) => {
    setGameMode(mode);
  };

  const handleSetGameType = (type: string) => {
    setGameType(type);
  };

  const joinGame = (gameId: string) => {
    if (!gameId) return;
    
    setCurrentGameId(gameId);
    
    const gameChannel = supabase
      .channel(`game-${gameId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = gameChannel.presenceState();
        console.log('Presence state updated:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        toast({
          title: "Player joined",
          description: `${newPresences[0]?.user_name || 'A player'} has joined the game`,
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        toast({
          title: "Player left",
          description: `${leftPresences[0]?.user_name || 'A player'} has left the game`,
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await gameChannel.track({
            user_id: user?.id || 'guest',
            user_name: profile?.username || user?.email?.split('@')[0] || 'Guest',
            online_at: new Date().toISOString(),
          });
          
          fetchGameState(gameId);
        }
      });

    const dbChangesChannel = supabase
      .channel('game-db-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}` 
      }, (payload) => {
        console.log('Game updated:', payload);
        fetchGameState(gameId);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_players',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        console.log('Players updated:', payload);
        fetchGameState(gameId);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        console.log('Teams updated:', payload);
        fetchGameState(gameId);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_cards',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        console.log('Cards updated:', payload);
        fetchGameState(gameId);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_messages',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        console.log('New message:', payload);
      })
      .subscribe();

    setChannels(prev => [...prev, gameChannel, dbChangesChannel]);

    setGameState({
      id: gameId,
      phase: 'setup',
      players: [
        { id: user?.id || 'player-1', name: profile?.username || 'You', position: 'south' },
        { id: 'player-2', name: 'Bot 1', position: 'west', isBot: true },
        { id: 'player-3', name: 'Bot 2', position: 'north', isBot: true, isPartner: true },
        { id: 'player-4', name: 'Bot 3', position: 'east', isBot: true },
      ],
      teams: [
        { id: 'team-1', players: [user?.id || 'player-1', 'player-3'], bid: null, tricks: 0, score: 0 },
        { id: 'team-2', players: ['player-2', 'player-4'], bid: null, tricks: 0, score: 0 },
      ],
      currentTurn: user?.id || 'player-1',
      currentHand: [
        { suit: 'hearts', rank: 'A' },
        { suit: 'hearts', rank: 'K' },
        { suit: 'spades', rank: 'Q' },
        { suit: 'diamonds', rank: '10' },
      ],
      centerCards: {},
      spadesBroken: false,
      scoreTarget: 200,
      gameType: gameType as 'solo' | 'partnered' || 'solo', // Add the gameType property with fallback
    });
  };

  const leaveGame = () => {
    if (currentGameId) {
      channels.forEach(channel => supabase.removeChannel(channel));
      setChannels([]);
      setCurrentGameId(null);
      setGameState(null);
      // TODO: check if this is needed
      setGameMode(null);
      setGameType(null);
      // TODO-EN: check if this is needed
    }
  };

  const fetchGameState = async (gameId: string) => {
    try {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) {
        console.error("Error fetching game:", gameError);
        return;
      }

      const { data: playersData, error: playersError } = await supabase
        .from('game_players')
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .eq('game_id', gameId);

      if (playersError) {
        console.error("Error fetching players:", playersError);
        return;
      }

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('game_id', gameId);

      if (teamsError) {
        console.error("Error fetching teams:", teamsError);
        return;
      }

      const { data: cardsData, error: cardsError } = await supabase
        .from('player_cards')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', user?.id || 'guest')
        .eq('is_played', false);

      if (cardsError) {
        console.error("Error fetching cards:", cardsError);
        return;
      }

      const transformedPlayers = playersData.map((player: any) => {
        // Use type assertion for profile data
        const profileData = player.profiles as any;
        return {
          id: player.user_id,
          name: profileData?.username || 'Unknown Player',
          position: player.position,
          isBot: player.is_bot,
          avatar: profileData?.avatar_url,
          isPartner: teamsData.some((team: any) => 
            team.id === player.team_id && 
            playersData.some((p: any) => p.team_id === team.id && p.user_id !== player.user_id)
          )
        };
      });

      const transformedTeams = teamsData.map((team: any) => ({
        id: team.id,
        players: playersData
          .filter((player: any) => player.team_id === team.id)
          .map((player: any) => player.user_id),
        bid: team.bid,
        tricks: team.tricks,
        score: team.score,
        sandbags: team.sandbags
      }));

      const transformedHand = cardsData.map((card: any) => ({
        suit: card.suit as Suit,
        rank: card.rank as Rank
      }));

      let phase: 'setup' | 'bidding' | 'playing' | 'scoring';
      if (gameData.current_phase === 'setup' || 
          gameData.current_phase === 'bidding' || 
          gameData.current_phase === 'playing' || 
          gameData.current_phase === 'scoring') {
        phase = gameData.current_phase as 'setup' | 'bidding' | 'playing' | 'scoring';
      } else {
        phase = 'setup';
      }

      // setGameState({
      //   id: gameData.id,
      //   phase: phase,
      //   players: transformedPlayers,
      //   teams: transformedTeams,
      //   currentTurn: gameData.current_turn || transformedPlayers[0]?.id,
      //   currentHand: transformedHand,
      //   centerCards: {},
      //   spadesBroken: gameData.spades_broken,
      //   roundNumber: gameData.round_number,
      //   scoreTarget: gameData.score_target,
      //   roundWinner: undefined,
      //   gameType: gameData.type as 'solo' | 'partnered' || gameType as 'solo' | 'partnered' || 'solo', // Add gameType with fallbacks
      // });

    } catch (error) {
      console.error("Error fetching game state:", error);
    }
  };

  const createGame = async (
    mode: string, 
    gameType: string, 
    stake: number, 
    pointsToWin: number
  ): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a game",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          status: 'setup',
          mode: mode === 'partnered' ? 'partnered' : 'solo',
          current_phase: 'setup',
          score_target: pointsToWin,
          created_by: user.id
        })
        .select()
        .single();

      if (gameError) {
        console.error("Error creating game:", gameError);
        return null;
      }

      const gameId = gameData.id;

      if (mode === 'partnered') {
        const { error: teamsError } = await supabase
          .from('teams')
          .insert([
            { game_id: gameId, name: 'Team 1' },
            { game_id: gameId, name: 'Team 2' }
          ]);

        if (teamsError) {
          console.error("Error creating teams:", teamsError);
          return null;
        }
      } else {
        const { error: teamError } = await supabase
          .from('teams')
          .insert({ game_id: gameId, name: 'Solo Player' });

        if (teamError) {
          console.error("Error creating team:", teamError);
          return null;
        }
      }

      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: gameId,
          user_id: user.id,
          position: 'south',
          is_ready: true
        });

      if (playerError) {
        console.error("Error adding player to game:", playerError);
        return null;
      }

      return gameId;
    } catch (error) {
      console.error("Error creating game:", error);
      return null;
    }
  };

  const sendMessage = (gameId: string, message: string) => {
    if (!gameId || !message.trim() || !user) return;

    supabase
      .from('game_messages')
      .insert({
        game_id: gameId,
        user_id: user.id,
        message: message
      })
      .then(({ error }) => {
        if (error) {
          console.error("Error sending message:", error);
        }
      });
  };

  const placeBid = (gameId: string, bid: number) => {
    if (!gameId || !gameState || !user) return;

    const currentPlayerId = user.id;
    const playerTeam = gameState.teams.find(team => 
      team.players.includes(currentPlayerId)
    );

    if (playerTeam) {
      supabase
        .from('teams')
        .update({ bid })
        .eq('id', playerTeam.id)
        .then(({ error }) => {
          if (error) {
            console.error("Error placing bid:", error);
          }
        });
    }
  };

  const playCard = (gameId: string, card: Card) => {
    if (!gameId || !gameState || !user) return;

    supabase
      .from('player_cards')
      .update({ 
        is_played: true,
        played_at: new Date().toISOString()
      })
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .eq('suit', card.suit)
      .eq('rank', card.rank)
      .then(({ error }) => {
        if (error) {
          console.error("Error playing card:", error);
        }
      });
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        socket,
        gameMode,
        gameType,
        gameState,
        setGameMode: handleSetGameMode,
        setGameType: handleSetGameType,
        joinGame,
        leaveGame,
        createGame,
        sendMessage,
        placeBid,
        playCard,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
