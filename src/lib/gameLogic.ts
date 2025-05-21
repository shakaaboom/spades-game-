import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
export type PlayerPosition = "north" | "south" | "east" | "west";

export interface Card {
  suit: "spades" | "hearts" | "diamonds" | "clubs";
  value: number; // 2-14 (14 = Ace)
  playerId?: string;
  playedBy?: PlayerPosition | number;
}

export interface GameState {
  id: string;
  status: "waiting" | "bidding" | "playing" | "finished";
  currentRound: number;
  currentPlayer: number;
  tricks: Card[][];
  scores: number[];
  bids: number[];
  trickWinner?: number;
}

const SUITS = ["diamonds", "clubs", "hearts", "spades"] as const;

// Create array of values where Ace (14) is highest
const VALUES = [
  // 2-10
  ...Array.from({ length: 9 }, (_, i) => i + 2),
  // Jack (11), Queen (12), King (13), Ace (14)
  11,
  12,
  13,
  14,
];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return shuffleDeck(deck);
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    // Sort by suit first (diamonds, clubs, hearts, spades)
    const suitOrder = SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
    if (suitOrder !== 0) return suitOrder;

    // Then by value (2-14, where 14 is Ace)
    return a.value - b.value;
  });
}

export function dealCards(deck: Card[]): Card[][] {
  const hands: Card[][] = [[], [], [], []];
  // Deal 13 cards to each player
  for (let i = 0; i < 52; i++) {
    hands[i % 4].push(deck[i]);
  }
  // Sort each hand
  return hands.map((hand) => sortCards(hand));
}

export function isValidPlay(
  card: Card,
  hand: Card[],
  trick: Card[],
  brokenSpades: boolean
): boolean {
  // Leading a trick
  if (trick.length === 0) {
    // Cannot lead with spades until they are broken
    if (card.suit === "spades" && !brokenSpades) {
      // Unless player only has spades
      const hasNonSpades = hand.some((c) => c.suit !== "spades");
      return !hasNonSpades;
    }
    return true;
  }

  // Following a trick
  const leadSuit = trick[0].suit;
  const hasLeadSuit = hand.some((c) => c.suit === leadSuit);

  // Must follow suit if possible
  if (hasLeadSuit) {
    return card.suit === leadSuit;
  }

  // Can play any card when unable to follow suit
  // This is where spades can be "broken" if played when unable to follow suit
  return true;
}

export function calculateTrickWinner(
  trick: Card[],
  winnerIndexRequired = false
): PlayerPosition | number | null {
  console.log("trick: ", trick);
  if (trick.length !== 4) return null;

  const leadSuit = trick[0].suit;

  // First check if any spades were played
  const spadesPlayed = trick.filter((card) => card.suit === "spades");

  if (spadesPlayed.length > 0) {
    // If spades were played, highest spade wins
    let highestSpade = spadesPlayed[0];
    let winnerIndex = trick.findIndex(
      (card) =>
        card.suit === highestSpade.suit && card.value === highestSpade.value
    );

    for (let i = 1; i < spadesPlayed.length; i++) {
      if (spadesPlayed[i].value > highestSpade.value) {
        highestSpade = spadesPlayed[i];
        winnerIndex = trick.findIndex(
          (card) =>
            card.suit === highestSpade.suit && card.value === highestSpade.value
        );
      }
    }
    console.log("winnerIndex: ", winnerIndex);
    if (winnerIndexRequired) {
      return winnerIndex;
    }
    return highestSpade.playedBy;
  } else {
    // No spades played, highest card of lead suit wins
    let highestCard = trick[0];
    let winnerIndex = 0;

    for (let i = 1; i < trick.length; i++) {
      const card = trick[i];
      if (card.suit === leadSuit && card.value > highestCard.value) {
        highestCard = card;
        winnerIndex = i;
      }
    }
    console.log("winnerIndex: ", winnerIndex);
    if (winnerIndexRequired) {
      return winnerIndex;
    }
    return highestCard.playedBy;
  }
}

/**
 * Calculates the score for a player based on their bid and tricks won.
 * @param bid - Number of tricks the player bid.
 * @param tricks - Number of tricks the player actually won.
 * @returns Total score for the round.
 */
export function calculateScore(bid: number, tricks: number): number {
  const isNilBid = bid === 0;

  if (isNilBid) {
    return tricks === 0 ? 100 : -100;
  }

  const didMakeBid = tricks >= bid;

  if (!didMakeBid) {
    return -bid * 10;
  }

  const overtricks = tricks - bid;
  return bid * 10 + overtricks;
}

// submit bid
export async function submitBid(
  gameId: string,
  playerId: string,
  bid: number,
  roundNumber: number
) {
  // validate bid is between 0 and 13
  if (bid < 0 || bid > 13) {
    throw new Error("Invalid bid");
  }

  try {
    // update bid in solo_players
    await supabase
      .from("solo_players")
      .update({
        tricks_bid: bid,
        bid_submission_time: new Date().toISOString(),
      })
      .eq("id", playerId);

    // check if all bids are set
    const { data: allBids, error: allBidsError } = await supabase
      .from("solo_players")
      .select("id, position, tricks_bid")
      .eq("game_id", gameId)
      .order("bid_submission_time", { ascending: true });

    if (allBidsError) {
      throw allBidsError;
    }

    const allBidsSubmitted = allBids.every(
      (p) => p.tricks_bid !== null && p.tricks_bid >= 0
    );

    if (allBidsSubmitted) {
      console.log("All bids are set, starting game:", gameId);

      const firstBidder = allBids.find((player) => player.tricks_bid !== null);

      await supabase
        .from("solo_game_rounds")
        .update({ current_player: firstBidder.id })
        .eq("game_id", gameId)
        .eq("round_number", roundNumber);

      // all players have bid, start game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .update({ current_phase: "playing" })
        .eq("id", gameId)
        .select("*")
        .single();
      if (gameError) {
        console.error("Error updating game:", gameError);
        throw gameError;
      }
      console.log("gameData: ", gameData);
    } else {
      // not all bids are set, find next player to bid
      const { data: players, error: playersError } = await supabase
        .from("solo_players")
        .select("*")
        .eq("game_id", gameId);

      if (players) {
        const nextPlayer = players.find((player) => player.tricks_bid === null);
        if (nextPlayer) {
          // update current player in solo_games
          await supabase
            .from("solo_game_rounds")
            .update({ current_player: nextPlayer.id })
            .eq("game_id", gameId)
            .eq("round_number", roundNumber);
        }
      }
    }
  } catch (error) {
    console.error("Error submitting bid:", error);
    throw error;
  }
}

// start game
export async function startGameRound(gameId: string, roundNumber: number) {
  const deck = createDeck();
  const hands = dealCards(deck);

  try {
    const { data: players, error: playersError } = await supabase
      .from("solo_players")
      .select("*")
      .eq("game_id", gameId)
      .order("position", { ascending: true });
    console.log("players: ", players);
    if (playersError) {
      throw playersError;
    }

    if (players.length !== 4) {
      throw new Error("Invalid number of players");
    }

    // Store hands in supabase
    for (let i = 0; i < players.length; i++) {
      await supabase.from("solo_player_hands").insert({
        game_id: gameId,
        player_id: players[i].id,
        cards: hands[i] as any,
      });
    }

    // create initial game round
    await supabase.from("solo_game_rounds").insert({
      game_id: gameId,
      round_number: roundNumber,
      current_player: players[0].id,
      cards_played: [],
    });

    // update game status to starting
    await supabase
      .from("games")
      .update({
        status: "in_progress",
        current_phase: "bidding",
        current_round: roundNumber,
      })
      .eq("id", gameId);

    return true;
  } catch (error) {
    console.error("Error starting game:", error);
    return false;
  }
}

const scoreThresholds = {
  0.5: 100,
  1: 150,
  2.5: 200,
  5: 300,
  10: 300,
  25: 300,
  50: 300,
  100: 300,
};

// play card

export async function playCard(
  gameId: string,
  playerId: string,
  card: Card,
  hand: Card[],
  roundNumber: number
) {
  // get round data
  const { data: round, error: roundError } = await supabase
    .from("solo_game_rounds")
    .select("*")
    .eq("game_id", gameId)
    .eq("round_number", roundNumber)
    .single();

  if (roundError) {
    throw roundError;
  }

  // check if spades are broken
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameError) {
    throw gameError;
  }

  const spadesBroken = game.spades_broken ? true : false;

  if (card.suit === "spades" && !spadesBroken) {
    await supabase
      .from("games")
      .update({ spades_broken: true })
      .eq("id", gameId);
  }

  // create a new card object with the player id
  const playedCard = { ...card, playerId };

  const cardsPlayed = (round.cards_played as any as Card[]) || [];

  // add the new card to the cards played
  cardsPlayed.push(playedCard);

  // update the round with the new cards played
  await supabase
    .from("solo_game_rounds")
    .update({
      cards_played: cardsPlayed as any,
      current_player: null, // clear current player while processing
    })
    .eq("id", round.id);
  // update player hand by removing the played card
  const updatedHand = hand.filter(
    (c) => c.suit !== card.suit || c.value !== card.value
  );

  await supabase
    .from("solo_player_hands")
    .update({ cards: updatedHand as any })
    .eq("game_id", gameId)
    .eq("player_id", playerId);

  const { data: players, error: playersError } = await supabase
    .from("solo_players")
    .select("*")
    .eq("game_id", gameId)
    .order("position", { ascending: true });

  if (playersError) {
    throw playersError;
  }

  // check if trick is complete ( 4 cards played)
  /* if (cardsPlayed.length % 4 === 0) {
    // calculate trick winner
    const trick = cardsPlayed.slice(-4).map((card) => ({
      suit: card.suit,
      value: card.value,
    }));
    const winnerIndex = calculateTrickWinner(trick, true);
    const winnerId = cardsPlayed[winnerIndex].playerId;

    // get current tricks won
    const { data: tricks, error: tricksError } = await supabase
      .from("solo_players")
      .select("*")
      .eq("id", winnerId)
      .eq("game_id", gameId)
      .single();

    if (tricksError) {
      throw tricksError;
    }

    const currentTricks = tricks.tricks_won || 0;

    // update tricks won
    const updatedTricks = currentTricks + 1;

    const finalScore = calculateScore(
      tricks.tricks_bid || 0,
      tricks.tricks_won || 0
    );

    const { data: updatedPlayer, error: updatedPlayerError } = await supabase
      .from("solo_players")
      .update({ tricks_won: updatedTricks, score: finalScore })
      .eq("id", winnerId)
      .select("*")
      .single();

    if (updatedPlayerError) {
      console.error("Error updating player:", updatedPlayerError);
    } 

    const requiredScore = scoreThresholds[game.wager_amount];

    if (requiredScore && updatedPlayer.score >= requiredScore) {
      await supabase
        .from("games")
        .update({ winner_id: updatedPlayer.user_id, current_phase: "finished" })
        .eq("id", gameId);

      return; // game is finished, stop here
    }*/

  // check if hand is compllete (13 cards played)
  const { data: playerHand } = await supabase
    .from("solo_player_hands")
    .select("cards")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .single();

  if ((playerHand.cards as any[]).length === 0) {
    const { data: players, error: playersError } = await supabase
      .from("solo_players")
      .select("*")
      .eq("game_id", gameId);

    if (playersError) {
      throw playersError;
    }

  
    let highestScore = 0;
  let finalWinner = null;
  let secondPlace = null;

  for (const player of players) {
    const finalScore = calculateScore(
      player.tricks_bid || 0,
      player.tricks_won || 0
    );
    if (finalScore > highestScore) {
      highestScore = finalScore;
      finalWinner = player;
    }
    
    if (finalScore > highestScore) {
      secondPlace = finalWinner; 
      highestScore = finalScore;
      finalWinner = player;
    } else if (!secondPlace || finalScore > calculateScore(secondPlace.tricks_bid || 0, secondPlace.tricks_won || 0)) {
      secondPlace = player;
    }
  }

  const wagerAmount = game.wager_amount; 

  // Update the balance for the winning player
  await supabase
    .from("solo_players")
    .update({ balance: finalWinner.balance + wagerAmount * 2 }) // Update balance directly
    .eq("id", finalWinner.id)
    .select("*")
    .single();

  // Update the second place's balance
  if (secondPlace) {
    await supabase
      .from("solo_players")
      .update({ balance: secondPlace.balance + wagerAmount }) // Update balance directly
      .eq("id", secondPlace.id);
  }

     

    const requiredScore = scoreThresholds[game.wager_amount];
    const winningPlayer = players.find(
      (p) => Math.abs(p.score) >= Math.abs(requiredScore)
    );

    if (winningPlayer) {
      await supabase
        .from("games")
        .update({
          winner_id: winningPlayer.user_id,
          current_phase: "finished",
        })
        .eq("id", gameId);

      return;
    }

    if (roundNumber === 7) {
      await supabase
        .from("games")
        .update({ winner_id: finalWinner.user_id, current_phase: "finished" })
        .eq("id", gameId);
    } else {
      const nextRound = roundNumber + 1;
      const totalPlayers = players.length;
      const startingPosition = (nextRound - 1) % totalPlayers;

      const nextPlayer = players.find((player) => player.id === finalWinner.id);
      await supabase.from("solo_game_rounds").insert({
        game_id: gameId,
        round_number: nextRound,
        current_player: nextPlayer.id,
        cards_played: [],
      });

      const deck = createDeck();
      const hands = dealCards(deck);

      await supabase
        .from("solo_player_hands")
        .update({ cards: hands })
        .eq("game_id", gameId)
        .eq("player_id", playerId);

      await supabase
        .from("solo_players")
        .update({
          tricks_bid: null,
          bid_submission_time: new Date().toISOString(),
        })
        .eq("id", playerId);

      // update games current round
      await supabase
        .from("games")
        .update({
          current_round: nextRound,
          current_phase: "bidding",
        })
        .eq("id", gameId);
    }

    return;
  }
  //}


  const currentPlayerIndex = players.findIndex(
    (player) => player.id === playerId
  );
  const nextPlayerIndex = (currentPlayerIndex + 1) % 4;
  const nextPlayerId = players[nextPlayerIndex].id;

  await supabase
    .from("solo_game_rounds")
    .update({ current_player: nextPlayerId })
    .eq("id", round.id);
}