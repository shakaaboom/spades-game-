
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Users,
  Clock,
  ChevronRight,
  User,
  Trophy,
  RefreshCw
} from "lucide-react";
import { GameTable } from "@/types/lobby";
import TablesPagination from "./TablesPagination";
import { useToast } from "@/hooks/use-toast";

interface GameTableListProps {
  tables: GameTable[];
  mode: "all" | "solo" | "partnered";
  currentPage: number;
  onPageChange: (page: number) => void;
  tablesPerPage: number;
}

const GameTableList = ({ 
  tables, 
  mode, 
  currentPage,
  onPageChange,
  tablesPerPage
}: GameTableListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const filteredTables = mode === "all" 
    ? tables 
    : tables.filter((table) => table.mode === mode);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredTables.length / tablesPerPage));
  const startIndex = (currentPage - 1) * tablesPerPage;
  const paginatedTables = filteredTables.slice(startIndex, startIndex + tablesPerPage);
  
  const handleJoinTable = (tableId: string) => {
    // In a real app, you would emit a 'joinQueue' event via WebSocket here
    
    toast({
      title: "Joining game room",
      description: "Redirecting you to the waiting room..."
    });
    
    // Redirect to waiting room instead of directly to game
    navigate(`/waiting-room/${tableId}`);
  };
  
  return (
    <>
      <div className="space-y-4">
        {paginatedTables.map((table) => (
          <div
            key={table.id}
            className="border border-border bg-card rounded-lg shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between"
          >
            <div className="flex-grow mb-4 md:mb-0">
              <div className="flex items-center">
                <div className="mr-3">
                  {table.mode === "solo" ? (
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-medium truncate">
                    {table.mode === "solo"
                      ? "Solo Spades (1v3)"
                      : "Partnered Spades (2v2)"}
                  </h3>
                  <div className="flex flex-wrap items-center text-sm text-muted-foreground">
                    <div className="flex items-center mr-3 mb-1 md:mb-0">
                      <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span>${table.stake} Buy-in</span>
                    </div>
                    <div className="flex items-center mr-3 mb-1 md:mb-0">
                      <Trophy className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span>{table.pointsToWin} Points</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end w-full md:w-auto">
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 text-muted-foreground mr-1" />
                <span>
                  {table.players}/{table.maxPlayers}
                </span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-secondary">
                  {table.status === "open" 
                    ? "Open" 
                    : table.status === "in-progress" 
                      ? "In Progress" 
                      : "Full"}
                </span>
              </div>
              
              {table.status === "full" ? (
                <Button variant="outline" disabled className="mt-2 md:mt-0 md:ml-4 w-full md:w-auto">
                  Full
                </Button>
              ) : (
                <Button 
                  className="mt-2 md:mt-0 md:ml-4 w-full md:w-auto"
                  onClick={() => handleJoinTable(table.id)}
                >
                  Join <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        
        {paginatedTables.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tables available with current filters</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Tables
            </Button>
          </div>
        )}
      </div>
      
      {filteredTables.length > tablesPerPage && (
        <TablesPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default GameTableList;
