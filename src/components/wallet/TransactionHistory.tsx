import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowDown, ArrowUp, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export const TransactionHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("id, type, payment_method, amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw new Error(error.message);

        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast({
          title: "Error",
          description: "Failed to load transaction history.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const calculateBalance = () => {
    return transactions
      .filter((txn) => txn.status === "completed") // Only count completed transactions
      .reduce((total, txn) => {
        if (txn.type === "deposit" || txn.type === "game_win") {
          return total + txn.amount; // Add deposits and wins
        } else if (txn.type === "withdrawal" || txn.type === "game_loss") {
          return Math.max(0, total - txn.amount); // Subtract withdrawals & losses, prevent negative balance
        }
        return total;
      }, 0);
  };
  
  const balance = calculateBalance();

  const filteredTransactions = transactions.filter(txn => {
    return txn.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
           txn.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (txn.payment_method && txn.payment_method.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // ✅ Get Transaction Icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case "withdrawal":
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case "game_win":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "game_loss":
        return <DollarSign className="h-4 w-4 text-red-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // ✅ Get Transaction Name
  const getTransactionName = (txn: any) => {
    switch (txn.type) {
      case "deposit":
        return `Deposit via ${txn.payment_method}`;
      case "withdrawal":
        return `Withdrawal to ${txn.payment_method}`;
      case "game_win":
        return `Game Win (ID: ${txn.gameId})`;
      case "game_loss":
        return `Game Loss (ID: ${txn.gameId})`;
      default:
        return "Transaction";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>View your past deposits, withdrawals, and game transactions</CardDescription>
     
        
      </CardHeader>

      <CardContent>
        {/* ✅ Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* ✅ Transaction List */}
        <div className="space-y-4">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {getTransactionIcon(txn.type)}
                  </div>
                  <div>
                    <p className="font-medium">{getTransactionName(txn)}</p>
                    <p className="text-sm text-muted-foreground">
                      {txn.created_at ? format(new Date(txn.created_at), 'MMM d, h:mm a') : 'Invalid Date'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  
               {/* ✅ Correct Transaction Amount Formatting */}
<p className={`font-medium ${
  txn.type === "withdrawal" ? "text-red-500" : "text-green-500"
}`}>
  {txn.type === "withdrawal"
    ? `-$${txn.amount.toFixed(2)}`  
    : `+$${txn.amount.toFixed(2)}`}  
</p>




                  {/* ✅ Transaction Status Badge */}
                  <Badge 
  variant={txn.status === "completed" ? "outline" : "secondary"}
  className={txn.status === "completed" ? "border-green-500 text-green-500" : ""}
>
  {txn.status === "completed" ? "Completed" : 'Pending'} {/* ✅ Update Text */}
</Badge>

                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions found matching your search.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
