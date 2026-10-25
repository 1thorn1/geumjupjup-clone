import type { EarnSource, GoldUnits, Transaction } from './types';

export type WalletState = {
  balance: GoldUnits;
  transactions: Transaction[]; // 최신순
};

export type WalletAction =
  | { type: 'earn'; source: EarnSource; amount: GoldUnits }
  | { type: 'purchase'; productId: string; productName: string; amount: GoldUnits };

export const initialWalletState: WalletState = {
  balance: 0,
  transactions: [],
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'earn': {
      if (action.amount <= 0) return state;
      const tx: Transaction = {
        id: createId(),
        type: 'earn',
        source: action.source,
        amount: action.amount,
        createdAt: Date.now(),
      };
      return {
        balance: state.balance + action.amount,
        transactions: [tx, ...state.transactions],
      };
    }
    case 'purchase': {
      // 잔액이 부족하면 상태를 바꾸지 않는다 (화면에서 미리 canAfford로 막는다)
      if (action.amount <= 0 || action.amount > state.balance) return state;
      const tx: Transaction = {
        id: createId(),
        type: 'purchase',
        productId: action.productId,
        productName: action.productName,
        amount: action.amount,
        createdAt: Date.now(),
      };
      return {
        balance: state.balance - action.amount,
        transactions: [tx, ...state.transactions],
      };
    }
  }
}
