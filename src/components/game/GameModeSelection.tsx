
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { Bot, Users, DollarSign, Shield } from 'lucide-react';

const GameModeSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { socket, setGameMode, setGameType } = useWebSocket();
  const [selectedMode, setSelectedMode] = React.useState<'practice' | 'real'>('practice');
  const [selectedType, setSelectedType] = React.useState<'solo' | 'partnered'>('partnered');
  const [isLoading, setIsLoading] = React.useState(false);
  
  React.useEffect(() => {
    if (socket) {
      // Listen for practice game creation
      socket.on('practiceGameCreated', (data) => {
        setIsLoading(false);
        
        toast({
          title: 'Practice Game Created',
          description: `${selectedType === 'solo' ? 'Solo' : 'Partnered'} game with AI bots is ready!`,
        });
        
        // Navigate to the game table
        navigate(`/game/${data.gameId}`);
      });
      
      // Listen for joining the queue
      socket.on('joinedQueue', (data) => {
        setIsLoading(false);
        
        toast({
          title: 'Joined Queue',
          description: `You are position ${data.position} in the queue.`,
        });
        
        // Navigate to waiting room
        navigate(`/waiting-room/table1`);
      });
      
      return () => {
        socket.off('practiceGameCreated');
        socket.off('joinedQueue');
      };
    }
  }, [socket, navigate, toast, selectedType]);
  
  const handleStartGame = () => {
    if (!socket) return;
    setIsLoading(true);
    setGameMode(selectedMode);
    setGameType(selectedType);
    
    toast({
      title: 'Preparing Game',
      description: selectedMode === 'practice' ? 
        'Setting up your practice game with AI bots...' : 
        'Finding opponents for your game...',
    });
    
    // Tell the server our selection
    socket.emit('selectGameMode', selectedMode, selectedType);
  };
  
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">Select Game Mode</h2>
      <div className="space-y-6">
        {/* Game Mode Selection */}
        <div className="space-y-4">
          <h3 className="font-medium">Game Mode</h3>
          <RadioGroup
            defaultValue={selectedMode}
            value={selectedMode}
            onValueChange={(value: 'practice' | 'real') => setSelectedMode(value)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="practice"
                id="practice"
                className="peer sr-only"
              />
              <Label
                htmlFor="practice"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Bot className="mb-3 h-6 w-6" />
                <div className="text-center space-y-1">
                  <h4 className="font-medium">Practice Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Play against AI bots
                  </p>
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                    No Real Money
                  </div>
                </div>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem
                value="real"
                id="real"
                className="peer sr-only"
              />
              <Label
                htmlFor="real"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <DollarSign className="mb-3 h-6 w-6" />
                <div className="text-center space-y-1">
                  <h4 className="font-medium">Real Money Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Compete with real players
                  </p>
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-warning/10 text-warning hover:bg-warning/20">
                    Wager Required
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Game Type Selection */}
        <div className="space-y-4">
          <h3 className="font-medium">Game Type</h3>
          <RadioGroup
            defaultValue={selectedType}
            value={selectedType}
            onValueChange={(value: 'solo' | 'partnered') => setSelectedType(value)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="solo"
                id="solo"
                className="peer sr-only"
              />
              <Label
                htmlFor="solo"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Shield className="mb-3 h-6 w-6" />
                <div className="text-center space-y-1">
                  <h4 className="font-medium">Solo (1v3)</h4>
                  <p className="text-sm text-muted-foreground">
                    You against three opponents
                  </p>
                </div>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem
                value="partnered"
                id="partnered"
                className="peer sr-only"
              />
              <Label
                htmlFor="partnered"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Users className="mb-3 h-6 w-6" />
                <div className="text-center space-y-1">
                  <h4 className="font-medium">Partnered (2v2)</h4>
                  <p className="text-sm text-muted-foreground">
                    Team up with a partner
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Practice Mode Details */}
        {selectedMode === 'practice' && (
          <div className="bg-muted p-4 rounded-lg mt-4">
            <h4 className="font-medium mb-2 flex items-center">
              <Bot className="h-4 w-4 mr-2" />
              Practice Mode Details
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  {selectedType === 'solo' 
                    ? 'You will play against three AI bots' 
                    : 'You will team up with one AI bot against two AI opponents'}
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  {selectedType === 'solo'
                    ? 'You will see your cards before bidding'
                    : 'You will NOT see your cards before bidding (option for blind nil)'}
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Standard Spades rules apply, no real money involved</span>
              </li>
            </ul>
          </div>
        )}
        
        {/* Start Game Button */}
        <div className="pt-4">
          <Button 
            className="w-full" 
            onClick={handleStartGame}
            disabled={isLoading}
          >
            {isLoading ? 'Setting up game...' : 'Start Game'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelection;
