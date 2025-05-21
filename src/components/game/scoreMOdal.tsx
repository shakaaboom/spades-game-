import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { DollarSign } from "lucide-react";
  
  export const ScoreDialog = ({
    isOpen,
    onClose,
    round_number,
    players,
    playerProfiles,
    wager,
  }: {
    isOpen: boolean;
    onClose: () => void;
    round_number: number;
    players: SoloPlayer[];
    playerProfiles: Record<string, { username: string }>;
    wager: number;
  }) => {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-white">
             Round {round_number} Compeleted
            </DialogTitle>
          </DialogHeader>
  
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                 Scores
              </h3>
              <div className="space-y-2">
                {players
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((player) => (
                    <div
                      key={player.id}
                      className={`flex justify-between items-center p-2 rounded "bg-gray-700/50"
                      }`}
                    >
                      <span className="font-medium text-white">
                        {playerProfiles[player.user_id]?.username ||
                          `Player ${player.position}`}
                      </span>
                      <span
                        className="font-bold text-white"
                      >
                        {player.score || 0} points
                      </span>
                    </div>
                  ))}
              </div>
            </div>
  
        {/*     {winner && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Prize Won
                </h3>
                <div className="flex items-center justify-center space-x-2">
                  <DollarSign className="text-yellow-400" />
                  <span className="text-xl font-bold text-yellow-400">
                    {wager * 4} coins
                  </span>
                </div>
              </div>
            )} */}
  
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };