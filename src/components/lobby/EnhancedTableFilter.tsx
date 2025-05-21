
import { useState } from "react";
import { 
  Filter,
  DollarSign,
  Users,
  Trophy,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { GameTable } from "@/types/lobby";
import { Label } from "@/components/ui/label";

export type TableFilters = {
  stake: number | null;
  pointsToWin: number | null;
  playersCount: number | null;
};

interface EnhancedTableFilterProps {
  onFilterChange: (filters: TableFilters) => void;
  activeFilters: TableFilters;
}

const EnhancedTableFilter = ({ 
  onFilterChange,
  activeFilters
}: EnhancedTableFilterProps) => {
  const [localFilters, setLocalFilters] = useState<TableFilters>(activeFilters);
  
  const handleFilterChange = (key: keyof TableFilters, value: number | null) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };
  
  const applyFilters = () => {
    onFilterChange(localFilters);
  };
  
  const resetFilters = () => {
    const emptyFilters = {
      stake: null,
      pointsToWin: null,
      playersCount: null
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };
  
  const hasActiveFilters = Object.values(activeFilters).some(val => val !== null);
  
  return (
    <div className="flex items-center justify-end">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={hasActiveFilters ? "default" : "outline"} 
            size="sm"
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Tables</h4>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Stake</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2.5, 5, 10, 20].map(stake => (
                  <Button 
                    key={stake} 
                    variant={localFilters.stake === stake ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleFilterChange("stake", localFilters.stake === stake ? null : stake)}
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    {stake}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Points to Win</Label>
              <div className="flex flex-wrap gap-2">
                {[150, 200, 300].map(points => (
                  <Button
                    key={points}
                    variant={localFilters.pointsToWin === points ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange("pointsToWin", localFilters.pointsToWin === points ? null : points)}
                  >
                    <Trophy className="h-3 w-3 mr-1" />
                    {points}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Players</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map(count => (
                  <Button
                    key={count}
                    variant={localFilters.playersCount === count ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange("playersCount", localFilters.playersCount === count ? null : count)}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {count}
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <Button className="w-full" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EnhancedTableFilter;
