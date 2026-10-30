import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as api from '@/api/boosts';
import type { GoldUnits } from '@/features/wallet/types';

import { addBoost, getMinedAmount, type Boost, type BoostInput } from './mining';

const STORAGE_KEY = 'mining:state';

type MiningState = {
  startedAt: number;  // 이번 채굴을 시작한 시각 (밀리초). 기기에 저장
  boosts: Boost[];    // 받은 속도 보상 내역 (최신순). 서버 boosts 테이블
};

type MiningContextValue = {
  state: MiningState | null; // 불러오기 전에는 null
  restart: () => void;
  // 지금까지 쌓인 채굴량을 꺼내고 0부터 다시 시작. 꺼낼 게 없으면 null
  // key는 이번 채굴의 시작 시각으로 만들어, 같은 채굴분을 두 번 적립하지 못하게 한다
  collect: () => { amount: GoldUnits; key: string; startedAt: number } | null;
  // 금 줍기가 서버에서 실패했을 때: 꺼내기 전 시작 시각으로 되돌려 채굴량을 살린다
  undoCollect: (startedAt: number) => void;
  // 속도 보상 받기 (낙관적 업데이트: 먼저 반영, 서버 실패 시 되돌림)
  addBoost: (input: BoostInput) => Promise<void>;
  hasBoostKey: (key: string) => boolean;
  refreshBoosts: () => Promise<void>; // 오퍼 보상처럼 서버에서 생긴 보상을 다시 받아 옴
  // 개발자 모드용
  devFill: () => void; // 채굴량을 바로 상한까지 채움 (시작 시각을 아주 예전으로)
  devRemoveBoosts: (keyPrefix: string) => Promise<void>; // key가 이 글자로 시작하는 보상 삭제
  reset: () => void; // 지금부터 채굴 다시 시작 + 보상 목록 비움 (서버 기록은 지갑 reset이 지운다)
};

const MiningContext = createContext<MiningContextValue | null>(null);

// 채굴 상태를 앱 전체에서 공유한다
// - 시작 시각: 기기에 저장 (채굴량은 시작 시각과 속도 보상으로 계산하는 값이라 서버에 둘 필요가 적다)
// - 속도 보상: 서버에 저장 (오퍼 보상이 서버에서 지급되므로 한 곳에 모은다)
export function MiningProvider({ children }: { children: ReactNode }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [boosts, setBoosts] = useState<Boost[] | null>(null);

  // 시작 시각 불러오기. 없으면 지금부터 채굴 시작
  useEffect(() => {
    async function load() {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      try {
        const parsed = saved ? (JSON.parse(saved) as { startedAt?: number }) : null;
        setStartedAt(typeof parsed?.startedAt === 'number' ? parsed.startedAt : Date.now());
      } catch {
        setStartedAt(Date.now());
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (startedAt === null) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ startedAt }));
  }, [startedAt]);

  // 서버에 못 닿아도 채굴은 기본 속도로 계속한다
  const keepBoosts = useCallback(() => setBoosts((b) => b ?? []), []);
  const refreshBoosts = useCallback(() => api.listBoosts().then(setBoosts, keepBoosts), [keepBoosts]);

  useEffect(() => {
    api.listBoosts().then(setBoosts, keepBoosts);
  }, [keepBoosts]);

  const state = useMemo<MiningState | null>(
    () => (startedAt === null || boosts === null ? null : { startedAt, boosts }),
    [startedAt, boosts],
  );

  const value = useMemo<MiningContextValue>(
    () => ({
      state,
      // 채굴량을 0으로 되돌리고 다시 시작 (속도 보상은 그대로)
      restart: () => setStartedAt(Date.now()),
      collect: () => {
        if (state === null) return null;
        const now = Date.now();
        const amount = getMinedAmount(state.startedAt, now, state.boosts);
        if (amount <= 0) return null;
        setStartedAt(now);
        return { amount, key: `mining:${state.startedAt}`, startedAt: state.startedAt };
      },
      undoCollect: (prev) => setStartedAt(prev),
      addBoost: async (input) => {
        setBoosts((b) => addBoost(b ?? [], input, Date.now()));
        try {
          const saved = await api.addBoost(input);
          setBoosts((b) => (b ?? []).map((x) => (x.key === saved.key ? saved : x)));
        } catch (e) {
          setBoosts((b) => (b ?? []).filter((x) => x.key !== input.key));
          throw e;
        }
      },
      hasBoostKey: (key) => boosts?.some((b) => b.key === key) ?? false,
      refreshBoosts,
      devFill: () => setStartedAt(0),
      devRemoveBoosts: async (keyPrefix) => {
        await api.devDeleteBoosts(keyPrefix);
        await refreshBoosts();
      },
      reset: () => {
        setStartedAt(Date.now());
        setBoosts([]);
      },
    }),
    [state, boosts, refreshBoosts],
  );

  return <MiningContext value={value}>{children}</MiningContext>;
}

export function useMiningContext(): MiningContextValue {
  const ctx = use(MiningContext);
  if (!ctx) throw new Error('useMiningContext는 MiningProvider 안에서만 쓸 수 있어요');
  return ctx;
}
