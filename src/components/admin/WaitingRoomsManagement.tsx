
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Loader2, 
  Clock, 
  DollarSign, 
  Users, 
  ArrowRight, 
  Ban,
  AlertCircle 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Player {
  id: string;
  name: string;
  avatar: string;
}

interface WaitingRoom {
  id: string;
  wagerAmount: number;
  gameType: "solo" | "partnered";
  players: Player[];
  createdAt: Date;
  status: "waiting" | "filling" | "full";
}

export const WaitingRoomsManagement = () => {
  const { toast } = useToast();
  const [waitingRooms, setWaitingRooms] = useState<WaitingRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const fetchWaitingRooms = async () => {
    try {
      setIsLoading(true);
      
      // Fetch games with status 'waiting' or 'in_progress'
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('id, wager_amount, type, created_at, status')
        .in('status', ['waiting', 'in_progress']);
        
      if (gamesError) throw gamesError;
      
      // For each game, fetch players
      const waitingRoomsWithPlayers = await Promise.all(
        gamesData.map(async (game) => {
          const { data: playersData, error: playersError } = await supabase
            .from('game_players')
            .select('id, user_id')
            .eq('game_id', game.id);
            
          if (playersError) throw playersError;
          
          // Get player profiles
          const players: Player[] = [];
          
          for (const player of playersData) {
            if (player.user_id) {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', player.user_id)
                .single();
                
              if (profileError) {
                console.error("Error fetching player profile:", profileError);
                continue;
              }
              
              players.push({
                id: player.id,
                name: profileData?.username || 'Anonymous Player',
                avatar: profileData?.avatar_url || ''
              });
            }
          }
          
          // Determine room status based on player count
          let status: WaitingRoom['status'] = "waiting";
          if (players.length === 0) {
            status = "waiting";
          } else if (players.length < 4 && game.type === 'partnered' || players.length < 2 && game.type === 'solo') {
            status = "filling";
          } else {
            status = "full";
          }
          
          return {
            id: game.id,
            wagerAmount: game.wager_amount || 0,
            gameType: (game.type === 'solo' ? 'solo' : 'partnered') as WaitingRoom['gameType'],
            players,
            createdAt: new Date(game.created_at),
            status
          };
        })
      );
      
      setWaitingRooms(waitingRoomsWithPlayers);
    } catch (error) {
      console.error("Error fetching waiting rooms:", error);
      toast({
        title: "Error fetching waiting rooms",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchWaitingRooms();
  }, [toast]);

  const filteredRooms = waitingRooms.filter(room => {
    const matchesSearch = room.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || room.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewRoom = (roomId) => {
    toast({
      title: "Action triggered",
      description: `View room ${roomId}`,
    });
  };
  
  const handleForceCloseGame = async () => {
    if (!selectedRoomId) return;
    
    try {
      // Update game status to 'closed'
      const { error: gameUpdateError } = await supabase
        .from('games')
        .update({ status: 'closed' })
        .eq('id', selectedRoomId);
      
      if (gameUpdateError) throw gameUpdateError;
      
      // Refresh the list
      await fetchWaitingRooms();
      
      toast({
        title: "Game closed",
        description: `Game ${selectedRoomId} has been force closed`,
      });
    } catch (error) {
      console.error("Error closing game:", error);
      toast({
        title: "Error closing game",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCloseDialogOpen(false);
      setSelectedRoomId(null);
    }
  };
  
  const openCloseDialog = (roomId: string) => {
    setSelectedRoomId(roomId);
    setCloseDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Waiting Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by room ID..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                className="p-2 rounded border border-input bg-background"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Rooms</option>
                <option value="waiting">Waiting</option>
                <option value="filling">Filling</option>
                <option value="full">Full</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchWaitingRooms}
              className="whitespace-nowrap"
            >
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room) => (
                  <Card key={room.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {room.gameType === 'solo' ? 'Solo Game' : 'Partnered (2v2) Game'}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            ID: {room.id}
                          </p>
                        </div>
                        <Badge variant={
                          room.status === "waiting" ? "secondary" : 
                          room.status === "filling" ? "outline" : 
                          "default"
                        }>
                          {room.status === "waiting" ? "Empty" : 
                           room.status === "filling" ? "Filling" : 
                           "Full"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center gap-2 mt-3">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium">${room.wagerAmount} Wager</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          Created {room.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Players ({room.players.length})</span>
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                        {room.players.map((player) => (
                          <Avatar key={player.id} className="h-8 w-8">
                            <AvatarImage src={player.avatar} alt={player.name} />
                            <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                        {Array(room.gameType === 'solo' ? 2 - room.players.length : 4 - room.players.length).fill(0).map((_, i) => (
                          <div key={i} className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-400">?</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button 
                          className="w-full gap-2" 
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewRoom(room.id)}
                        >
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          className="w-full gap-2" 
                          size="sm"
                          variant="destructive"
                          onClick={() => openCloseDialog(room.id)}
                        >
                          Force Close
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-6 text-center">
                  <p className="text-muted-foreground">No waiting rooms found matching your criteria</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Close Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to force close this game? This action cannot be undone
              and may affect player balances and stats.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceCloseGame} className="bg-destructive text-destructive-foreground">
              Force Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
