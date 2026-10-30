import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { errorMessage } from '@/api/client';
import * as api from '@/api/offers';
import { useMiningContext } from '@/features/mining/MiningProvider';
import { useWallet } from '@/features/wallet/WalletProvider';

import type { Offer, Participation, Payout, StepReward } from './offer';

// 지급 대기 중인 보상이 있을 때 서버에 "지급할 것 있나요?"를 묻는 간격
const SETTLE_INTERVAL_MS = 1000;

// 내 기록: 참여 목록과 단계 보상 목록을 함께 받아 옴
function fetchMine(): Promise<[Participation[], StepReward[]]> {
  return Promise.all([api.listMyParticipations(), api.listMyStepRewards()]);
}

// 단계 상태: 참여 가능 / 지급 대기 / 지급 완료
export type StepStatus = 'available' | 'pending' | 'paid';
// 오퍼 상태 (목록 화면 배지): 참여 전 / 참여 중 / 완료 / 기한 만료
export type OfferStatus = 'notJoined' | 'joined' | 'completed' | 'expired';

type OfferContextValue = {
  offers: Offer[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getOffer: (offerId: string) => Offer | undefined;
  participationOf: (offerId: string) => Participation | undefined;
  offerStatus: (offerId: string) => OfferStatus;
  stepStatus: (stepId: number) => StepStatus;
  join: (offerId: string) => Promise<void>;
  completeStep: (stepId: number) => Promise<void>;
  lastPayout: (Payout & { at: number }) | null;
};

const OfferContext = createContext<OfferContextValue | null>(null);

// 오퍼월: 서버의 오퍼 목록, 내 참여, 내 단계 보상을 화면에 공유한다
// 지급은 서버가 한다. 앱은 지급 대기 중일 때 1초마다 정산을 요청하고, 지급되면 지갑·속도를 다시 받아 온다
export function OfferProvider({ children }: { children: ReactNode }) {
  const { refresh: refreshWallet } = useWallet();
  const { refreshBoosts } = useMiningContext();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [rewards, setRewards] = useState<StepReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPayout, setLastPayout] = useState<(Payout & { at: number }) | null>(null);

  // 서버 응답을 화면 상태에 반영
  const applyMine = useCallback(([p, r]: [Participation[], StepReward[]]) => {
    setParticipations(p);
    setRewards(r);
  }, []);
  const applyAll = useCallback(
    ([o, mine]: [Offer[], [Participation[], StepReward[]]]) => {
      setOffers(o);
      applyMine(mine);
      setError(null);
      setIsLoading(false);
    },
    [applyMine],
  );
  const applyFailed = useCallback((e: unknown) => {
    setError(errorMessage(e));
    setIsLoading(false);
  }, []);

  // 내 기록(참여, 단계 보상)만 다시 받아 옴
  const refreshMine = useCallback(() => fetchMine().then(applyMine), [applyMine]);

  // 오퍼 목록 + 내 기록을 함께 다시 받아 옴 (목록 화면 당겨서 새로고침)
  const refresh = useCallback(() => {
    setIsLoading(true);
    return Promise.all([api.listOffers(), fetchMine()]).then(applyAll, applyFailed);
  }, [applyAll, applyFailed]);

  useEffect(() => {
    Promise.all([api.listOffers(), fetchMine()]).then(applyAll, applyFailed);
  }, [applyAll, applyFailed]);

  // 지급 대기 중인 보상이 있으면 1초마다 서버에 정산을 요청한다
  // 앱을 껐다 켜도 서버에 지급 예정 시각이 남아 있어서, 다음 정산 때 바로 지급된다
  const hasPending = rewards.some((r) => r.status === 'pending');
  useEffect(() => {
    if (!hasPending) return;
    const id = setInterval(async () => {
      try {
        const paid = await api.settleRewards();
        if (paid.length === 0) return;
        await Promise.all([refreshMine(), refreshWallet(), refreshBoosts()]);
        setLastPayout({ ...paid[paid.length - 1], at: Date.now() });
      } catch {
        // 네트워크가 잠깐 끊겨도 다음 간격에 다시 시도한다
      }
    }, SETTLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasPending, refreshMine, refreshWallet, refreshBoosts]);

  const value = useMemo<OfferContextValue>(() => {
    const participationOf = (offerId: string) => participations.find((p) => p.offerId === offerId);
    return {
      offers,
      isLoading,
      error,
      refresh,
      getOffer: (offerId) => offers.find((o) => o.id === offerId),
      participationOf,
      offerStatus: (offerId) => {
        const p = participationOf(offerId);
        if (!p) return 'notJoined';
        if (p.status === 'completed') return 'completed';
        if (Date.parse(p.expiresAt) < Date.now()) return 'expired';
        return 'joined';
      },
      stepStatus: (stepId) => rewards.find((r) => r.stepId === stepId)?.status ?? 'available',
      join: async (offerId) => {
        const p = await api.joinOffer(offerId);
        setParticipations((list) => [...list.filter((x) => x.offerId !== offerId), p]);
      },
      completeStep: async (stepId) => {
        const r = await api.completeStep(stepId);
        setRewards((list) => [...list.filter((x) => x.stepId !== stepId), r]);
      },
      lastPayout,
    };
  }, [offers, participations, rewards, isLoading, error, refresh, lastPayout]);

  return <OfferContext value={value}>{children}</OfferContext>;
}

export function useOffer(): OfferContextValue {
  const ctx = use(OfferContext);
  if (!ctx) throw new Error('useOffer는 OfferProvider 안에서만 쓸 수 있어요');
  return ctx;
}
