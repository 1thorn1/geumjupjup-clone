import { createContext, use, useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';

import { errorMessage } from '@/api/client';
import * as api from '@/api/wallet';

import {
  getBalance,
  initialWalletState,
  walletReducer,
  type TransactionInput,
  type WalletState,
} from './store';
import type { GoldUnits, Transaction } from './types';

type WalletContextValue = WalletState & {
  balance: GoldUnits; // 내역에서 계산한 잔액
  isLoaded: boolean;
  error: string | null; // 서버에서 내역을 못 불러왔을 때 안내 문장
  refresh: () => Promise<void>;
  // 아래 세 함수는 낙관적 업데이트: 화면에 먼저 반영하고, 서버가 실패하면 되돌린 뒤 에러를 던진다
  earn: (input: TransactionInput) => Promise<void>;
  exchange: (input: TransactionInput & { productId: string }) => Promise<void>;
  devClear: (key: string) => Promise<void>;
  hasKey: (key: string) => boolean;
  canAfford: (amount: GoldUnits) => boolean;
  reset: () => Promise<void>; // 개발자 모드: 처음 설치한 상태(샘플 내역)로 되돌림
};

const WalletContext = createContext<WalletContextValue | null>(null);

// 지갑 = 서버의 금 내역(gold_transactions)을 화면에 보여 주는 곳
// 진짜 기록은 서버에 있고, 여기 state는 화면용 사본이다
export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialWalletState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 서버 응답을 화면 상태에 반영
  const applyLoaded = useCallback((transactions: Transaction[]) => {
    dispatch({ type: 'load', state: { transactions } });
    setError(null);
    setIsLoaded(true);
  }, []);
  const applyFailed = useCallback((e: unknown) => {
    setError(errorMessage(e));
    setIsLoaded(true);
  }, []);

  // 서버에서 내 금 내역을 다시 받아 옴 (앱 시작, 오퍼 보상 지급 후 등)
  const refresh = useCallback(
    () => api.listGoldTransactions().then(applyLoaded, applyFailed),
    [applyLoaded, applyFailed],
  );

  useEffect(() => {
    api.listGoldTransactions().then(applyLoaded, applyFailed);
  }, [applyLoaded, applyFailed]);

  const value = useMemo<WalletContextValue>(() => {
    const balance = getBalance(state.transactions);

    // ① 화면에 먼저 반영 → ② 서버 요청 → ③ 성공이면 서버 내역으로 교체, 실패면 되돌림
    const optimistic = async (type: 'earn' | 'spend', input: TransactionInput, request: () => Promise<Transaction>) => {
      dispatch({ type, input });
      try {
        dispatch({ type: 'confirm', tx: await request() });
      } catch (e) {
        dispatch({ type: 'rollback', key: input.key });
        throw e;
      }
    };

    return {
      ...state,
      balance,
      isLoaded,
      error,
      refresh,
      earn: (input) => optimistic('earn', input, () => api.earnGold(input)),
      exchange: ({ productId, ...input }) =>
        optimistic('spend', input, () => api.exchangeProduct(productId, input.key)),
      devClear: (key) =>
        optimistic('spend', { amount: balance, title: '개발자 모드 차감', source: 'dev', key }, () =>
          api.devSpendGold(balance, key),
        ),
      hasKey: (key) => state.transactions.some((tx) => tx.key === key),
      canAfford: (amount) => amount <= balance,
      reset: async () => {
        await api.devReset();
        await refresh();
      },
    };
  }, [state, isLoaded, error, refresh]);

  return <WalletContext value={value}>{children}</WalletContext>;
}

export function useWallet(): WalletContextValue {
  const ctx = use(WalletContext);
  if (!ctx) throw new Error('useWallet은 WalletProvider 안에서만 쓸 수 있어요');
  return ctx;
}
