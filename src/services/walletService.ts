
// Transaction types
export enum TransactionType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal',
    GAME_WIN = 'game_win',
    GAME_LOSS = 'game_loss'
  }
  
  // Transaction record structure
  export interface Transaction {
    id: string;
    userId: string;
    amount: number;
    type: TransactionType;
    timestamp: string;
    status: 'pending' | 'completed' | 'failed';
    gameId?: string;
  }
  