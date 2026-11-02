import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as api from '@/api/boosts';
import * as miningApi from '@/api/mining';
import type { GoldUnits } from '@/features/wallet/types';

import { addBoost, getMinedAmount, type Boost, type BoostInput } from './mining';

type MiningState = {
  startedAt: number;  // 이번 채굴을 시작한 시각 (밀리초). 서버 profiles.mining_started_at
  boosts: Boost[];    // 받은 속도 보상 내역 (최신순). 서버 boosts 테이블
};

type MiningContextValue = {
  state: MiningState | null; // 불러오기 전에는 null
  // 금 줍기 직전: 화면에 보여 줄 예상량을 꺼내고 화면의 채굴량을 0으로. 꺼낼 게 없으면 null
  // 진짜 금액은 서버가 계산한다 (wallet.collectMining)
  collect: () => { amount: GoldUnits; key: string; startedAt: number } | null;
  // 서버가 금을 적립한 시각부터 채굴을 다시 시작 (화면과 서버의 시작 시각을 맞춤)
  confirmCollect: (startedAt: number) => void;
  // 금 줍기가 서버에서 실패했을 때: 꺼내기 전 시작 시각으로 되돌려 채굴량을 살린다
  undoCollect: (startedAt: number) => void;
  // 속도 보상 받기 (낙관적 업데이트: 먼저 반영, 서버 실패 시 되돌림)
  addBoost: (input: BoostInput) => Promise<void>;
  hasBoostKey: (key: string) => boolean;
  refreshBoosts: () => Promise<void>; // 오퍼 보상처럼 서버에서 생긴 보상을 다시 받아 옴
  // 개발자 모드용
  devFill: () => Promise<void>; // 채굴량을 바로 상한까지 채움 (서버의 시작 시각을 하루 전으로)
  devRemoveBoosts: (keyPrefix: string) => Promise<void>; // key가 이 글자로 시작하는 보상 삭제
  reset: () => Promise<void>; // 지갑 reset(서버) 뒤에 부름: 서버의 새 시작 시각을 받고 보상 목록 비움
};

const MiningContext = createContext<MiningContextValue | null>(null);

// 채굴 상태를 앱 전체에서 공유한다
// - 시작 시각과 속도 보상 모두 서버에 있다. 금 줍기 금액은 서버가 이 둘로 계산한다
// - 앱은 같은 식(mining.ts)으로 화면에 보여 줄 채굴량만 1초마다 계산한다
export function MiningProvider({ children }: { children: ReactNode }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [boosts, setBoosts] = useState<Boost[] | null>(null);

  // 서버에 못 닿으면 화면은 지금부터 채굴하는 것처럼 보여 준다 (금 줍기는 서버가 실패시킨다)
  const keepStartedAt = useCallback(() => setStartedAt((t) => t ?? Date.now()), []);
  const keepBoosts = useCallback(() => setBoosts((b) => b ?? []), []);
  const refreshBoosts = useCallback(() => api.listBoosts().then(setBoosts, keepBoosts), [keepBoosts]);

  useEffect(() => {
    miningApi.getMiningStartedAt().then(setStartedAt, keepStartedAt);
    api.listBoosts().then(setBoosts, keepBoosts);
  }, [keepStartedAt, keepBoosts]);

  const state = useMemo<MiningState | null>(
    () => (startedAt === null || boosts === null ? null : { startedAt, boosts }),
    [startedAt, boosts],
  );

  const value = useMemo<MiningContextValue>(
    () => ({
      state,
      collect: () => {
        if (state === null) return null;
        const now = Date.now();
        const amount = getMinedAmount(state.startedAt, now, state.boosts);
        if (amount <= 0) return null;
        setStartedAt(now);
        return { amount, key: `mining:${state.startedAt}`, startedAt: state.startedAt };
      },
      confirmCollect: (next) => setStartedAt(next),
      undoCollect: (prev) => {
        setStartedAt(prev);
        // 응답만 못 받고 서버에서는 적립됐을 수도 있으니 서버의 시작 시각으로 다시 맞춘다
        miningApi.getMiningStartedAt().then(setStartedAt, () => {});
      },
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
      devFill: async () => {
        setStartedAt(await miningApi.devFillMining());
      },
      devRemoveBoosts: async (keyPrefix) => {
        await api.devDeleteBoosts(keyPrefix);
        await refreshBoosts();
      },
      reset: async () => {
        setBoosts([]);
        setStartedAt(await miningApi.getMiningStartedAt());
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
