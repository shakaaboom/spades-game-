import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Transaction, TransactionType } from "@/services/walletService";

export function useWallet() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper function to validate UUID format
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Fetch user balance from Supabase
  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching balance for user ID:", user.id);

      if (!isValidUUID(user.id)) {
        console.log("User ID is not a valid UUID format, using demo mode");
        setBalance(100);
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      // Fetch profile balance
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      setBalance(profileData?.balance || 0);

      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (transactionError) {
        console.error("Error fetching transactions:", transactionError);
      } else {
        setTransactions(transactionData as Transaction[]);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your balance",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Deposit funds
  const deposit = useCallback(async (amount: number, payment_method: string) => {
    if (!user) return;

    try {
      setIsLoading(true);

      if (!isValidUUID(user.id)) {
        setBalance(balance + amount);
        setTransactions(prev => [
          {
            id: `demo-txn-${Date.now()}`,
            userId: user.id,
            amount: amount,
            type: TransactionType.DEPOSIT,
            timestamp: new Date().toISOString(),
            status: "completed",
          },
          ...prev,
        ]);
        setIsLoading(false);
        return;
      }

      const { error: transactionError } = await supabase.rpc("process_deposit", {
        deposit_amount: amount,
        payment_method,
        user_id: user.id,
      });

      if (transactionError) {
        console.error("Error processing deposit:", transactionError);
        throw transactionError;
      }

      await fetchBalance();

      toast({
        title: "Deposit Successful",
        description: `$${amount.toFixed(2)} has been added to your account`,
      });
    } catch (error) {
      console.error("Deposit error:", error);
      toast({
        title: "Deposit Failed",
        description: "There was an error processing your deposit",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, balance, toast, fetchBalance]);

  // Withdraw funds
  const withdraw = useCallback(async (amount: number) => {
    if (!user) return;

    try {
      setIsLoading(true);

      if (amount > balance) {
        throw new Error("Insufficient funds");
      }

      if (!isValidUUID(user.id)) {
        setBalance(balance - amount);
        setTransactions(prev => [
          {
            id: `demo-txn-${Date.now()}`,
            userId: user.id,
            amount: amount,
            type: TransactionType.WITHDRAWAL,
            timestamp: new Date().toISOString(),
            status: "pending",
          },
          ...prev,
        ]);
        setIsLoading(false);
        return;
      }

      const { error: transactionError } = await supabase.rpc("process_withdrawal", {
        user_id: user.id,
        withdrawal_amount: amount,
      });

      if (transactionError) {
        console.error("Error processing withdrawal:", transactionError);
        throw transactionError;
      }

      await fetchBalance();

      toast({
        title: "Withdrawal Successful",
        description: `$${amount.toFixed(2)} has been withdrawn.`,
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, balance, toast, fetchBalance]);

  // Update balance after game
  const updateGameResult = useCallback(async (amount: number, won: boolean, gameId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);

      const type = won ? TransactionType.GAME_WIN : TransactionType.GAME_LOSS;

      if (!isValidUUID(user.id)) {
        let newBalance = balance + (won ? amount : -amount);
        setBalance(newBalance);
        setTransactions(prev => [
          {
            id: `demo-txn-${Date.now()}`,
            userId: user.id,
            amount: amount,
            type: type,
            timestamp: new Date().toISOString(),
            status: "completed",
            gameId,
          },
          ...prev,
        ]);
        setIsLoading(false);
        return;
      }

      const functionName = won ? "process_game_win" : "process_game_wager";
      const { error: transactionError } = await supabase.rpc(functionName, {
        user_id: user.id,
        game_amount: amount,
      });

      if (transactionError) {
        console.error("Error processing game result:", transactionError);
        throw transactionError;
      }

      await fetchBalance();

      toast({
        title: won ? "You Won!" : "Game Lost",
        description: won
          ? `$${amount.toFixed(2)} has been added to your account`
          : `$${amount.toFixed(2)} has been deducted from your account`,
      });
    } catch (error) {
      console.error("Game result update error:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update your balance after the game",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, balance, toast, fetchBalance]);

  return {
    balance,
    transactions,
    isLoading,
    deposit,
    withdraw,
    updateGameResult,
    refreshBalance: fetchBalance,
  };
}
