import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GameTableList from "./GameTableList";
import { GameTable } from "@/types/lobby";
import EnhancedTableFilter, { TableFilters } from "./EnhancedTableFilter";
import { useState } from "react";

interface GameTableFilterProps {
  tables: GameTable[];
  onFilter: (filters: TableFilters) => void;
  activeFilters: TableFilters;
  currentPage: number;
  onPageChange: (page: number) => void;
  tablesPerPage: number;
}

const GameTableFilter = ({ 
  tables, 
  onFilter,
  activeFilters,
  currentPage,
  onPageChange,
  tablesPerPage
}: GameTableFilterProps) => {
  const [wagerFilter, setWagerFilter] = useState<number | null>(null);

  // Filter tables based on wager amount
  const filteredTables = tables.filter(table =>
    wagerFilter ? table.wager === wagerFilter : true
  );

  const handleWagerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const wager = event.target.value ? parseInt(event.target.value, 10) : null;
    setWagerFilter(wager);
  };

  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 md:mb-6">
        <TabsList className="h-auto">
          <TabsTrigger value="all">All Tables</TabsTrigger>
          <TabsTrigger value="solo">Solo (1v3)</TabsTrigger>
          <TabsTrigger value="partnered">Partnered (2v2)</TabsTrigger>
        </TabsList>
        
        {/* Wager Filter Dropdown */}
        <div>
          <label htmlFor="wagerFilter" className="mr-2">Filter by Wager:</label>
          <select
            id="wagerFilter"
            className="border border-gray-300 rounded-md p-2"
            value={wagerFilter || ""}
            onChange={handleWagerChange}
          >
            <option value="">All</option>
            <option value="5">$5</option>
            <option value="10">$10</option>
            <option value="25">$25</option>
            <option value="50">$50</option>
            <option value="100">$100</option>
            <option value="250">$250</option>
            <option value="500">$500</option>
          </select>
        </div>

        <EnhancedTableFilter 
          onFilterChange={onFilter}
          activeFilters={activeFilters}
        />
      </div>
      
      <TabsContent value="all">
        <GameTableList 
          tables={filteredTables} 
          mode="all" 
          currentPage={currentPage}
          onPageChange={onPageChange}
          tablesPerPage={tablesPerPage}
        />
      </TabsContent>
      
      <TabsContent value="solo">
        <GameTableList 
          tables={filteredTables} 
          mode="solo" 
          currentPage={currentPage}
          onPageChange={onPageChange}
          tablesPerPage={tablesPerPage}
        />
      </TabsContent>
      
      <TabsContent value="partnered">
        <GameTableList 
          tables={filteredTables} 
          mode="partnered" 
          currentPage={currentPage}
          onPageChange={onPageChange}
          tablesPerPage={tablesPerPage}
        />
      </TabsContent>
    </Tabs>
  );
};

export default GameTableFilter;
