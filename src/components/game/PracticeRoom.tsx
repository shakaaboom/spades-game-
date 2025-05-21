import React, { useEffect, useState } from "react";
import { Bot, DollarSign, Trophy, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

// Fix the imports to use the correct path
import { 
  Card, 
  createDeck, 
  dealCards, 
  isValidPlay, 
  calculateTrickWinner,
  PlayerPosition
} from "../../lib/gameLogic";

import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";

interface Player {
  id: string;
  name: string;
  isBot: boolean;
  hand: Card[];
  tricks: number;
  bid?: number;
  score: number;
  bags: number;
  position: "north" | "south" | "east" | "west";
}

interface PracticeRoomProps {
  onScoreUpdate?: (players: Player[], round: number) => void;
  session?: Session;
}

export default function PracticeRoom({ onScoreUpdate, session }: PracticeRoomProps) {
  const isMobile = useIsMobile();
  const [players, setPlayers] = useState<Player[]>([
    {
      id: "user",
      name: "You",
      isBot: false,
      hand: [],
      tricks: 0,
      bid: undefined,
      score: 0,
      bags: 0,
      position: "south",
    },
    {
      id: "bot1",
      name: "Bot 1",
      isBot: true,
      hand: [],
      tricks: 0,
      bid: undefined,
      score: 0,
      bags: 0,
      position: "west",
    },
    {
      id: "bot2",
      name: "Bot 2",
      isBot: true,
      hand: [],
      tricks: 0,
      bid: undefined,
      score: 0,
      bags: 0,
      position: "north",
    },
    {
      id: "bot3",
      name: "Bot 3",
      isBot: true,
      hand: [],
      tricks: 0,
      bid: undefined,
      score: 0,
      bags: 0,
      position: "east",
    },
  ]);

  const [currentTrick, setCurrentTrick] = useState<Card[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState<
    "starting" | "bidding" | "playing" | "gameOver"
  >("starting");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [spadesBroken, setSpadesBroken] = useState(false);
  const [brokenLabelShown, setBrokenLabelShown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [gameWinner, setGameWinner] = useState<Player | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);

  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(players, roundNumber);
    }
  }, [players, roundNumber, onScoreUpdate]);

  useEffect(() => {
    if (spadesBroken && !brokenLabelShown) {
      setBrokenLabelShown(true);
      setTimeout(() => {
        setBrokenLabelShown(false);
      }, 2000);
    }
  }, [spadesBroken]);

  const initializeGame = () => {
    setGamePhase("starting");
    setSpadesBroken(false);
    setCurrentTrick([]);
    setCurrentPlayerIndex(0);
    setRoundNumber(1);
    setGameWinner(null);

    setPlayers([
      {
        id: "user",
        name: "You",
        isBot: false,
        hand: [],
        tricks: 0,
        bid: undefined,
        score: 0,
        bags: 0,
        position: "south",
      },
      {
        id: "bot1",
        name: "Bot 1",
        isBot: true,
        hand: [],
        tricks: 0,
        bid: undefined,
        score: 0,
        bags: 0,
        position: "west",
      },
      {
        id: "bot2",
        name: "Bot 2",
        isBot: true,
        hand: [],
        tricks: 0,
        bid: undefined,
        score: 0,
        bags: 0,
        position: "north",
      },
      {
        id: "bot3",
        name: "Bot 3",
        isBot: true,
        hand: [],
        tricks: 0,
        bid: undefined,
        score: 0,
        bags: 0,
        position: "east",
      },
    ]);
  };

  const startGame = () => {
    const deck = createDeck();
    const hands = dealCards(deck);

    const newPlayers = players.map((player, index) => ({
      ...player,
      hand: hands[index],
      tricks: 0,
      bid: undefined,
    }));

    setPlayers(newPlayers);
    setGamePhase("bidding");
    handleBotBids(newPlayers);
  };

  const startNewRound = () => {
    setSpadesBroken(false);
    setCurrentTrick([]);
    setCurrentPlayerIndex(0);
    setRoundNumber(prev => prev + 1);
    
    const deck = createDeck();
    const hands = dealCards(deck);

    const newPlayers = players.map((player, index) => ({
      ...player,
      hand: hands[index],
      tricks: 0,
      bid: undefined,
      // Don't reset score or bags between rounds
    }));

    setPlayers(newPlayers);
    setGamePhase("bidding");
    handleBotBids(newPlayers);
    
    toast.success(`New Round ${roundNumber + 1} Started`);
  };

  const handleBotBids = async (gamePlayers: Player[]) => {
    const updatedPlayers = [...gamePlayers];

    for (let i = 1; i < 4; i++) {
      const spadeCount = updatedPlayers[i].hand.filter(
        (card) => card.suit === "spades"
      ).length;
      const highCards = updatedPlayers[i].hand.filter(
        (card) => card.value >= 11
      ).length;
      const bid = Math.floor((spadeCount + highCards) / 2);
      updatedPlayers[i].bid = bid;

      await new Promise((resolve) => setTimeout(resolve, 800));
      setPlayers([...updatedPlayers]);
    }
  };

  const handlePlayerBid = (bid: number) => {
    const updatedPlayers = [...players];
    updatedPlayers[0].bid = bid;
    setPlayers(updatedPlayers);

    if (updatedPlayers.every((p) => p.bid !== undefined)) {
      setGamePhase("playing");
    }
  };

  const getBotPlay = (botPlayer: Player): Card => {
    const validPlays = botPlayer.hand.filter((card) =>
      isValidPlay(card, botPlayer.hand, currentTrick, spadesBroken)
    );

    if (validPlays.length === 0) {
      console.error("No valid plays available for bot", botPlayer);
      return botPlayer.hand[0];
    }

    // Playing first card in the trick
    if (currentTrick.length === 0) {
      // Try to play non-spades first
      const nonSpades = validPlays.filter((card) => card.suit !== "spades");
      if (nonSpades.length > 0) {
        return nonSpades.reduce(
          (highest, current) =>
            current.value > highest.value ? current : highest,
          nonSpades[0]
        );
      }
    }

    // Following in a trick
    if (currentTrick.length > 0) {
      const leadSuit = currentTrick[0].suit;
      const followingSuit = validPlays.filter((card) => card.suit === leadSuit);

      // If we can follow suit, play highest card
      if (followingSuit.length > 0) {
        return followingSuit.reduce(
          (highest, current) =>
            current.value > highest.value ? current : highest,
          followingSuit[0]
        );
      }

      // If we can't follow suit and have spades, play lowest spade
      const spades = validPlays.filter((card) => card.suit === "spades");
      if (
        spades.length > 0 &&
        !currentTrick.some((card) => card.suit === "spades")
      ) {
        return spades.reduce(
          (lowest, current) =>
            current.value < lowest.value ? current : lowest,
          spades[0]
        );
      }
    }

    // Default: play lowest value card from valid plays
    return validPlays.reduce(
      (lowest, current) => (current.value < lowest.value ? current : lowest),
      validPlays[0]
    );
  };

  const handleBotPlay = async () => {
    if (isProcessing || gamePhase !== "playing" || currentPlayerIndex === 0)
      return;

    setIsProcessing(true);

    const botPlayer = players[currentPlayerIndex];
    const cardToPlay = getBotPlay(botPlayer);

    await new Promise((resolve) => setTimeout(resolve, 800));
    await playCard(currentPlayerIndex, cardToPlay);

    setIsProcessing(false);
  };

  useEffect(() => {
    if (gamePhase === "playing" && currentPlayerIndex > 0 && !isProcessing) {
      handleBotPlay();
    }
  }, [currentPlayerIndex, gamePhase, isProcessing]);

  const handleCardPlay = (card: Card) => {
    if (currentPlayerIndex !== 0 || isProcessing) return;

    if (!isValidPlay(card, players[0].hand, currentTrick, spadesBroken)) {
      toast.error("Invalid play");
      return;
    }

    playCard(0, card);
  };

  const playCard = async (playerIndex: number, card: Card) => {
    if (!card) {
      console.error("No card to play");
      return;
    }

    const updatedPlayers = [...players];
    const player = updatedPlayers[playerIndex];

    player.hand = player.hand.filter(
      (c) => !(c.suit === card.suit && c.value === card.value)
    );
    const playedCard = { ...card, playedBy: player.position };
    const newTrick = [...currentTrick, playedCard];

    if (card.suit === "spades" && !spadesBroken) {
      setSpadesBroken(true);
    }

    setCurrentTrick(newTrick);
    setPlayers(updatedPlayers);

    if (newTrick.length === 4) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const winnerPosition = calculateTrickWinner(newTrick);
      if (winnerPosition) {
        // find the index of the winnerPosition
        const winnerIndex = updatedPlayers.findIndex(
          (player) => player.position === winnerPosition
        );
        updatedPlayers[winnerIndex].tricks += 1;
        setCurrentTrick([]);
        setPlayers(updatedPlayers);
        setCurrentPlayerIndex(winnerIndex);

        if (updatedPlayers[0].hand.length === 0) {
          handleRoundEnd(updatedPlayers);
        }
      }
    } else {
      setCurrentPlayerIndex((playerIndex + 1) % 4);
    }
  };

  const calculateScore = (bid: number = 0, tricks: number): number => {
    // Nil bid (0) - worth 50 points
    if (bid === 0) {
      return tricks === 0 ? 50 : -50;
    }

    // Regular bid
    if (tricks < bid) {
      // Didn't make bid - lose 10 points per bid
      return -(bid * 10);
    }

    // Made bid - get 10 points per bid plus 1 point per overtrick
    return bid * 10 + (tricks - bid);
  };

  const handleRoundEnd = (roundPlayers: Player[]) => {
    const updatedPlayers = [...roundPlayers];
    let anyPlayerWon = false;
    let winner: Player | null = null;
    
    updatedPlayers.forEach(player => {
      const bid = player.bid || 0;
      const tricks = player.tricks;
      const roundScore = calculateScore(bid, tricks);
      
      // Handle bags - but only for non-nil bids
      let bagCount = player.bags;
      let bagPenalty = 0;
      
      // Add new bags if tricks > bid, but only if bid was not nil
      if (bid > 0 && tricks > bid) {
        const newBags = tricks - bid;
        bagCount += newBags;
        
        // Apply penalty for every 5 bags
        if (bagCount >= 5) {
          bagPenalty = Math.floor(bagCount / 5) * 50;
          bagCount = bagCount % 5; // Reset bags, keeping remainder
        }
      }

      // Update player's bags
      player.bags = bagCount;
      
      // Apply round score and bag penalty
      player.score += roundScore - bagPenalty;
      
      // Check if this player won the game
      if (player.score >= 100 && !anyPlayerWon) {
        anyPlayerWon = true;
        winner = player;
      }
    });
    
    setPlayers(updatedPlayers);
    
    if (anyPlayerWon && winner) {
      handleGameOver(winner);
    } else {
      setGamePhase("bidding");
      
      toast.success(
        <div>
          <h3 className="font-bold mb-2">Round Complete</h3>
          {updatedPlayers.map((player, i) => (
            <div key={i} className="mb-1">
              {player.name}: {player.score} total points 
              (Round: {calculateScore(player.bid, player.tricks)})
              {player.bags > 0 ? ` | Bags: ${player.bags}` : ''}
            </div>
          ))}
          <div className="mt-2">Starting next round in 3 seconds...</div>
        </div>,
        { duration: 3000 }
      );
      
      setTimeout(() => {
        startNewRound();
      }, 3000);
    }
  };

  const handleGameOver = (winner: Player) => {
    setGamePhase("gameOver");
    setGameWinner(winner);
    
    toast.success(
      <div>
        <h3 className="font-bold mb-2">Game Over! {winner.name} wins!</h3>
        {players.map((player, i) => (
          <div key={i} className="mb-1">
            {player.name}: {player.score} points
            {player.bags > 0 ? ` | Bags: ${player.bags}` : ""}
            {player.id === winner.id ? " 🏆" : ""}
          </div>
        ))}
        <div className="mt-2">First to reach 100 points wins!</div>
      </div>,
      { duration: 5000 }
    );
  };

  const renderCard = (
    card: Card,
    index: number,
    isPlayable: boolean = true
  ) => (
    <motion.div
      key={`${card.suit}-${card.value}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={isPlayable ? { scale: 1.1, y: -10 } : {}}
      className={`relative ${isMobile ? 'w-16 h-28' : 'w-20 h-32'} 
        bg-white rounded-lg shadow-md flex items-center justify-center 
        ${isPlayable ? "cursor-pointer hover:shadow-lg" : ""} 
        ${selectedCard === card ? "ring-2 ring-purple-500" : ""}`}
      onClick={() => isPlayable && handleCardPlay(card)}
    >
      <div
        className={`${isMobile ? 'text-xl' : 'text-2xl'} ${
          card.suit === "hearts" || card.suit === "diamonds"
            ? "text-red-600"
            : "text-black"
        }`}
      >
        {card.value === 11
          ? "J"
          : card.value === 12
          ? "Q"
          : card.value === 13
          ? "K"
          : card.value === 14
          ? "A"
          : card.value}
        <span className="ml-1">
          {card.suit === "hearts"
            ? "♥"
            : card.suit === "diamonds"
            ? "♦"
            : card.suit === "clubs"
            ? "♣"
            : "♠"}
        </span>
      </div>
    </motion.div>
  );

  const renderStartGame = () => (
    <div className="flex flex-col items-center justify-center h-96">
      <h2 className="text-2xl font-bold text-white mb-8">
        Spades Card Game
      </h2>
      <p className="text-white mb-8 text-center max-w-md px-4">
        Try to win tricks by playing the highest card. 
        First player to 100 points wins the game.
        Bags (overtricks) accumulate and subtract 50 points per 5 bags.
      </p>
      <Button
        onClick={startGame}
        variant="default"
        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg"
      >
        Start Game
      </Button>
    </div>
  );

  const getCardPosition = (position: string | undefined) => {
    switch (position) {
      case "north":
        return "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2";
      case "south":
        return "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2";
      case "east":
        return "right-0 top-1/2 translate-x-1/2 -translate-y-1/2";
      case "west":
        return "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2";
      default:
        return "";
    }
  };

  const getPlayerPosition = (position: string) => {
    switch (position) {
      case "north":
        return "absolute top-0 left-1/2 -translate-x-1/2";
      case "south":
        return "absolute bottom-0 left-1/2 -translate-x-1/2";
      case "east":
        return "absolute right-0 top-1/2 -translate-y-1/2";
      case "west":
        return "absolute left-0 top-1/2 -translate-y-1/2";
      default:
        return "";
    }
  };

  const Scoreboard = () => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    return (
      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-lg shadow-xl p-4 max-w-md mx-auto border border-purple-500/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Scoreboard</h3>
          <span className="bg-indigo-900/70 text-indigo-100 px-2 py-1 rounded-full text-xs">
            Round {roundNumber}
          </span>
          <button 
            onClick={() => setShowScoreboard(false)}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-purple-500/20">
              <TableHead className="w-[50px] text-indigo-300">Rank</TableHead>
              <TableHead className="text-indigo-300">Player</TableHead>
              <TableHead className="text-right text-indigo-300">Score</TableHead>
              <TableHead className="text-right w-[60px] text-indigo-300">
                <div className="flex items-center justify-end">
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  <span>Bags</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((player, index) => (
              <TableRow key={player.id} className={index === 0 ? "bg-yellow-500/10" : ""}>
                <TableCell className="text-gray-200">
                  {index === 0 ? (
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  ) : (
                    index + 1
                  )}
                </TableCell>
                <TableCell className="text-gray-200">{player.name}</TableCell>
                <TableCell className="text-right font-medium text-gray-200">
                  {player.score} pts
                </TableCell>
                <TableCell className="text-right text-gray-200">
                  {player.bags || 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="relative min-h-[800px] rounded-xl p-8 bg-gradient-to-br from-[#1A1F2C] to-[#2D3748] overflow-hidden border border-purple-500/30 shadow-2xl">
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full border border-indigo-500/40">
        {gamePhase === "starting"
          ? "Game Setup"
          : gamePhase === "bidding"
          ? "Bidding Phase"
          : gamePhase === "playing"
          ? "Playing Phase"
          : "Game Over"}
      </div>

      <div className="absolute top-4 right-4 flex space-x-2 z-20">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setShowScoreboard(true)}
          className="bg-black/50 backdrop-blur-sm text-white border-indigo-500/40 hover:bg-indigo-900/50 hover:border-indigo-400"
        >
          <Trophy className="h-4 w-4 mr-1 text-yellow-400" />
          Scoreboard
        </Button>
        {gamePhase !== "starting" && (
          <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full border border-indigo-500/40">
            Round {roundNumber}
          </div>
        )}
      </div>

      {showScoreboard && <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <Scoreboard />
      </div>}

      {gamePhase === "starting" ? (
        renderStartGame()
      ) : (
        <>
          <div className="relative h-[700px] mb-8">
            {players.map((player) => (
              <div
                key={player.position}
                className={`${getPlayerPosition(player.position)}`}
              >
                <div className={`bg-black/60 backdrop-blur-sm p-4 rounded-lg text-center border ${
                  currentPlayerIndex === players.findIndex(p => p.id === player.id)
                  ? "border-yellow-400 ring-2 ring-yellow-400/50" 
                  : "border-purple-500/30"
                }`}>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    {player.isBot && <Bot className="w-5 h-5 text-indigo-300" />}
                    <span
                      className="text-white font-medium"
                    >
                      {player.name}
                    </span>
                  </div>
                  <div className="text-indigo-200 text-sm">
                    {player.bid !== undefined ? `Bid: ${player.bid}` : "..."}{" "}
                    | Tricks: {player.tricks}
                  </div>
                  <div className="text-indigo-200 text-xs mt-1">
                    Score: {player.score} pts
                    {player.bags > 0 && ` | Bags: ${player.bags}`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {currentTrick.map((card) => (
                <div
                  key={`${card.suit}-${card.value}`}
                  className={`absolute ${getCardPosition(card.playedBy as string)}`}
                >
                  {renderCard(card, 0, false)}
                </div>
              ))}
              {spadesBroken && brokenLabelShown && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-lg text-white px-4 py-2 rounded-lg text-lg font-bold border border-purple-500/40">
                  Spades broken!
                </div>
              )}
            </div>
          </div>

          {gamePhase === "gameOver" && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg p-8 rounded-xl text-white text-center border border-purple-500/30 shadow-2xl max-w-md">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Game Over!
                </h2>
                <p className="text-xl mb-2 text-indigo-100">{gameWinner?.name} Wins!</p>
                <p className="mb-6 text-indigo-200">Final score: {gameWinner?.score} points</p>
                <Button
                  onClick={initializeGame}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 shadow-lg"
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}

          {gamePhase === "bidding" && players[0]?.bid === undefined && (
            <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-10">
              <div className="flex flex-col items-center space-y-4 bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg p-6 rounded-xl border border-purple-500/30 shadow-xl">
                <span className="text-indigo-100 font-semibold">Your bid:</span>
                <div className="grid grid-cols-7 gap-2 justify-center">
                  {Array.from({ length: 14 }, (_, i) => (
                    <Button
                      key={i}
                      onClick={() => handlePlayerBid(i)}
                      className={`w-10 h-10 rounded-md transition-all duration-200 ${
                        i === 0 
                          ? "bg-red-700 hover:bg-red-600 text-white" 
                          : "bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white"
                      }`}
                      variant="outline"
                    >
                      {i}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-indigo-200 mt-2">
                  <span className="font-bold text-yellow-400">Nil (0):</span> 50 pts if successful, -50 if you take any tricks
                </p>
              </div>
            </div>
          )}

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="flex space-x-[-0.5rem]">
              <AnimatePresence>
                {players[0]?.hand.map((card, i) => (
                  <motion.div
                    key={`hand-${card.suit}-${card.value}`}
                    initial={{ scale: 0, y: 100 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ zIndex: i }}
                  >
                    {renderCard(
                      card,
                      i,
                      gamePhase === "playing" &&
                        currentPlayerIndex === 0
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
