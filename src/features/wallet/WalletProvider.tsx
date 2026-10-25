import { createContext, use, useMemo, useReducer, type ReactNode } from 'react';

import { initialWalletState, walletReducer, type WalletState } from './store';
import type { EarnSource, GoldUnits } from './types';

type WalletContextValue = WalletState & {
  earn: (source: EarnSource, amount: GoldUnits) => void;
  purchase: (productId: string, productName: string, amount: GoldUnits) => void;
  canAfford: (amount: GoldUnits) => boolean;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialWalletState);

  const value = useMemo<WalletContextValue>(
    () => ({
      ...state,
      earn: (source, amount) => dispatch({ type: 'earn', source, amount }),
      purchase: (productId, productName, amount) =>
        dispatch({ type: 'purchase', productId, productName, amount }),
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
