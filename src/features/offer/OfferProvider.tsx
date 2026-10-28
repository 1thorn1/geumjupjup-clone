import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { getOffer, stepKey, stepReward } from '@/data/offers';
import { useMiningContext } from '@/features/mining/MiningProvider';

const STORAGE_KEY = 'offer:state';
// 단계를 완료한 뒤 보상이 지급되기까지 걸리는 시간 (실제로는 광고주 서버 확인 시간)
export const PAYOUT_DELAY_MS = 3000;

type OfferState = {
  joined: Record<string, string>;  // 미션 id → 참여한 시각 (ISO)
  pending: Record<string, number>; // 단계 key → 지급될 시각 (밀리초). 있으면 "지급 대기"
};

export type StepStatus = 'available' | 'pending' | 'paid';

// 방금 지급된 보상 (상세 화면이 팝업을 띄우는 데 씀)
export type Payout = { key: string; title: string; percent: number; at: number };

type OfferContextValue = {
  isJoined: (offerId: string) => boolean;
  joinedAt: (offerId: string) => string | null;
  stepStatus: (offerId: string, stepId: string) => StepStatus;
  join: (offerId: string) => void;
  completeStep: (offerId: string, stepId: string) => void;
  lastPayout: Payout | null;
};

const OfferContext = createContext<OfferContextValue | null>(null);

// 오퍼월 진행 상태(참여 중 / 지급 대기)를 앱 전체에서 공유하고 기기에 저장한다
// "지급 완료"는 따로 저장하지 않고, 채굴 보상 내역에 단계 key가 있는지로 계산한다
export function OfferProvider({ children }: { children: ReactNode }) {
  const { hasBoostKey, addBoost } = useMiningContext();
  const [state, setState] = useState<OfferState | null>(null);
  const [lastPayout, setLastPayout] = useState<Payout | null>(null);
  // 이미 지급 처리한 단계 key (상태가 반영되기 전 다음 확인에서 두 번 지급하지 않도록)
  const paidRef = useRef(new Set<string>());

  useEffect(() => {
    async function load() {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      try {
        setState(saved ? JSON.parse(saved) : { joined: {}, pending: {} });
      } catch {
        setState({ joined: {}, pending: {} });
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (state === null) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // 지급 대기 중인 단계가 있으면 0.5초마다 확인해서, 지급 시각이 지난 것을 지급한다
  // 지급 시각을 저장해 두므로 앱을 껐다 켜도 시각이 지났으면 바로 지급된다
  useEffect(() => {
    if (state === null || Object.keys(state.pending).length === 0) return;
    const id = setInterval(() => {
      const now = Date.now();
      const due = Object.entries(state.pending).filter(([, payAt]) => payAt <= now);
      if (due.length === 0) return;

      for (const [key] of due) {
        if (paidRef.current.has(key)) continue;
        paidRef.current.add(key);
        const [, offerId, stepId] = key.split(':');
        const offer = getOffer(offerId);
        const step = offer?.steps.find((s) => s.id === stepId);
        if (!offer || !step) continue;
        const percent = stepReward(offer, step);
        addBoost({ title: `${offer.title} 미션`, percent, key, expiresAt: null });
        setLastPayout({ key, title: offer.title, percent, at: now });
      }
      setState((s) => {
        if (s === null) return s;
        const pending = { ...s.pending };
        for (const [key] of due) delete pending[key];
        return { ...s, pending };
      });
    }, 500);
    return () => clearInterval(id);
  }, [state, addBoost]);

  const value = useMemo<OfferContextValue>(
    () => ({
      isJoined: (offerId) => Boolean(state?.joined[offerId]),
      joinedAt: (offerId) => state?.joined[offerId] ?? null,
      stepStatus: (offerId, stepId) => {
        const key = stepKey(offerId, stepId);
        if (hasBoostKey(key)) return 'paid';
        if (state?.pending[key] !== undefined) return 'pending';
        return 'available';
      },
      join: (offerId) =>
        setState((s) =>
          s === null || s.joined[offerId]
            ? s
            : { ...s, joined: { ...s.joined, [offerId]: new Date().toISOString() } },
        ),
      // 이미 지급됐거나 지급 대기 중인 단계는 무시 (연타·중복 방지)
      completeStep: (offerId, stepId) => {
        const key = stepKey(offerId, stepId);
        if (hasBoostKey(key)) return;
        setState((s) =>
          s === null || s.pending[key] !== undefined
            ? s
            : { ...s, pending: { ...s.pending, [key]: Date.now() + PAYOUT_DELAY_MS } },
        );
      },
      lastPayout,
    }),
    [state, hasBoostKey, lastPayout],
  );

  return <OfferContext value={value}>{children}</OfferContext>;
}

export function useOffer(): OfferContextValue {
  const ctx = use(OfferContext);
  if (!ctx) throw new Error('useOffer는 OfferProvider 안에서만 쓸 수 있어요');
  return ctx;
}
