import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ArrowUpRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const WithdrawMethods = () => {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [credential, setCredential] = useState("");
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single();

        if (error) throw new Error(error.message);
        setAvailableBalance(data?.balance ?? 0);
      } catch (error) {
        console.error("Error fetching balance:", error);
        toast({
          title: "Error",
          description: "Failed to retrieve your balance.",
          variant: "destructive",
        });
      }
    };

    fetchBalance();
  }, [user]);

  const handleWithdraw = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to request a withdrawal.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is $10.",
        variant: "destructive",
      });
      return;
    }

    if (!withdrawMethod) {
      toast({
        title: "Method Required",
        description: "Please select a withdrawal method.",
        variant: "destructive",
      });
      return;
    }

    if (!credential.trim()) {
      toast({
        title: "Credential Required",
        description: `Please enter your ${withdrawMethod} details.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Fetch latest balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Failed to fetch balance.");
      }

      if (profile.balance < amount) {
        toast({
          title: "Insufficient Funds",
          description: "Your withdrawal amount exceeds your available balance.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Insert withdrawal request
      const { error: withdrawError } = await supabase
      .from("withdrawal_requests")
      .insert([
        {
          user_id: user.id,
          amount: amount,
          status: "pending",
          created_at: new Date().toISOString(),
          processed_at: null,
          notes: "",
          withdrawal_method: withdrawMethod, // Ensure this matches the DB column name
          credential: credential,
        },
      ]);
    

      if (withdrawError) {
        throw new Error("Failed to log withdrawal request.");
      }

      // Deduct balance after successful request insertion
      const newBalance = profile.balance - amount;

      const { error: balanceUpdateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (balanceUpdateError) {
        throw new Error("Failed to deduct balance.");
      }

      toast({
        title: "Withdrawal Submitted",
        description: `Your withdrawal request of $${amount} has been logged.`,
      });

      // Refresh the balance after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({
        title: "Withdrawal Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw Funds</CardTitle>
        <CardDescription>Transfer money to your preferred payment method.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Withdrawal Information</AlertTitle>
          <AlertDescription>
            Withdrawals are manually processed and may take up to 24 hours. Minimum withdrawal amount is $10.
          </AlertDescription>
        </Alert>

        {/* Withdraw Amount */}
        <div className="space-y-2">
          <Label htmlFor="withdraw-amount">Amount</Label>
          <Input
            id="withdraw-amount"
            type="number"
            min="10"
            step="0.01"
            placeholder="0.00"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Available balance: ${availableBalance.toFixed(2)}
          </p>
        </div>

        {/* Withdrawal Method */}
        <div className="space-y-2">
          <Label htmlFor="withdraw-method">Withdrawal Method</Label>
          <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
            <SelectTrigger id="withdraw-method">
              <SelectValue placeholder="Select withdrawal method" />
            </SelectTrigger>
            <SelectContent>
              {["paypal", "venmo", "cashapp", "applepay", "zelle"].map((method) => (
                <SelectItem key={method} value={method}>
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Withdrawal Credential */}
        <div className="space-y-2">
          <Label htmlFor="credential">Your {withdrawMethod} Account</Label>
          <Input
            id="credential"
            type="text"
            placeholder={`Enter your ${withdrawMethod} details`}
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
          />
        </div>

        {/* Withdraw Button */}
        <Button onClick={handleWithdraw} className="w-full flex items-center gap-2" disabled={isLoading}>
          <ArrowUpRight className="h-4 w-4" />
          {isLoading ? "Processing..." : "Withdraw Funds"}
        </Button>
      </CardContent>
    </Card>
  );
};
