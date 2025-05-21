import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { useWaitingRoom } from "@/hooks/use-waiting-room";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, DollarSign, Users, Clock, Play, Trophy, Info } from "lucide-react";
import WaitingRoomChat from "@/components/waiting-room/WaitingRoomChat";
import PlayerMovementChat from "@/components/waiting-room/PlayerMovementChat";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const WaitingRoom = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  const gameMode = searchParams.get('mode') as 'practice' | 'real' | undefined;
  const gameType = searchParams.get('type') as 'solo' | 'partnered' | undefined;
  const wagerAmount = searchParams.get('wager') ? parseInt(searchParams.get('wager') || '0') : undefined;
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { socket, isConnected } = useWebSocket();
  
  const isValidUUID = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  useEffect(() => {
    console.log("WaitingRoom - Extracted parameters:", {
      id,
      isValidUUID,
      gameMode,
      gameType,
      wagerAmount,
    });
    
    if (id && !isValidUUID) {
      toast({
        title: "Invalid Room ID",
        description: "The waiting room ID is not valid",
        variant: "destructive"
      });
      navigate("/lobby");
    }
  }, [id, isValidUUID, gameMode, gameType, wagerAmount, navigate, toast]);
  
  const { waitingRoom, isLoading, leaveWaitingRoom, setPlayerReady, startGame, refreshWaitingRoom, joinWaitingRoom } = useWaitingRoom({ 
    roomId: isValidUUID ? id : undefined,
    mode: gameMode,
    gameType: gameType,
    wagerAmount: wagerAmount
  });
  
  console.log("Current waiting room data:", waitingRoom);
  console.log("isLoading state:", isLoading);
  
  useEffect(() => {
    console.log("WaitingRoom - Parameters passed to useWaitingRoom:", {
      roomId: isValidUUID ? id : undefined,
      mode: gameMode,
      gameType: gameType,
      wagerAmount: wagerAmount !== undefined ? wagerAmount : "undefined",
    });
  }, [id, isValidUUID, gameMode, gameType, wagerAmount]);
  
  const [adShowing, setAdShowing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    console.log("WaitingRoom mounted with ID param:", id);
    console.log("WaitingRoom query parameters:", {
      mode: gameMode,
      gameType: gameType,
      wagerAmount: wagerAmount
    });
    console.log("Current user:", user?.id);
    
    if (id && isValidUUID && user) {
      console.log("Valid room ID detected:", id);
      setIsJoining(true);
      
      const ensureJoined = async () => {
        try {
          console.log("Ensuring user is joined to the room");
          await joinWaitingRoom(id);
          
          // Force refresh after joining
          setTimeout(async () => {
            console.log("Forcing refresh after join");
            await refreshWaitingRoom();
            setIsJoining(false);
          }, 1000);
        } catch (error) {
          console.error("Error joining room:", error);
          setIsJoining(false);
        }
      };
      
      ensureJoined();
    } else if (!user) {
      console.log("No user logged in yet");
    } else if (!id || !isValidUUID) {
      console.error("No valid room ID detected in URL parameters");
      toast({
        title: "Error",
        description: "No valid waiting room ID was found",
        variant: "destructive"
      });
    }
  }, [id, isValidUUID, user, gameMode, gameType, wagerAmount, joinWaitingRoom, refreshWaitingRoom, toast]);

  const handleManualJoin = async () => {
    if (!id || !user) return;
    
    setIsJoining(true);
    try {
      const success = await joinWaitingRoom(id);
      if (success) {
        await refreshWaitingRoom();
        toast({
          title: "Success",
          description: "You've joined the waiting room",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to join waiting room",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error joining room manually:", error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!user) {
      console.error("Cannot leave room - no user logged in");
      return;
    }
    
    console.log("Leaving room:", id, "User:", user.id);
    
    if (await leaveWaitingRoom()) {
      navigate("/lobby");
      toast({
        title: "Left waiting room",
        description: "You have left the waiting room",
      });
    }
  };

  const handleReadyToggle = async () => {
    if (!waitingRoom || !user) {
      console.error("Cannot toggle ready - missing waitingRoom or user");
      return;
    }
    
    const isPlayerReady = waitingRoom.players.find(p => p.id === user.id)?.isReady;
    console.log("Toggling ready status from", isPlayerReady, "to", !isPlayerReady);
    await setPlayerReady(!isPlayerReady);
  };

  const handleStartGame = async () => {
    await startGame();
  };

  useEffect(() => {
    if (waitingRoom && user) {
      console.log("DEBUG - WaitingRoom render with state:", {
        roomId: waitingRoom.id,
        players: waitingRoom.players.length,
        isLoading
      });
      
      waitingRoom.players.forEach(player => {
        console.log(`Player ${player.id}:`, {
          name: player.name || "NO NAME FOUND",
          avatar: player.avatar,
          isReady: player.isReady,
          position: player.position
        });
      });
    }
  }, [waitingRoom, user, isLoading]);

  const getGameRules = () => {
    if (waitingRoom?.gameType === "partnered") {
      return "Play with a partner in a 2v2 match. First team to reach 200 points wins.";
    } else {
      return "Play solo against three opponents. First player to reach 200 points wins.";
    }
  };

  if (isLoading && (!waitingRoom || !waitingRoom.players || waitingRoom.players.length === 0)) {
    return (
      <Layout>
        <div className="pt-20 pb-16 container">
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
            <h1 className="text-xl md:text-2xl font-bold">Loading Waiting Room {id && `(ID: ${id})`}</h1>
          </div>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-secondary rounded w-3/4 mx-auto"></div>
                <div className="h-24 bg-secondary/60 rounded"></div>
                <div className="h-12 bg-secondary rounded w-1/2 mx-auto"></div>
                <Button onClick={refreshWaitingRoom} className="mt-4">
                  Retry Loading
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isValidUUID) {
    return (
      <Layout>
        <div className="pt-20 pb-16 container">
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
            <h1 className="text-xl md:text-2xl font-bold">Invalid Waiting Room ID</h1>
          </div>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <h2 className="text-xl">The waiting room ID is not valid</h2>
                <p>Please return to the lobby and join a valid game.</p>
                <Button
                  variant="default"
                  onClick={() => navigate("/lobby")}
                  className="mt-4"
                >
                  Return to Lobby
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const isUserInRoom = user && waitingRoom?.players && waitingRoom.players.some(player => player.id === user.id);
  const playerCount = waitingRoom?.players?.length || 0;
  
  if (!isUserInRoom && user) {
    return (
      <Layout>
        <div className="pt-20 pb-16 container">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/lobby")}
              className="mr-2"
              disabled={adShowing}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lobby
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">Joining Waiting Room {id && `(ID: ${id})`}</h1>
          </div>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <h2 className="text-xl">Connecting to game room...</h2>
                <p>If you're not automatically redirected, please try refreshing the page.</p>
                <Button 
                  onClick={handleManualJoin}
                  className="mt-4"
                  disabled={isJoining}
                >
                  {isJoining ? "Joining..." : "Join Room"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/lobby")}
                  className="ml-2 mt-4"
                >
                  Return to Lobby
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  console.log("Current user:", user?.id);
  console.log("Waiting room players:", waitingRoom?.players);
  waitingRoom?.players.forEach(player => {
    console.log(`Player ${player.id} name:`, player.name);
  });

  return (
    <Layout>
      <div className="pt-20 pb-16">
        <div className="container">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/lobby")}
              className="mr-2"
              disabled={adShowing}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lobby
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">Waiting Room {id && `(ID: ${id})`}</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            <div className="lg:col-span-7 space-y-4 md:space-y-6">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl flex items-center justify-between">
                    <span>
                      {waitingRoom?.gameType === "partnered"
                        ? "Partnered Spades (2v2)"
                        : "Solo Spades (1v3)"}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{getGameRules()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="flex flex-wrap gap-3 md:gap-4 mb-6">
                    <div className="bg-secondary/60 rounded-lg px-3 py-2 text-sm flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>${waitingRoom?.wagerAmount || 0} Buy-in</span>
                    </div>
                    <div className="bg-secondary/60 rounded-lg px-3 py-2 text-sm flex items-center">
                      <Trophy className="h-4 w-4 mr-1" />
                      <span>${(waitingRoom?.wagerAmount || 0) * 4} Prize Pool</span>
                    </div>
                    <div className="bg-secondary/60 rounded-lg px-3 py-2 text-sm flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>200 Points to Win</span>
                    </div>
                    <div className="bg-secondary/60 rounded-lg px-3 py-2 text-sm flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>
                        <strong>{playerCount}/4</strong> Players
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {Array.from({ length: 4 }).map(
                      (_, index) => {
                        const player = waitingRoom?.players[index];
                        return (
                          <Card
                            key={index}
                            className={`border ${
                              player
                                ? player.isReady 
                                  ? "border-green-500/50 bg-green-500/5"
                                  : "border-primary/20 bg-primary/5"
                                : "border-dashed border-border/60 bg-secondary/30"
                            }`}
                          >
                            <CardContent className="p-4 flex flex-col items-center justify-center min-h-[140px]">
                              {player ? (
                                <>
                                  <Avatar className="h-14 w-14 mb-3">
                                    <AvatarImage src={player.avatar} alt={player.name || "Player"} />
                                    <AvatarFallback
                                      className={
                                        player.id === user?.id
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-secondary"
                                      }
                                    >
                                      {player.name
                                        ? player.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                        : "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <p className="font-medium text-base text-center mb-1 w-full overflow-hidden text-ellipsis max-w-full">
                                    {player.name ? player.name : "Unknown Player"}
                                    {player.id === user?.id && " (You)"}
                                  </p>
                                  <span className="text-xs text-muted-foreground block">
                                    {player.position}
                                  </span>
                                  {player.isReady && (
                                    <span className="text-xs text-green-500 mt-1 block">Ready</span>
                                  )}
                                </>
                              ) : (
                                <div className="text-center text-muted-foreground flex flex-col items-center">
                                  <Users className="h-10 w-10 mb-2 text-muted-foreground/40" />
                                  <span>Waiting for player...</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      }
                    )}
                  </div>

                  {adShowing ? (
                    <div className="mt-6 p-6 bg-secondary/80 rounded-lg text-center">
                      <h3 className="text-lg font-semibold mb-2">
                        Your game is about to begin!
                      </h3>
                      <p className="mb-4">
                        Game starts in{" "}
                        <span className="font-bold text-primary">
                          {countdown}
                        </span>{" "}
                        seconds
                      </p>
                      <div className="w-full bg-background rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-linear"
                          style={{
                            width: `${(countdown / 30) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-between items-center mt-6 gap-2">
                      <p className="text-muted-foreground">
                        {playerCount === 1
                          ? "Waiting for more players to join..."
                          : `Waiting for ${4 - playerCount} more player(s)...`}
                      </p>
                      <div className="flex gap-2">
                        {!adShowing && user && (
                          <>
                            <Button
                              variant={
                                waitingRoom.players.find(p => p.id === user.id)?.isReady 
                                ? "outline" 
                                : "default"
                              }
                              onClick={handleReadyToggle}
                              size="sm"
                            >
                              {waitingRoom.players.find(p => p.id === user.id)?.isReady 
                                ? "Cancel Ready" 
                                : "Ready"}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={handleLeaveRoom}
                              size="sm"
                            >
                              Leave Room
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-4 md:space-y-6">
              <div className="h-[350px] md:h-[400px]">
                <WaitingRoomChat roomId={id || ""} />
              </div>
              
              <div className="h-[250px] md:h-[300px]">
                <PlayerMovementChat roomId={id || ""} />
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Game ID: <span className="font-mono">{id}</span>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WaitingRoom;
