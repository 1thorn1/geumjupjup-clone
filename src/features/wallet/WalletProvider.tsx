import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';

import { initialTransactions } from '@/data/initialTransactions';

import {
  getBalance,
  initialWalletState,
  walletReducer,
  type TransactionInput,
  type WalletState,
} from './store';
import type { GoldUnits } from './types';

const STORAGE_KEY = 'wallet:state';

type WalletContextValue = WalletState & {
  balance: GoldUnits; // 내역에서 계산한 잔액
  isLoaded: boolean;
  earn: (input: TransactionInput) => void;
  spend: (input: TransactionInput) => void;
  hasKey: (key: string) => boolean;
  canAfford: (amount: GoldUnits) => boolean;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialWalletState);
  // 기기에서 불러오기가 끝났는지. 끝나기 전에 저장하면 저장된 데이터를 덮어쓰게 된다
  const [isLoaded, setIsLoaded] = useState(false);

  // 앱이 켜지면 저장된 지갑을 불러옴. 처음 실행이면 샘플 내역(더미 데이터)으로 시작
  useEffect(() => {
    async function load() {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === null) {
        dispatch({ type: 'load', state: { transactions: initialTransactions } });
      } else {
        try {
          dispatch({ type: 'load', state: JSON.parse(saved) });
        } catch {
          // 저장된 값이 깨져 있으면 무시하고 빈 지갑으로 시작
        }
      }
      setIsLoaded(true);
    }
    load();
  }, []);

  // 불러오기가 끝난 뒤부터, 지갑이 바뀔 때마다 저장
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isLoaded]);

  const value = useMemo<WalletContextValue>(() => {
    const balance = getBalance(state.transactions);
    return {
      ...state,
      balance,
      isLoaded,
      earn: (input) => dispatch({ type: 'earn', input }),
      spend: (input) => dispatch({ type: 'spend', input }),
      hasKey: (key) => state.transactions.some((tx) => tx.key === key),
      canAfford: (amount) => amount <= balance,
    };
  }, [state, isLoaded]);

  return <WalletContext value={value}>{children}</WalletContext>;
}

export function useWallet(): WalletContextValue {
  const ctx = use(WalletContext);
  if (!ctx) throw new Error('useWallet은 WalletProvider 안에서만 쓸 수 있어요');
  return ctx;
}
