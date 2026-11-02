// 오퍼(캠페인). 서버 offers + offer_steps 테이블에서 온다
// 보상은 실제 금줍줍처럼 채굴 속도(%)만 준다. 금은 "광고 보고 금 줍기"로만 들어온다
export type CampaignType = 'app_install' | 'signup' | 'game' | 'survey' | 'apply';

export type OfferStep = {
  id: number;
  order: number;
  label: string;              // 예: '앱 설치하기'
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
  rewardBoostPercent: number;
  payAt: string;
};

// 방금 지급된 보상 (지급 완료 팝업용)
export type Payout = {
  rewardId: number;
  offerId: string;
  offerTitle: string;
  rewardBoostPercent: number;
};

export const CAMPAIGN_LABEL: Record<CampaignType, string> = {
  app_install: '앱 설치',
  signup: '회원가입',
  game: '게임',
  survey: '설문',
  apply: '신청',
};

// 배수까지 적용한 단계 보상 (%). 서버가 완료 시점에 같은 식으로 계산해 저장한다
export function stepReward(offer: Offer, step: OfferStep): number {
  return Math.round(step.rewardBoostPercent * offer.multiplier);
}

// 미션 전체를 다 하면 받는 속도 합계 (%)
export function totalReward(offer: Offer): number {
  return offer.steps.reduce((sum, step) => sum + stepReward(offer, step), 0);
}

// 속도 보상 표기. 예: 1515 → '속도 +1,515%'
export function rewardText(percent: number): string {
  return `속도 +${String(percent).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}%`;
}
