import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";

interface BidSetModalProps {
  showBidDialog: boolean;
  bidTimeRemaining: number | null;
  setShowBidDialog: (show: boolean) => void;
  isNilBid: boolean;
  bidAmount: number;
  setBidAmount: (amount: number) => void;
  setIsNilBid: (isNil: boolean) => void;
  handlePlaceBid: () => void;
}


const BidSetModal: React.FC<BidSetModalProps> = ({
    showBidDialog,
    bidTimeRemaining,
    setShowBidDialog,
    isNilBid,
    bidAmount,
    setBidAmount,
    setIsNilBid,
    handlePlaceBid,
}) => {
    return (
        <Dialog
            open={showBidDialog}
            onOpenChange={(open) => {
                if (!open && bidTimeRemaining === null) {
                    setShowBidDialog(false);
                }
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Place Your Bid</span>
                        <Badge
                            variant={
                                bidTimeRemaining && bidTimeRemaining < 6
                                    ? "destructive"
                                    : "outline"
                            }
                            className="ml-2"
                        >
                            <Timer className="h-3 w-3 mr-1" />
                            {bidTimeRemaining !== null
                                ? `${bidTimeRemaining}s`
                                : "Time's up!"}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Choose how many tricks you think you'll win in this round.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <h4 className="font-medium">How many tricks will you win?</h4>

                        <div className="flex items-center space-x-4">
                            <div className="flex-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="13"
                                    value={isNilBid ? 0 : bidAmount}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        console.log("Bid amount changed:", value); // Debugging line
                                        setBidAmount(value);
                                        setIsNilBid(value === 0);
                                    }}
                                    disabled={isNilBid}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>0</span>
                                    <span>13</span>
                                </div>
                            </div>

                            <div className="w-16 text-center font-bold text-2xl">
                                {isNilBid ? "Nil" : bidAmount}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 mt-4">
                            <input
                                type="checkbox"
                                id="nil-bid"
                                checked={isNilBid}
                                onChange={(e) => {
                                    setIsNilBid(e.target.checked);
                                    if (e.target.checked) {
                                        setBidAmount(0);
                                    }
                                }}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="nil-bid" className="text-sm font-medium">
                                Bid Nil (+50/-50 points)
                            </label>
                        </div>
                    </div>

                    <div className="bg-muted p-3 rounded-md text-sm">
                        <p className="font-medium mb-1">Bidding Rules:</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                            <li>• You must take at least the number of tricks you bid</li>
                            <li>• You get 10 points per trick bid and made</li>
                            <li>• Extra tricks are worth 1 point each (sandbags)</li>
                            <li>• If you fail to make your bid, you lose 10 points per trick bid</li>
                            <li>• Nil bid: You aim to take zero tricks (+50 if successful, -50 if not)</li>
                        </ul>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={() => {
                                handlePlaceBid();
                                setShowBidDialog(false);
                            }}
                        >
                            Place Bid
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BidSetModal;