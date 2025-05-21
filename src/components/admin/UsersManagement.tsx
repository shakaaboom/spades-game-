
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, MoreHorizontal, Loader2, Plus, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  name: string;
  email: string;
  status: "online" | "offline";
  balance: number;
  games: number;
  avatar: string;
}

export const UsersManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  
  // State for balance modification dialog
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(50);
          
        if (error) throw error;
        
        // Transform profile data into the format expected by the component
        const transformedUsers = data.map(profile => ({
          id: profile.id,
          name: profile.username || 'Anonymous User',
          email: profile.username, // Using username as email since we don't have direct email access
          status: Math.random() > 0.5 ? "online" : "offline" as "online" | "offline", // Explicitly type as "online" | "offline"
          balance: profile.balance || 0,
          games: profile.games_played || 0,
          avatar: profile.avatar_url
        }));
        
        setUsers(transformedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error fetching users",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [toast]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAction = (action, userId, userName) => {
    toast({
      title: `${action} action triggered`,
      description: `${action} for user ${userName} (${userId})`,
    });
  };

  const handleModifyBalance = async () => {
    if (!selectedUser) return;
    
    try {
      setIsProcessing(true);
      
      // Calculate new balance
      const currentBalance = selectedUser.balance || 0;
      const changeAmount = operation === "add" ? balanceAmount : -balanceAmount;
      const newBalance = currentBalance + changeAmount;
      
      // Update balance in database
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, balance: newBalance } 
            : user
        )
      );
      
      toast({
        title: "Balance updated",
        description: `${selectedUser.name}'s balance has been ${operation === "add" ? "increased" : "decreased"} by $${balanceAmount}`,
      });
      
      // Close dialog and reset state
      setIsBalanceDialogOpen(false);
      setBalanceAmount(0);
      setSelectedUser(null);
      
    } catch (error) {
      console.error("Error updating balance:", error);
      toast({
        title: "Error updating balance",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openBalanceDialog = (user: User, op: "add" | "subtract") => {
    setSelectedUser(user);
    setOperation(op);
    setBalanceAmount(0);
    setIsBalanceDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              className="p-2 rounded border border-input bg-background"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="online">Online Only</option>
              <option value="offline">Offline Only</option>
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
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Balance</th>
                  <th className="text-left py-3 px-4">Games</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.status === "online" ? "default" : "secondary"}>
                          {user.status === "online" ? "Online" : "Offline"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          ${parseFloat(user.balance.toString()).toFixed(2)}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full bg-green-100 hover:bg-green-200"
                            onClick={() => openBalanceDialog(user, "add")}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full bg-red-100 hover:bg-red-200"
                            onClick={() => openBalanceDialog(user, "subtract")}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.games}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction("View", user.id, user.name)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction("Message", user.id, user.name)}>
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction("Suspend", user.id, user.name)}>
                              Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-3 px-4 text-center">
                      No users found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Balance Modification Dialog */}
        <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {operation === "add" ? "Add to" : "Subtract from"} Balance
              </DialogTitle>
              <DialogDescription>
                {operation === "add" 
                  ? "Add funds to the user's balance" 
                  : "Subtract funds from the user's balance"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">User</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedUser?.avatar} alt={selectedUser?.name} />
                    <AvatarFallback>
                      {selectedUser?.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{selectedUser?.name}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Balance</p>
                <p>${selectedUser?.balance.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Amount to {operation === "add" ? "Add" : "Subtract"}</p>
                <Input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={balanceAmount} 
                  onChange={(e) => setBalanceAmount(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">New Balance</p>
                <p className="font-bold">
                  ${((selectedUser?.balance || 0) + (operation === "add" ? balanceAmount : -balanceAmount)).toFixed(2)}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBalanceDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleModifyBalance} 
                disabled={isProcessing || balanceAmount <= 0 || (operation === "subtract" && balanceAmount > (selectedUser?.balance || 0))}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  operation === "add" ? "Add Funds" : "Subtract Funds"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
