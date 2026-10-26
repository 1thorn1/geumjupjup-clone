import { createContext, use, useMemo, useReducer, type ReactNode } from 'react';

import { initialWalletState, walletReducer, type TransactionInput, type WalletState } from './store';
import type { GoldUnits } from './types';

type WalletContextValue = WalletState & {
  earn: (input: TransactionInput) => void;
  spend: (input: TransactionInput) => void;
  hasKey: (key: string) => boolean;
  canAfford: (amount: GoldUnits) => boolean;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialWalletState);

  const value = useMemo<WalletContextValue>(
    () => ({
      ...state,
      earn: (input) => dispatch({ type: 'earn', input }),
      spend: (input) => dispatch({ type: 'spend', input }),
      hasKey: (key) => state.transactions.some((tx) => tx.key === key),
      canAfford: (amount) => amount <= state.balance,
    }),
    [state],
  );

  return <WalletContext value={value}>{children}</WalletContext>;
}

export function useWallet(): WalletContextValue {
  const ctx = use(WalletContext);
  if (!ctx) throw new Error('useWallet은 WalletProvider 안에서만 쓸 수 있어요');
  return ctx;
}
