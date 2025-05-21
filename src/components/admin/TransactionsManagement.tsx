
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, Loader2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  userName: string;
  userId: string;
  type: "game" | "deposit" | "withdrawal";
  status: "completed" | "pending" | "failed";
}

export const TransactionsManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        
        // For this demo, we'll use games as transactions
        // In a real app, you'd have a dedicated transactions table
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('id, created_at, wager_amount, created_by, status')
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (gamesError) throw gamesError;
        
        // Get user names for each game creator
        const transactionsWithUsernames = await Promise.all(
          gamesData.map(async (game) => {
            let userName = "Anonymous";
            let userId = game.created_by || "";
            
            if (game.created_by) {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', game.created_by)
                .single();
                
              if (!profileError && profileData) {
                userName = profileData.username || "Anonymous";
              }
            }
            
            // Random status for demo
            const statusOptions = ["completed", "pending", "failed"] as const;
            const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
            
            return {
              id: game.id,
              date: new Date(game.created_at),
              amount: game.wager_amount || 0,
              userName,
              userId,
              type: "game" as const,
              status: randomStatus
            };
          })
        );
        
        setTransactions(transactionsWithUsernames);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast({
          title: "Error fetching transactions",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [toast]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || transaction.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleViewTransaction = (transactionId: string) => {
    toast({
      title: "Transaction details",
      description: `Viewing transaction ${transactionId}`,
    });
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or user..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              className="p-2 rounded border border-input bg-background"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="game">Games</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="py-3 px-4 font-mono text-sm">
                        {transaction.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{transaction.date.toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{transaction.userName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {transaction.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${getStatusColor(transaction.status)}`}></div>
                          <span className="text-xs capitalize">{transaction.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewTransaction(transaction.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-3 px-4 text-center">
                      No transactions found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
