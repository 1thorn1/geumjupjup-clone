import type { CampaignType, Offer, Participation, Payout, StepReward } from '@/features/offer/offer';

import { rpc, select } from './client';

// DB 행 모양 (snake_case) → 앱에서 쓰는 모양 (camelCase)
type OfferRow = {
  id: string;
  tile_id: string | null;
  category: string;
  title: string;
  campaign_type: CampaignType;
  emoji: string;
  color: string;
  deadline_days: number;
  multiplier: number;
  is_featured: boolean;
  offer_steps: {
    id: number;
    step_order: number;
    label: string;
    reward_gold: number;
    reward_boost_percent: number;
  }[];
};

type ParticipationRow = {
  id: number;
  offer_id: string;
  status: Participation['status'];
  joined_at: string;
  expires_at: string;
};

type StepRewardRow = {
  id: number;
  step_id: number;
  status: StepReward['status'];
  reward_gold: number;
  reward_boost_percent: number;
  pay_at: string;
};

type PayoutRow = {
  reward_id: number;
  offer_id: string;
  offer_title: string;
  reward_gold: number;
  reward_boost_percent: number;
};

const toParticipation = (r: ParticipationRow): Participation => ({
  id: r.id,
  offerId: r.offer_id,
  status: r.status,
  joinedAt: r.joined_at,
  expiresAt: r.expires_at,
});

const toStepReward = (r: StepRewardRow): StepReward => ({
  id: r.id,
  stepId: r.step_id,
  status: r.status,
  rewardGold: Number(r.reward_gold),
  rewardBoostPercent: r.reward_boost_percent,
  payAt: r.pay_at,
});

// GET /offers: 진행 중인 오퍼 목록 + 단계 (한 번의 요청으로 함께 가져옴)
export async function listOffers(): Promise<Offer[]> {
  const rows = await select<OfferRow[]>((db) =>
    db.from('offers').select('*, offer_steps(*)').eq('status', 'active').order('sort_order'),
  );
  return rows.map((r) => ({
    id: r.id,
    tileId: r.tile_id,
    category: r.category,
    title: r.title,
    campaignType: r.campaign_type,
    emoji: r.emoji,
    color: r.color,
    deadlineDays: r.deadline_days,
    multiplier: Number(r.multiplier),
    isFeatured: r.is_featured,
    steps: r.offer_steps
      .map((s) => ({
        id: s.id,
        order: s.step_order,
        label: s.label,
        rewardGold: Number(s.reward_gold),
        rewardBoostPercent: s.reward_boost_percent,
      }))
      .sort((a, b) => a.order - b.order),
  }));
}

// GET /me/offer-participations: 내가 참여한 오퍼
export async function listMyParticipations(): Promise<Participation[]> {
  const rows = await select<ParticipationRow[]>((db) => db.from('offer_participations').select('*'));
  return rows.map(toParticipation);
}

// GET /me/offer-rewards: 내 단계 보상 (지급 대기 / 지급 완료)
export async function listMyStepRewards(): Promise<StepReward[]> {
  const rows = await select<StepRewardRow[]>((db) => db.from('offer_step_rewards').select('*'));
  return rows.map(toStepReward);
}

// POST /offers/{offerId}/participations: 참여하기 (이미 참여했으면 그 기록을 돌려줌)
export async function joinOffer(offerId: string): Promise<Participation> {
  return toParticipation(await rpc<ParticipationRow>('join_offer', { p_offer_id: offerId }));
}

// POST /offers/{offerId}/steps/{stepId}/completions: 단계 완료 → 지급 대기 (3초 뒤 지급)
export async function completeStep(stepId: number): Promise<StepReward> {
  return toStepReward(await rpc<StepRewardRow>('complete_offer_step', { p_step_id: stepId }));
}

// POST /me/offer-rewards/settlements: 지급 시각이 지난 보상을 지급하고, 방금 지급된 것을 돌려줌
export async function settleRewards(): Promise<Payout[]> {
  const rows = await rpc<PayoutRow[]>('settle_my_offer_rewards');
  return rows.map((r) => ({
    rewardId: r.reward_id,
    offerId: r.offer_id,
    offerTitle: r.offer_title,
    rewardGold: Number(r.reward_gold),
    rewardBoostPercent: r.reward_boost_percent,
  }));
}
