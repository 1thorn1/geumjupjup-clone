import type { GoldUnits, Transaction } from './types';

// 잔액은 따로 저장하지 않는다. 항상 내역에서 계산해 "잔액 = 내역의 합"을 보장한다
export type WalletState = {
  transactions: Transaction[]; // 최신순
};

// 내역을 만들 때 넘기는 값 (id, type, createdAt은 reducer가 채운다)
export type TransactionInput = Pick<Transaction, 'amount' | 'title' | 'source' | 'key'>;

export type WalletAction =
  | { type: 'earn'; input: TransactionInput }
  | { type: 'spend'; input: TransactionInput }
  | { type: 'load'; state: WalletState }
  // 서버가 성공했을 때: 화면에 먼저 넣어 둔 내역을 서버가 만든 내역으로 바꾼다
  | { type: 'confirm'; tx: Transaction }
  // 서버가 실패했을 때: 화면에 먼저 넣어 둔 내역을 지운다 (= 잔액이 원래대로)
  | { type: 'rollback'; key: string };

export const initialWalletState: WalletState = {
  transactions: [],
};

// 잔액 = 적립 합 - 차감 합
export function getBalance(transactions: Transaction[]): GoldUnits {
  return transactions.reduce(
    (sum, tx) => (tx.type === 'earn' ? sum + tx.amount : sum - tx.amount),
    0,
  );
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function walletReducer(state: WalletState, action: WalletAction): WalletState {
  // 서버에서 받은 내역으로 통째로 교체
  if (action.type === 'load') return { transactions: action.state.transactions ?? [] };

  if (action.type === 'confirm') {
    const exists = state.transactions.some((tx) => tx.key === action.tx.key);
    return {
      transactions: exists
        ? state.transactions.map((tx) => (tx.key === action.tx.key ? action.tx : tx))
        : [action.tx, ...state.transactions],
    };
  }

  if (action.type === 'rollback') {
    return { transactions: state.transactions.filter((tx) => tx.key !== action.key) };
  }

  const { input } = action;

  if (input.amount <= 0) return state;
  // 같은 key로 이미 처리한 내역이 있으면 무시한다 (같은 보상 재수령 방지)
  if (state.transactions.some((tx) => tx.key === input.key)) return state;
  // 잔액이 부족하면 차감하지 않는다 (화면에서 미리 canAfford로 막는다)
  if (action.type === 'spend' && input.amount > getBalance(state.transactions)) return state;

  const tx: Transaction = {
    id: createId(),
    type: action.type,
    ...input,
    createdAt: new Date().toISOString(),
  };

  return {
    transactions: [tx, ...state.transactions],
  };
}
