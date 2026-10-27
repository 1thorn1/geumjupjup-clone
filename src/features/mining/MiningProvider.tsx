import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { GoldUnits } from '@/features/wallet/types';

import { addBoost, getMinedAmount, type Boost, type BoostInput } from './mining';

const STORAGE_KEY = 'mining:state';
const LEGACY_STARTED_AT_KEY = 'mining:startedAt'; // 예전 버전에서 시작 시각만 저장하던 키

type MiningState = {
  startedAt: number;  // 이번 채굴을 시작한 시각 (밀리초)
  boosts: Boost[];    // 받은 속도 보상 내역 (최신순)
};

type MiningContextValue = {
  state: MiningState | null; // 불러오기 전에는 null
  restart: () => void;
  // 지금까지 쌓인 채굴량을 꺼내고 0부터 다시 시작. 꺼낼 게 없으면 null
  // key는 이번 채굴의 시작 시각으로 만들어, 같은 채굴분을 두 번 적립하지 못하게 한다
  collect: () => { amount: GoldUnits; key: string } | null;
  addBoost: (input: BoostInput) => void;
  hasBoostKey: (key: string) => boolean;
};

const MiningContext = createContext<MiningContextValue | null>(null);

// 채굴 상태(시작 시각, 속도 보상)를 앱 전체에서 공유하고 기기에 저장한다
export function MiningProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MiningState | null>(null);

  // 앱이 켜지면 저장된 채굴 상태를 불러옴. 없으면 지금부터 채굴 시작
  useEffect(() => {
    async function load() {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        try {
          setState(JSON.parse(saved));
          return;
        } catch {
          // 깨진 값이면 아래에서 새로 시작
        }
      }
      const legacy = await AsyncStorage.getItem(LEGACY_STARTED_AT_KEY);
      setState({ startedAt: legacy !== null ? Number(legacy) : Date.now(), boosts: [] });
    }
    load();
  }, []);

  // 불러온 뒤부터 바뀔 때마다 저장
  useEffect(() => {
    if (state === null) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<MiningContextValue>(
    () => ({
      state,
      // 채굴량을 0으로 되돌리고 다시 시작 (속도 보상은 그대로)
      restart: () => setState((s) => (s === null ? s : { ...s, startedAt: Date.now() })),
      collect: () => {
        if (state === null) return null;
        const now = Date.now();
        const amount = getMinedAmount(state.startedAt, now, state.boosts);
        if (amount <= 0) return null;
        setState((s) => (s === null ? s : { ...s, startedAt: now }));
        return { amount, key: `mining:${state.startedAt}` };
      },
      addBoost: (input) =>
        setState((s) => (s === null ? s : { ...s, boosts: addBoost(s.boosts, input, Date.now()) })),
      hasBoostKey: (key) => state?.boosts.some((b) => b.key === key) ?? false,
    }),
    [state],
  );

  return <MiningContext value={value}>{children}</MiningContext>;
}

export function useMiningContext(): MiningContextValue {
  const ctx = use(MiningContext);
  if (!ctx) throw new Error('useMiningContext는 MiningProvider 안에서만 쓸 수 있어요');
  return ctx;
}
