import type { GoldUnits, Transaction } from './types';

export type WalletState = {
  balance: GoldUnits;
  transactions: Transaction[]; // 최신순
};

// 내역을 만들 때 넘기는 값 (id, type, createdAt은 reducer가 채운다)
export type TransactionInput = Pick<Transaction, 'amount' | 'title' | 'source' | 'key'>;

export type WalletAction =
  | { type: 'earn'; input: TransactionInput }
  | { type: 'spend'; input: TransactionInput };

export const initialWalletState: WalletState = {
  balance: 0,
  transactions: [],
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function walletReducer(state: WalletState, action: WalletAction): WalletState {
  const { input } = action;

  if (input.amount <= 0) return state;
  // 같은 key로 이미 처리한 내역이 있으면 무시한다 (같은 보상 재수령 방지)
  if (state.transactions.some((tx) => tx.key === input.key)) return state;
  // 잔액이 부족하면 차감하지 않는다 (화면에서 미리 canAfford로 막는다)
  if (action.type === 'spend' && input.amount > state.balance) return state;

  const tx: Transaction = {
    id: createId(),
    type: action.type,
    ...input,
    createdAt: new Date().toISOString(),
  };

  return {
    balance: action.type === 'earn' ? state.balance + input.amount : state.balance - input.amount,
    transactions: [tx, ...state.transactions],
  };
}
