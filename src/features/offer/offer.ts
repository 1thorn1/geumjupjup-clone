import type { GoldUnits } from '@/features/wallet/types';

// 오퍼(캠페인). 서버 offers + offer_steps 테이블에서 온다
export type CampaignType = 'app_install' | 'signup' | 'game' | 'survey' | 'apply';

export type OfferStep = {
  id: number;
  order: number;
  label: string;              // 예: '앱 설치하기'
  rewardGold: GoldUnits;      // 기본 금 보상
  rewardBoostPercent: number; // 기본 속도 보상 (%)
};

export type Offer = {
  id: string;           // 예: 'nyang-escape'
  tileId: string | null; // 홈 미션 타일. 예: 'bomb'
  category: string;     // 예: '폭발 미션'
  title: string;        // 예: '냥탈출'
  campaignType: CampaignType;
  emoji: string;
  color: string;
  deadlineDays: number;
  multiplier: number;
  isFeatured: boolean;
  steps: OfferStep[];   // step_order 순
};

// 내 참여 (offer_participations)
export type Participation = {
  id: number;
  offerId: string;
  status: 'joined' | 'completed';
  joinedAt: string;
  expiresAt: string;
};

// 내 단계 보상 (offer_step_rewards): pending(지급 대기) → paid(지급 완료)
export type StepReward = {
  id: number;
  stepId: number;
  status: 'pending' | 'paid';
  rewardGold: GoldUnits;
  rewardBoostPercent: number;
  payAt: string;
};

// 방금 지급된 보상 (지급 완료 팝업용)
export type Payout = {
  rewardId: number;
  offerId: string;
  offerTitle: string;
  rewardGold: GoldUnits;
  rewardBoostPercent: number;
};

export const CAMPAIGN_LABEL: Record<CampaignType, string> = {
  app_install: '앱 설치',
  signup: '회원가입',
  game: '게임',
  survey: '설문',
  apply: '신청',
};

// 배수까지 적용한 단계 보상 (서버가 완료 시점에 같은 식으로 계산해 저장한다)
export function stepReward(offer: Offer, step: OfferStep): { gold: GoldUnits; percent: number } {
  return {
    gold: Math.round(step.rewardGold * offer.multiplier),
    percent: Math.round(step.rewardBoostPercent * offer.multiplier),
  };
}

// 미션 전체를 다 하면 받는 보상 합계
export function totalReward(offer: Offer): { gold: GoldUnits; percent: number } {
  return offer.steps.reduce(
    (sum, step) => {
      const r = stepReward(offer, step);
      return { gold: sum.gold + r.gold, percent: sum.percent + r.percent };
    },
    { gold: 0, percent: 0 },
  );
}
