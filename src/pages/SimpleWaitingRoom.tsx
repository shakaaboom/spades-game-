import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSimplifiedWaitingRoom } from "@/hooks/use-simplified-waiting-room";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Users,
  DollarSign,
  Trophy,
  Info,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const SimpleWaitingRoom = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const gameMode =
    (searchParams.get("mode") as "practice" | "real") || "practice";
  const gameType = (searchParams.get("type") as "solo" | "partnered") || "solo";
  const wagerAmount = searchParams.get("wager")
    ? parseInt(searchParams.get("wager") || "0")
    : 0;

  const isValidUUID =
    id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // Timer state for auto-start countdown
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(
    null
  );

  useEffect(() => {
    const sendLeaveRequest = () => {
      if (!user || !id) return;
  
      const authToken = localStorage.getItem(`sb-oqtzvbhguatgwucfltin-auth-token`);
      if (!authToken) {
        console.warn("No auth token found in localStorage");
        return;
      }
  
      const url = `${SUPABASE_URL}/rest/v1/solo_players?game_id=eq.${id}&user_id=eq.${user.id}`;
  
      fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${JSON.parse(authToken).access_token}`,
        },
        keepalive: true, // Ensures request completes after tab is closed
      }).catch((err) => console.error("Failed to send leave request:", err));
    };

  
    // Attach event listeners for all possible exit scenarios
    window.addEventListener("beforeunload", sendLeaveRequest);
    /* document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sendLeaveRequest();
    });
    window.addEventListener("pagehide", sendLeaveRequest); */
  
    return () => {
      window.removeEventListener("beforeunload", sendLeaveRequest);
      //document.removeEventListener("visibilitychange", sendLeaveRequest);
      //window.removeEventListener("pagehide", sendLeaveRequest);
    };
  }, [user, id]); 
  


  useEffect(() => {
    if (id && !isValidUUID) {
      toast({
        title: "Invalid Room ID",
        description: "The waiting room ID is not valid",
        variant: "destructive",
      });
      navigate("/lobby");
    }
  }, [id, isValidUUID, navigate, toast]);

  const {
    waitingRoom,
    isLoading,
    isJoining,
    error,
    joinWaitingRoom,
    leaveWaitingRoom,
    startGame,
    refreshWaitingRoom,
  } = useSimplifiedWaitingRoom({
    roomId: isValidUUID ? id : undefined,
    mode: gameMode,
    gameType: gameType,
    wagerAmount: wagerAmount,
  });

  useEffect(() => {
    if (id && isValidUUID && user) {
      joinWaitingRoom(id);
    }
  }, [id, isValidUUID, user, joinWaitingRoom]);


  const startGameWithBalanceCheck = async () => {
    if (!waitingRoom || waitingRoom.players.length !== 4) {
      toast({
        title: "Cannot Start Game",
        description: "Not enough players to start the game.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      // Fetch balances for all players
      const playerIds = waitingRoom.players.map((p) => p.id);
  
      const { data: balances, error } = await supabase
        .from("profiles")
        .select("id, balance")
        .in("id", playerIds);
  
      if (error || !balances) {
        console.error("Error fetching balances:", error);
        toast({
          title: "Balance Check Failed",
          description: "Unable to verify player balances.",
          variant: "destructive",
        });
        return;
      }
  
      // Check if any player has insufficient balance
      const wagerAmount = waitingRoom.wagerAmount;
      const insufficientFunds = balances.some((player) => player.balance < wagerAmount);
  
      if (insufficientFunds) {
        toast({
          title: "Insufficient Funds",
          description: "One player do not have enough balance to start the game.",
          variant: "destructive",
        });
        return;
      }
  
      // Deduct the wager amount from each player's balance
      const updates = balances.map((player) =>
        supabase
          .from("profiles")
          .update({ balance: player.balance - wagerAmount })
          .eq("id", player.id)
      );
  
      await Promise.all(updates);
  
      // Start the game
      startGame();
    } catch (error) {
      console.error("Error processing game start:", error);
      toast({
        title: "Error",
        description: "Something went wrong while starting the game.",
        variant: "destructive",
      });
    }
  };
  
  // Auto-start countdown when all players have joined
  useEffect(() => {
    // Start countdown when all 4 players have joined
    if (waitingRoom?.players.length === 4) {
      if (autoStartCountdown === null) {
        // Start 5 second countdown
        setAutoStartCountdown(5);
       
      }
    } else {
      // Reset countdown if players leave
      setAutoStartCountdown(null);
    }
  }, [waitingRoom?.players.length, toast]);

  // Handle auto-start countdown
  useEffect(() => {
    if (autoStartCountdown !== null && autoStartCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoStartCountdown(autoStartCountdown - 1);
      }, 1000);
  
      return () => clearTimeout(timer);
    } else if (autoStartCountdown === 0) {
      const shouldStart = waitingRoom?.players.length === 4;
      if (shouldStart) {
        setAutoStartCountdown(null);
        startGameWithBalanceCheck(); // Use the updated function
      } else {
        setAutoStartCountdown(null);
      }
    }
  }, [autoStartCountdown, waitingRoom?.players.length]);
  
  const isHost =
    waitingRoom?.players.some(
      (player) => player.id === user?.id && player.isHost
    ) || false;

  // If the ID is invalid and we're in practice mode, create a message to help the user
  if (!isValidUUID && gameMode === "practice") {
    return (
      <Layout>
        <div className="container pt-20 pb-16">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/lobby")}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lobby
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">Invalid Game Room</h1>
          </div>

          <Card className="w-full">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h2 className="text-lg font-semibold mb-4">
                  The practice game room is invalid
                </h2>
                <p className="mb-6">
                  Please return to the lobby and select "Practice Mode" again to
                  create a valid game.
                </p>
                <Button onClick={() => navigate("/lobby")}>
                  Return to Lobby
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container pt-20 pb-16">
      {autoStartCountdown !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center text-white text-6xl font-bold z-50">
            {autoStartCountdown}
          </div>
        )}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/lobby")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lobby
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">
            {isLoading ? "Loading Waiting Room..." : "Waiting Room"}
          </h1>
        </div>

        {isLoading ? (
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="text-center py-8">
                Loading waiting room data...
              </div>
            </CardContent>
          </Card>
        ) : waitingRoom ? (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Game Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Game Type:
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {waitingRoom.gameType}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Game Mode:
                        </span>
                        <Badge
                          variant={
                            waitingRoom.gameMode === "practice"
                              ? "secondary"
                              : "default"
                          }
                          className="capitalize"
                        >
                          {waitingRoom.gameMode}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Wager:
                        </span>
                        <Badge
                          variant={
                            waitingRoom.wagerAmount > 0
                              ? "destructive"
                              : "outline"
                          }
                          className="flex items-center"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          {waitingRoom.wagerAmount}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Players:
                        </span>
                        <Badge variant="outline">
                          {waitingRoom.players.length}/4
                        </Badge>
                      </div>

                     

                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Trophy className="h-4 w-4 mr-1" /> Game Rules
                      </h4>
                      <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded">
                        <p>• Scoring: -200/+200 with nil bids</p>
                        <p>
                          •{" "}
                          {waitingRoom.gameType === "solo"
                            ? "Play individually"
                            : "Play with partners"}
                        </p>
                        <p>
                          •{" "}
                          {waitingRoom.gameMode === "practice"
                            ? "Practice mode - no stakes"
                            : "Real mode - play for wager"}
                        </p>
                        {waitingRoom.wagerAmount > 0 && (
                          <p className="font-medium text-primary">
                            • Winner gets 2x wager ($
                            {waitingRoom.wagerAmount * 2} total)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Players
                  </CardTitle>
                  <CardDescription>
                    {waitingRoom.players.length === 4
                      ? "All players joined! Game starting soon..."
                      : `Waiting for ${
                          4 - waitingRoom.players.length
                        } more player${
                          4 - waitingRoom.players.length !== 1 ? "s" : ""
                        }...`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {waitingRoom.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={player.avatar} />
                            <AvatarFallback>
                              {player.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center">
                              {player.name}
                              {player.isHost && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  Host
                                </Badge>
                              )}
                              {player.isBot && (
                                <Badge
                                  variant="secondary"
                                  className="ml-2 text-xs"
                                >
                                  AI
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Position: {player.position}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {Array.from({ length: 4 - waitingRoom.players.length }).map(
                      (_, index) => (
                        <div
                          key={`empty-${index}`}
                          className="flex items-center p-3 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20"
                        >
                          <div className="flex items-center text-muted-foreground">
                            <Avatar className="h-10 w-10 mr-3 opacity-30">
                              <AvatarFallback>?</AvatarFallback>
                            </Avatar>
                            <div className="italic">Waiting for player...</div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div className="flex flex-col md:flex-row gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => leaveWaitingRoom()}
                    >
                      Leave Room
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Room ID display at the bottom */}
            <div className="mt-6 p-4 bg-muted rounded-lg flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center mb-3 sm:mb-0">
                <span className="text-sm text-muted-foreground mr-2">
                  Room ID:
                </span>
                <code className="font-mono text-xs bg-background p-2 rounded">
                  {waitingRoom.id}
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  navigator.clipboard.writeText(waitingRoom.id);
                  toast({
                    title: "Copied",
                    description: "Room ID copied to clipboard",
                  });
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-2" />
                Copy ID
              </Button>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <p className="mb-4">No waiting room data available</p>
                <Button onClick={() => navigate("/lobby")}>
                  Return to Lobby
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SimpleWaitingRoom;