import React, { useEffect, useState } from "react";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Filter, Bot, Shield, Gamepad } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface GameFilters {
  mode: 'practice' | 'real';
  type: 'solo' | 'partnered';
  wagerAmount: number | null;
}

export interface GameTypePlayerCount {
  mode: 'practice' | 'real';
  type: 'solo' | 'partnered';
  wagerAmount: number;
  count: number;
}

interface GameFilterBarProps {
  filters: GameFilters;
  onFilterChange: (filters: GameFilters) => void;
  onStartGame: () => void;
  playerCounts?: GameTypePlayerCount[];
}

const GameFilterBar: React.FC<GameFilterBarProps> = ({ 
  filters, 
  onFilterChange, 
  onStartGame,
  playerCounts = []
}) => {
  const [wagerOptions, setWagerOptions] = useState<number[]>([]);

  useEffect(() => {
    const fetchWagerOptions = async () => {
      const { data, error } = await supabase.from("preset_games").select("wagerAmount");
      if (!error && data) {
        setWagerOptions([...new Set(data.map(game => game.wagerAmount))].sort((a, b) => a - b));
      }
    };
    fetchWagerOptions();
  }, []);

  const handleWagerChange = (value: string) => {
    onFilterChange({ 
      ...filters, 
      wagerAmount: value ? parseInt(value, 10) : null 
    });
  };

  return (
    <div className="w-full space-y-4 bg-card rounded-lg p-4 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Gamepad className="h-5 w-5" />
          Game Options
        </h3>

        {/* Wager Filter Dropdown */}
        {filters.mode === 'real' && wagerOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="wagerFilter" className="text-sm font-medium">
              Filter by Wager:
            </label>
            <select
              id="wagerFilter"
              className="border border-gray-300 rounded-md p-2"
              value={filters.wagerAmount || ""}
              onChange={(e) => handleWagerChange(e.target.value)}
            >
              <option value="">All</option>
              {wagerOptions.map(amount => (
                <option key={amount} value={amount}>${amount}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameFilterBar;
