import { useState, useEffect } from "react";
import { CircleDollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BalanceDisplayProps {
  className?: string;
}

const BalanceDisplay = ({ className = "" }: BalanceDisplayProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        // Fetch balance from Supabase "profiles" table
        const { data, error } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id) // Ensure correct column name
          .single();

        if (error) throw new Error(error.message);

        setBalance(data.balance ?? 0); // Default to 0 if balance is null
      } catch (error) {
        console.error("Error fetching balance:", error);
        toast({
          title: "Error",
          description: "Failed to fetch your balance",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();

    // **Subscribe to real-time balance updates**
    const balanceSubscription = supabase
      .channel("balance_updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          if (payload.new.id === user.id) {
            setBalance(payload.new.balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(balanceSubscription);
    };
  }, [user, toast]);

  if (!user || balance === null) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Link to="/wallet">
              <Button
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 ${className}`}
                disabled={isLoading}
              >
                <CircleDollarSign className="h-4 w-4" />
                <span className="font-medium">
                  {isLoading ? "Loading..." : `$${balance.toFixed(2)}`}
                </span>
              </Button>
            </Link>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Your current balance - Click to view wallet</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BalanceDisplay;
