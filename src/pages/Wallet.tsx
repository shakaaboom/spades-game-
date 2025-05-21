
import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValid, parseISO } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CircleDollarSign, CreditCard, ArrowDown, ArrowUp, Clock, DollarSign, Receipt } from "lucide-react";
import { WithdrawMethods } from "@/components/wallet/WithdrawMethods";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import { useWallet } from "@/hooks/use-wallet";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { TransactionType } from "@/services/walletService";
import { paypalClient } from "@/integrations/paypal/client";

const Wallet = () => {
  const { balance, transactions, deposit, withdraw, isLoading, refreshBalance } = useWallet();
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("paypal");
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const [paypalButtonsLoading, setPaypalButtonsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const paypalButtonsContainerRef = useRef<HTMLDivElement>(null);

  // Handle URL query parameters for PayPal return
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const success = queryParams.get('success');
    const cancel = queryParams.get('cancel');

    if (success === 'true') {
      const amount = localStorage.getItem('pendingDepositAmount');
      const orderId = localStorage.getItem('paypalOrderId');



      navigate('/wallet', { replace: true });

      if (amount) {
        const numAmount = parseFloat(amount);
        //deposit(numAmount, depositMethod);

        localStorage.removeItem('pendingDepositAmount');
        localStorage.removeItem('paypalOrderId');

        toast({
          title: "Deposit Successful",
          description: `$${numAmount.toFixed(2)} has been added to your account`,
        });

        navigate('/wallet', { replace: true });
      }
    } else if (cancel === 'true') {
      toast({
        title: "Deposit Cancelled",
        description: "Your deposit was cancelled.",
        variant: "destructive",
      });

      localStorage.removeItem('pendingDepositAmount');
      localStorage.removeItem('paypalOrderId');
      navigate('/wallet', { replace: true });
    }
  }, [location, deposit, toast, navigate]);

  // PayPal button rendering
  const renderPayPalButtons = async () => {
    if (!paypalButtonsContainerRef.current) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 10) {
      // Clear container if already rendered
      paypalButtonsContainerRef.current.innerHTML = "";
      return;
    }

    setPaypalButtonsLoading(true);
    paypalButtonsContainerRef.current.id = 'paypal-button-container';

    try {
      await paypalClient.createDeposit(amount, "userid", "paypal-button-container", deposit);
    } catch (error) {
      console.error("Failed to render PayPal buttons:", error);
      if (paypalButtonsContainerRef.current) {
        paypalButtonsContainerRef.current.innerHTML = `
          <div class="p-4 border border-red-300 bg-red-50 text-red-700 rounded-md">
            <p>Failed to load PayPal checkout. Please try refreshing the page.</p>
          </div>
        `;
      }

      toast({
        title: "PayPal Error",
        description: "There was a problem loading PayPal checkout. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setPaypalButtonsLoading(false);
    }
  };


  // Trigger PayPal button render when amount changes
  useEffect(() => {
    if (depositMethod === "paypal" && depositAmount && parseFloat(depositAmount) > 0) {
      const timeoutId = setTimeout(() => {
        renderPayPalButtons();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [depositAmount, depositMethod]);



  const handleStripeDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!depositAmount || amount < 10) {
      toast({
        title: "Invalid amount",
        description: "Minimum deposit is $10. Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    setProcessingDeposit(true);

    try {
      deposit(amount, depositMethod);
      toast({
        title: "Deposit Successful",
        description: `$${amount.toFixed(2)} has been added to your account`,
      });

      setDepositAmount("");
    } catch (error) {
      console.error("Deposit error:", error);

      const errorMessage = error instanceof Error
        ? error.message
        : "There was an error processing your deposit.";

      toast({
        title: "Deposit Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingDeposit(false);
    }
  };

  // Function to get transaction icon
  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case TransactionType.WITHDRAWAL:
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case TransactionType.GAME_WIN:
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case TransactionType.GAME_LOSS:
        return <DollarSign className="h-4 w-4 text-red-500" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  // Function to get transaction description
  const getTransactionDescription = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return 'Deposit';
      case TransactionType.WITHDRAWAL:
        return 'Withdrawal';
      case TransactionType.GAME_WIN:
        return 'Game Win';
      case TransactionType.GAME_LOSS:
        return 'Game Loss';
      default:
        return 'Transaction';
    }
  };

  // Filter for pending transactions
  const pendingTransactions = transactions.filter(t => t.status === 'pending');

  return (
    <Layout>
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Balance</CardTitle>
                <CardDescription>Available funds for play</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <CircleDollarSign className="h-8 w-8 text-primary" />
                  {isLoading ? (
                    <span className="text-3xl font-bold animate-pulse">Loading...</span>
                  ) : (
                    <span className="text-3xl font-bold">${balance.toFixed(2)}</span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  className="w-[48%] flex items-center gap-1"
                  onClick={() => document.getElementById('deposit-tab')?.click()}
                >
                  <ArrowDown className="h-4 w-4" /> Deposit
                </Button>
                <Button
                  variant="outline"
                  className="w-[48%] flex items-center gap-1"
                  onClick={() => document.getElementById('withdraw-tab')?.click()}
                >
                  <ArrowUp className="h-4 w-4" /> Withdraw
                </Button>
              </CardFooter>
            </Card>

            {/* Pending Transactions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTransactions.length > 0 ? (
                    pendingTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-muted rounded-full">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <div className="font-medium">{getTransactionDescription(transaction.type)}</div>
                            <div className="text-xs text-muted-foreground">
                              {/* I added these lines */}
                              {transaction.timestamp && isValid(new Date(transaction.timestamp))
                                ? format(new Date(transaction.timestamp), 'MMM d, h:mm a')
                                : 'N/A'}                            </div>
                          </div>
                        </div>
                        <div className={transaction.type === TransactionType.DEPOSIT || transaction.type === TransactionType.GAME_WIN
                          ? 'text-green-500'
                          : 'text-red-500'
                        }>
                          ${transaction.amount.toFixed(2)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p>No pending transactions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Deposit/Withdraw/History */}
          <div className="md:col-span-2">
            <Tabs defaultValue="deposit" className="space-y-4">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger id="deposit-tab" value="deposit">Deposit</TabsTrigger>
                <TabsTrigger id="withdraw-tab" value="withdraw">Withdraw</TabsTrigger>
                <TabsTrigger id="history-tab" value="history">History</TabsTrigger>
              </TabsList>

              {/* Deposit Tab */}
              <TabsContent value="deposit">
                <Card>
                  <CardHeader>
                    <CardTitle>Deposit Funds</CardTitle>
                    <CardDescription>
                      Add money to your wallet
                      <span className="ml-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">LIVE</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Amount Input */}
                    {/* Amount Input */}
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                          id="deposit-amount"
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-7"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>
                      {depositAmount && parseFloat(depositAmount) < 10 && (
                        <p className="text-sm text-red-500">Minimum deposit is $10.00</p>
                      )}
                    </div>


                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <Select
                        value={depositMethod}
                        onValueChange={setDepositMethod}
                      >
                        <SelectTrigger id="payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paypal">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-[#003087]" />
                              PayPal <span className="text-xs text-emerald-600">(LIVE)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="stripe">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-5 w-5 text-[#635BFF]" />
                              Credit/Debit Card (Stripe)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* PayPal Buttons Container */}
                    {depositMethod === "paypal" && parseFloat(depositAmount) >= 10 && (
                      <div
                        ref={paypalButtonsContainerRef}
                        className="mt-4 min-h-[150px] flex items-center justify-center border border-gray-200 rounded-md p-4"
                      >
                        {paypalButtonsLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="ml-2 text-sm text-muted-foreground">Loading PayPal checkout...</p>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {depositMethod === "paypal" && parseFloat(depositAmount) < 10 && (
                      <div className="mt-4 text-sm text-muted-foreground text-center p-4 border border-gray-200 rounded-md">
                        Enter an amount of $10 or more to use PayPal.
                      </div>
                    )}


                    {/* Stripe Checkout Button */}
                    {depositMethod === "stripe" && (
                      <div className="mt-6">
                        <Button
                          onClick={handleStripeDeposit}
                          className="w-full"
                          disabled={isLoading || processingDeposit || !depositAmount || parseFloat(depositAmount) <= 0}
                        >
                          {processingDeposit ? 'Processing...' : 'Deposit Funds'}
                        </Button>
                      </div>
                    )}

                    {/* Info Text */}
                    <div className="text-sm text-muted-foreground mt-2">
                      <p>Minimum deposit: $10.00</p>
                      <p>Funds will be available immediately after payment is processed.</p>
                      {depositMethod === "paypal" && (
                        <p className="mt-2 text-blue-500">
                          Pay securely with PayPal - no account required.
                          <span className="font-medium text-emerald-600"> (Using LIVE PayPal)</span>
                        </p>
                      )}
                    </div>

                  </CardContent>
                </Card>
              </TabsContent>

              {/* Withdraw Tab */}
              <TabsContent value="withdraw">
                <WithdrawMethods />
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <TransactionHistory />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Wallet;