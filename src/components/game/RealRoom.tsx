import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { Bot, DollarSign, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Game } from "@/types/game";

import {
  Card,
  isValidPlay,
  PlayerPosition,
  submitBid,
  playCard,
} from "../../lib/gameLogic";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import BidSetModal from "./BidSetModal";
import { WinnerDialog } from "./WinnerModal";
import { ScoreDialog } from "./scoreMOdal";

interface SoloPlayer extends Tables<"solo_players"> {
  score: number;
  tricks_bid: number;
  tricks_won: number;
  position: number;
}
interface Player extends Tables<"game_players"> {
  score?: number;
  tricks_bid?: number;
  tricks_won?: number;
}

interface RealRoomProps {
  session: Session;
  wager: number;
}

function renderCard(
  card: Card,
  isPlayable: boolean = true,
  selected: boolean = false,
  handleCardPlay?: (card: Card) => void
) {
  const suitSymbol =
    card.suit === "hearts"
      ? "♥"
      : card.suit === "diamonds"
      ? "♦"
      : card.suit === "clubs"
      ? "♣"
      : "♠";

  const value =
    card.value === 14
      ? "A"
      : card.value === 13
      ? "K"
      : card.value === 12
      ? "Q"
      : card.value === 11
      ? "J"
      : card.value?.toString();

  return (
    <motion.div
      key={`${card.suit}-${card.value}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={isPlayable ? { scale: 1.1, y: -10 } : {}}
      className={`relative w-20 h-32 bg-white rounded-lg shadow-md flex items-center justify-center 
        ${isPlayable ? "cursor-pointer hover:shadow-lg" : ""} 
        ${selected ? "ring-2 ring-blue-500" : ""}`}
      onClick={() => isPlayable && handleCardPlay && handleCardPlay(card)}
    >
      <div
        className={`text-2xl ${
          card.suit === "hearts" || card.suit === "diamonds"
            ? "text-red-600"
            : "text-black"
        }`}
      >
        {value}
        <span className="ml-1">{suitSymbol}</span>
      </div>
    </motion.div>
  );
}

const PlayerTurnDisplay = ({
  players,
  myPlayerIndex,
  checkPlayerTurn,
  playerProfiles,
  timeLeft,

  announcingBid,
  isCurrentPlayer,
}) => {
  const player = players[myPlayerIndex];
  const isPlayerTurn = checkPlayerTurn(player?.id);
  const username = playerProfiles[player?.user_id]?.username || "Unknown";
  const progress = (timeLeft / TOTAL_TIMER) * 100;

  return (
    <div className="bg-gray-800 p-4 rounded-lg relative">
      {/*   {isPlayerTurn && (
        <p className="text-sm text-white mb-1">Time left: {timeLeft}s</p>
      )} */}

      {announcingBid?.playerId === player?.id && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute -top-8 left-0 w-full text-center"
        >
          <div
            className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
              announcingBid?.isNil
                ? "bg-red-900/80 text-red-100"
                : "bg-green-900/80 text-green-100"
            }`}
          >
            Bid: {announcingBid?.isNil ? "Nil!" : announcingBid?.bid}
          </div>
        </motion.div>
      )}

      <div
        className={`font-bold mb-2 ${
          isPlayerTurn ? "text-green-500" : "text-white"
        }`}
      >
        {username}
      </div>
      <div className="text-sm">
        Score: {player?.score || 0}
        {player?.tricks_bid !== undefined && (
          <span> | Bid: {player?.tricks_bid ?? "Not placed"}</span>
        )}
        {player?.tricks_won !== undefined && (
          <span> | Tricks: {player?.tricks_won}</span>
        )}
      </div>
      {isPlayerTurn && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600 rounded overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

const TURN_TIMER = 10000;
const TOTAL_TIMER = TURN_TIMER / 5000;

export default function RealRoom({ session, wager }: RealRoomProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roundData, setRoundData] = useState<Tables<"solo_game_rounds"> | null>(
    null
  );
  const [playerProfiles, setPlayerProfiles] = useState<
    Record<string, { username: string }>
  >({});

  const [playerBids, setPlayerBids] = useState<Record<string, number>>({});

  const [isFetchingGame, setIsFetchingGame] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isNilBid, setIsNilBid] = useState(false);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<SoloPlayer[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [currentTrick, setCurrentTrick] = useState<Card[]>([]);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [brokenSpades, setBrokenSpades] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState(0); // my index in the game , e.g  Player 4

  const [currentBiddingPlayerId, setCurrentBiddingPlayerId] = useState<
    string | null
  >(null);

  const [currentRound, setCurrentRound] =
    useState<Tables<"solo_game_rounds"> | null>(null);
  const [currentPlayerPosition, setCurrentPlayerPosition] =
    useState<PlayerPosition | null>(null);
  /*   useEffect(() => {
    async function fetchRoundData() {
      if (!id || !currentGame) return;
      const { data, error } = await supabase
        .from("solo_game_rounds")
        .select("*")
        .eq("game_id", id)
        .eq("round_number", currentGame?.current_round)
        .maybeSingle();

      if (!error && data) {
        setRoundData(data);
      }
    }

    fetchRoundData();
  }, [id, currentGame]); */
  // more enhancements
  const [roundComplete, setRoundComplete] = useState(false);
  const [roundSummary, setRoundSummary] = useState<{
    playerScores: Record<string, number>;
    sandbags: Record<string, number>;
  } | null>(null);

  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);

  const [winner, setWinner] = useState<SoloPlayer | null>(null);

  const [announcingBid, setAnnouncingBid] = useState<{
    playerPosition?: number;
    playerId: string;
    bid: number;
    isNil: boolean;
  } | null>(null);

  const [showBidDialog, setShowBidDialog] = useState(false); // Show modal to everyone

  const [timeLeft, setTimeLeft] = useState(TOTAL_TIMER);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isBidSubmitted, setIsBidSubmitted] = useState(false);

  const bidAmountRef = useRef(bidAmount);
  const isNilBidRef = useRef(isNilBid);

  useEffect(() => {
    bidAmountRef.current = bidAmount;
    isNilBidRef.current = isNilBid;
  }, [bidAmount, isNilBid]);

  useEffect(() => {
    if (!currentGame || currentGame?.current_phase !== "bidding") return;

    const isMyTurnBidding =
      players[myPlayerIndex]?.id === currentBiddingPlayerId;

    setShowBidDialog(isMyTurnBidding && !isBidSubmitted);
    setTimeLeft(TOTAL_TIMER);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (isMyTurnBidding) {
            const randomBid = Math.floor(Math.random() * 13) + 1;
            handleBid(randomBid);
            setShowBidDialog(false);
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current); // Ensure no timer is left running
      }
    };
  }, [currentGame, isBidSubmitted, currentBiddingPlayerId]);

  useEffect(() => {
    if (!currentGame || currentGame?.current_phase !== "playing") return;

    const isMyTurn = players[myPlayerIndex]?.id === currentPlayerId;

    setTimeLeft(TOTAL_TIMER);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (isMyTurn) autoPlayCard();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current); // Ensure no timer is left running
      }
    };
  }, [currentGame, currentPlayerId]);

  const autoPlayCard = () => {
    if (!hand || hand.length === 0) return;

    // Filter out invalid cards
    const validCards = hand.filter((card) =>
      isValidPlay(card, hand, currentTrick, brokenSpades)
    );

    if (validCards.length > 0) {
      const selectedCard = selectBestCard(validCards);
      handlePlayCard(selectedCard);
    } else {
      console.warn("No valid cards to auto-play");
    }
  };

  const selectBestCard = (validCards: Card[]): Card => {
    const cardOrder = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
      "A",
    ];

    return validCards.sort(
      (a, b) => cardOrder.indexOf(a.value) - cardOrder.indexOf(b.value)
    )[0];
  };

  useEffect(() => {
    async function fetchPlayerProfiles() {
      const playerIds = players.map((player) => player.user_id);

      if (playerIds.length === 0) return;

      const { data, error } = await supabase
        .from("profiles") // Replace with your actual table name for users
        .select("id, username")
        .in("id", playerIds);

      if (error) {
        console.error("Error fetching player profiles:", error);
        return;
      }

      const profiles = data.reduce((acc, user) => {
        acc[user.id] = { username: user.username };
        return acc;
      }, {} as Record<string, { username: string }>);

      setPlayerProfiles(profiles);
    }

    fetchPlayerProfiles();
  }, [players]);

  useEffect(() => {
    // subscribe to game updates
    const gameSubscription = supabase
      .channel("game-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        (payload) => {
          if (id) {
            console.log("game updated:", payload);
            fetchGameState();
          }
        }
      )
      .subscribe();

    const playerSubscription = supabase
      .channel("player-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solo_players" },
        (payload) => {
          if (id) {
            console.log("player updated:", payload);
            fetchGameState();
          }
        }
      )
      .subscribe();

    const roundSubscription = supabase
      .channel("round-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solo_game_rounds" },
        (payload) => {
          if (id) {
            console.log("round updated:", payload);
            fetchGameState();
          }
        }
      )
      .subscribe();
    // subscribe to player hand updates
    const playerHandSubscription = supabase
      .channel("player-hand-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solo_player_hands" },
        (payload) => {
          if (id) {
            console.log("player hand updated:", payload);
            fetchGameState();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerSubscription);
      supabase.removeChannel(roundSubscription);
      supabase.removeChannel(gameSubscription);
      supabase.removeChannel(playerHandSubscription);
    };
  }, [currentGame]);

  useEffect(() => {
    fetchGameState();
  }, [id]);

  const getCardPositionByIndex = (index: number) => {
    const trick = currentTrick.find((c) => c.playedBy === index);
    return trick || null;
  };

  async function fetchGameState() {
    if (!id) return;
    if (!isGameStarted) {
      // fetch game data
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", id)
        .single();
      if (gameError) throw gameError;
      if (gameData.current_phase === "setup") {
        console.log("Game is in setup phase");
        return;
      }
    }
    try {
      setIsFetchingGame(true);
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", id)
        .single();

      if (gameError) throw gameError;
      setCurrentGame(gameData);
      // check if spades are broken
      setBrokenSpades(gameData.spades_broken);

      // fetch players
      const { data: gamePlayers, error: playerError } = await supabase
        .from("solo_players")
        .select("*")
        .eq("game_id", id)
        .order("position");

      if (playerError) throw playerError;
      setPlayers(gamePlayers || []);

      const updatedBids = gamePlayers.reduce((acc, player) => {
        acc[player.id] = player.tricks_bid;
        return acc;
      }, {} as Record<string, number | null>);

      setPlayerBids(updatedBids);

      // check if the current player is still in the game
      const isPlayerInGame = gamePlayers.some(
        (player) => player.user_id === session.user.id
      );

      if (!isPlayerInGame) {
        console.log("Player not in game, redirecting to home");
        navigate("/");
        return;
      }

      // fetch current player's hand
      const myPlayer = gamePlayers.find(
        (player) => player.user_id === session.user.id
      );
      if (!myPlayer) {
        navigate("/");
        return;
      }

      setMyPlayerId(myPlayer.id);

      const { data: playerHand, error: handError } = await supabase
        .from("solo_player_hands")
        .select("cards")
        .eq("game_id", id)
        .eq("player_id", myPlayer.id)
        .maybeSingle();

      if (handError) throw handError;
      if (playerHand?.cards) {
        setHand(playerHand.cards as any as Card[]);
      }

      setMyPlayerIndex(myPlayer.position);
      console.log("myPlayer", myPlayer);

      // fetch current trick and round info
      const { data: currentRoundData, error: currentRoundError } =
        await supabase
          .from("solo_game_rounds")
          .select("*")
          .eq("game_id", id)
          .eq("round_number", gameData.current_round)
          .maybeSingle();

      if (currentRoundError) throw currentRoundError;

      // set current player id for turn management
      setCurrentPlayerId(currentRoundData.current_player);

      const cards = (currentRoundData.cards_played as Card[]) || [];

      if (cards.length % 4 === 0) {
        setCurrentTrick([]);
      } else {
        setCurrentTrick((prev) => [...prev, cards[cards.length - 1]]);
      }

      setCurrentRound(currentRoundData);

      // set current bidding player
      if (gameData.current_phase === "bidding") {
        setCurrentBiddingPlayerId(currentRoundData.current_player);
      } else {
        setCurrentBiddingPlayerId(null);
      }

      // handle game end
      if (gameData.current_phase === "finished" && gameData.winner_id) {
        const _winner = gamePlayers.find(
          (player) => player.user_id === gameData.winner_id
        );
        if (_winner) {
          setWinner(_winner);
          setShowWinnerDialog(true);
          toast({
            title: "Game Over",
            description:
              _winner.user_id === session.user.id
                ? "You won!"
                : `Player ${_winner.position} won!`,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching game state:", error);
      toast({
        title: "Error",
        description: "Failed to fetch game state",
      });
    } finally {
      setIsFetchingGame(false);
    }
  }

  useEffect(() => {
    if (currentRound?.round_number > 1) setShowScoreDialog(true);
  }, [currentRound]);

  const resetGameState = () => {
    setCurrentGame(null);
    setPlayers([]);
    setHand([]);
    setCurrentTrick([]);
    setBidAmount(0);
    setBrokenSpades(false);
    setCurrentPlayerId(null);
    setCurrentPlayerPosition(null);
    setCurrentBiddingPlayerId(null);
  };

  useEffect(() => {
    if (!currentGame) return;

    const channel = supabase
      .channel(`game:${currentGame.id}`)
      .on("broadcast", { event: "bid_placed" }, (res) => {
        if (res)
          setAnnouncingBid({
            playerId: res.payload.player_id,
            bid: res.payload.bid,
            isNil: res.payload.is_nil,
          });

        setTimeout(() => setAnnouncingBid(null), 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentGame, myPlayerId]);

  const handleBid = async (bidAmount: number) => {
    if (!currentGame || !currentPlayerId) return;

    // Use the latest values from refs
    const bidValue = isNilBidRef.current ? 0 : bidAmountRef.current; // Use the ref for the latest value
    console.log("Submitting bid:", bidValue); // Debugging line

    try {
      await submitBid(
        currentGame.id,
        myPlayerId,
        bidValue,
        currentGame.current_round
      );

      setIsBidSubmitted(true);

      // Broadcast the bid to other players
      await supabase.channel(`game:${currentGame.id}`).send({
        type: "broadcast",
        event: "bid_placed",
        payload: {
          player_id: myPlayerId,
          player_position: myPlayerIndex,
          bid: bidValue,
          is_nil: isNilBidRef.current,
        },
      });

      await fetchGameState();
    } catch (error) {
      console.error("Error submitting bid:", error);
      toast({
        title: "Error",
        description: "Failed to submit bid",
      });
    }
  };

  const [isStartPlaying, setIsStartPlaying] = useState(false);

  const handlePlayCard = async (card: Card) => {
    if (!currentGame || !currentPlayerId || isStartPlaying) return;
    try {
      setIsStartPlaying(true);
      // check if the current player's turn
      const { data: roundData, error: roundError } = await supabase
        .from("solo_game_rounds")
        .select("*")
        .eq("game_id", currentGame.id)
        .eq("round_number", currentGame.current_round)
        .maybeSingle();

      if (roundError) throw roundError;

      if (!isValidPlay(card, hand, currentTrick, brokenSpades)) {
        toast({
          title: "Invalid play",
          description: "You cannot play that card",
        });
        return;
      }

      const newCard = {
        ...card,
        playedBy: myPlayerIndex,
      };
      console.log("hand: ", hand);
      const newHand = hand.filter(
        (c) => c.suit !== newCard.suit || c.value !== newCard.value
      );
      console.log("new Hand: ", newHand);
      setHand(newHand);
      setCurrentTrick([...currentTrick, newCard]);
      if (newCard.suit === "spades" && !brokenSpades) {
        setBrokenSpades(true);
      }

      // play the card
      await playCard(
        currentGame.id,
        currentPlayerId,
        newCard,
        hand,
        currentGame.current_round
      );

      setTimeLeft(0);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error("Error playing card:", error);
      toast({
        title: "Error",
        description: "Failed to play card",
      });
    } finally {
      setIsStartPlaying(false);
    }
  };

  const leaveGame = async () => {
    if (!currentGame || !session.user.id) return;
    try {
      // delete player from game
      await supabase
        .from("solo_players")
        .delete()
        .eq("game_id", currentGame.id)
        .eq("user_id", session.user.id);
      // if game is in waiting status and no players, delete game
      const { data: remainingPlayers } = await supabase
        .from("solo_players")
        .select("id")
        .eq("game_id", currentGame.id);
      if (
        remainingPlayers.length === 0 &&
        currentGame.current_phase === "setup"
      ) {
        await supabase.from("games").delete().eq("id", currentGame.id);
      }
      // reset game state
      resetGameState();
      navigate("/");
    } catch (error) {
      console.error("Error leaving game:", error);
    }
  };

  const checkPlayerTurn = (playerId: string) => {
    if (currentGame.current_phase === "bidding") {
      return currentBiddingPlayerId === playerId;
    }
    return currentPlayerId === playerId;
  };

  const isMyTurn = currentPlayerId === players[myPlayerIndex]?.id;

  const renderGameTable = () => {
    if (!currentGame) return null;

    const isCurrentPlayerBidding =
      currentBiddingPlayerId === players[myPlayerIndex]?.id;
    const hasPlayerBid = players[myPlayerIndex]?.tricks_bid !== undefined;
    return (
      <>
        <div className="rounded-xl bg-black shadow-xl relative min-h-[800px]">
          <div className="flex justify-between items-center mb-6 relative">
            <h2 className="text-2xl font-bold">
              Game #{currentGame.id.slice(0, 8)}
            </h2>

            {/* Round and Player Details */}
            <div className="absolute top-0 left-0 bg-black p-4 shadow-md rounded-md">
              <h2 className="text-lg font-bold">
                Round {currentRound?.round_number}
              </h2>
              <p className="text-sm">Game ID: {currentGame?.id}</p>
              <h3 className="mt-2 text-md font-semibold">Players:</h3>
              <ul>
                {players.map((player) => (
                  <li key={player.id} className="text-sm">
                    {player.user_id === session.user.id
                      ? "You"
                      : playerProfiles[player.user_id]?.username ||
                        `Player ${player.position}`}
                    - Score: {player.score || 0}, Tricks Won:{" "}
                    {player.tricks_won || 0}
                  </li>
                ))}
              </ul>
            </div>

            {/* Game Status */}
            <div className="text-center">
              <span className="bg-black/50 text-white px-4 py-2 rounded-full">
                {currentGame.current_phase === "bidding" && (
                  <>
                    {isCurrentPlayerBidding
                      ? "It's your turn to bid!"
                      : hasPlayerBid
                      ? "Waiting for other players to bid..."
                      : "Waiting for your turn to bid..."}
                  </>
                )}
                {currentGame.current_phase === "playing"
                  ? isMyTurn
                    ? "It's your turn to play!"
                    : "Waiting for your turn..."
                  : null}
              </span>
            </div>

            <button
              onClick={leaveGame}
              className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition flex items-center space-x-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Leave Game</span>
            </button>
          </div>

          {/* Player positions */}
          <div className="relative h-[600px]">
            {/* Top player */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center">
              <PlayerTurnDisplay
                players={players}
                myPlayerIndex={(myPlayerIndex + 2) % 4}
                checkPlayerTurn={checkPlayerTurn}
                playerProfiles={playerProfiles}
                timeLeft={timeLeft}
                announcingBid={announcingBid}
                isCurrentPlayer={false}
              />
            </div>

            {/* Left player */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-center">
              <PlayerTurnDisplay
                players={players}
                myPlayerIndex={(myPlayerIndex + 1) % 4}
                checkPlayerTurn={checkPlayerTurn}
                playerProfiles={playerProfiles}
                timeLeft={timeLeft}
                announcingBid={announcingBid}
                isCurrentPlayer={false}
              />
            </div>

            {/* Right player */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-center">
              <PlayerTurnDisplay
                players={players}
                myPlayerIndex={(myPlayerIndex + 3) % 4}
                checkPlayerTurn={checkPlayerTurn}
                playerProfiles={playerProfiles}
                timeLeft={timeLeft}
                announcingBid={announcingBid}
                isCurrentPlayer={false}
              />
            </div>

            {/* Bottom player (current player) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
              <PlayerTurnDisplay
                players={players}
                myPlayerIndex={myPlayerIndex}
                checkPlayerTurn={checkPlayerTurn}
                playerProfiles={playerProfiles}
                timeLeft={timeLeft}
                announcingBid={announcingBid}
                isCurrentPlayer={true}
              />
            </div>

            {/* Current trick - positioned cards */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Top card */}
                {getCardPositionByIndex((myPlayerIndex + 2) % 4) && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {renderCard(
                      getCardPositionByIndex((myPlayerIndex + 2) % 4),
                      false,
                      false
                    )}
                  </div>
                )}

                {/* Left card */}
                {getCardPositionByIndex((myPlayerIndex + 1) % 4) && (
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {renderCard(
                      getCardPositionByIndex((myPlayerIndex + 1) % 4),
                      false,
                      false
                    )}
                  </div>
                )}

                {/* Right card */}
                {getCardPositionByIndex((myPlayerIndex + 3) % 4) && (
                  <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2">
                    {renderCard(
                      getCardPositionByIndex((myPlayerIndex + 3) % 4),
                      false,
                      false
                    )}
                  </div>
                )}

                {/* Bottom card */}
                {getCardPositionByIndex(myPlayerIndex) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                    {renderCard(
                      getCardPositionByIndex(myPlayerIndex),
                      false,
                      false
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bidding UI */}
          {currentGame.current_phase === "bidding" &&
            isCurrentPlayerBidding && (
              <div className="mt-8 hidden">
                <h3 className="text-xl font-bold mb-4">Place Your Bid</h3>
                <div className="flex items-center justify-center space-x-4">
                  <input
                    type="number"
                    min="0"
                    max="13"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(parseInt(e.target.value))}
                    className="w-20 px-3 py-2 bg-white text-black rounded-md"
                  />
                  <button
                    onClick={handleBid}
                    className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition"
                  >
                    Submit Bid
                  </button>
                </div>
              </div>
            )}

          {/* Player's hand */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Your Hand</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              <AnimatePresence mode="popLayout">
                {hand.map((card, i) => (
                  <motion.div
                    key={`${card.suit}-${card.value}`}
                    initial={{ scale: 0, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, y: -20, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      delay: i * 0.05,
                    }}
                    layout
                  >
                    {renderCard(
                      card,
                      currentGame.current_phase === "playing" &&
                        players[myPlayerIndex]?.id === currentPlayerId &&
                        !isStartPlaying,
                      false,
                      handlePlayCard
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <BidSetModal
          showBidDialog={showBidDialog} // Always show for all players
          bidTimeRemaining={timeLeft}
          setShowBidDialog={setShowBidDialog}
          isNilBid={isNilBid}
          bidAmount={bidAmount}
          setBidAmount={setBidAmount}
          setIsNilBid={setIsNilBid}
          handlePlaceBid={handleBid}
          playerBids={playerBids} // Keep track of all player bids
        />

        <WinnerDialog
          isOpen={showWinnerDialog}
          onClose={() => setShowWinnerDialog(false)}
          winner={winner}
          players={[...players]}
          playerProfiles={playerProfiles}
          wager={wager}
        />

        <ScoreDialog
          isOpen={showScoreDialog}
          onClose={() => setShowScoreDialog(false)}
          round_number={currentRound?.round_number}
          players={[...players]}
          playerProfiles={playerProfiles}
          wager={wager}
        />
      </>
    );
  };

  return <div className="space-y-8">{renderGameTable()}</div>;
}