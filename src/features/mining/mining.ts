import { gramsToUnits } from '@/features/wallet/gold';
import type { GoldUnits } from '@/features/wallet/types';

// 채굴 상한: 이만큼 차면 더 안 쌓임
export const MINING_CAP: GoldUnits = gramsToUnits('0.000120');

// 기본 속도(100%)로 빈 상태에서 상한까지 차는 데 걸리는 시간 (초)
export const MINING_FILL_SECONDS = 60;

// 기본 속도 (%)
export const BASE_SPEED_PERCENT = 100;

// 기본 속도로 1초에 쌓이는 양 (알갱이)
const UNITS_PER_SECOND = MINING_CAP / MINING_FILL_SECONDS;

// 채굴 속도 보상 한 줄 (출석, 룰렛, 메시지함 등에서 받음)
export type Boost = {
  id: string;
  title: string;            // 화면에 보일 이름. 예: '출석 체크'
  percent: number;          // 올려 주는 속도. 예: 10 → +10%
  key: string;              // 중복 방지용 고유 키. 예: 'attendance:2026-10-27'
  activatedAt: string;      // 받은 시각 (ISO 문자열)
  expiresAt: string | null; // 끝나는 시각 (ISO 문자열). null이면 영구
};

// 보상을 만들 때 넘기는 값 (id, activatedAt은 받는 순간 채운다)
export type BoostInput = Pick<Boost, 'title' | 'percent' | 'key' | 'expiresAt'>;

function isActive(boost: Boost, at: number): boolean {
  const from = Date.parse(boost.activatedAt);
  const to = boost.expiresAt === null ? Infinity : Date.parse(boost.expiresAt);
  return from <= at && at < to;
}

// 지금 채굴 속도 (%) = 기본 100% + 켜져 있는 보상 합
export function getSpeedPercent(boosts: Boost[], now: number): number {
  return boosts
    .filter((b) => isActive(b, now))
    .reduce((sum, b) => sum + b.percent, BASE_SPEED_PERCENT);
}

// startedAt부터 now까지 쌓인 채굴량 (시각은 밀리초)
// = 기본 속도로 쌓인 양 + 각 보상이 켜져 있던 시간만큼 추가로 쌓인 양
export function getMinedAmount(startedAt: number, now: number, boosts: Boost[] = []): GoldUnits {
  const baseSeconds = Math.max(0, now - startedAt) / 1000;

  let boostedSeconds = 0;
  for (const b of boosts) {
    const from = Math.max(startedAt, Date.parse(b.activatedAt));
    const to = Math.min(now, b.expiresAt === null ? now : Date.parse(b.expiresAt));
    if (to > from) boostedSeconds += ((to - from) / 1000) * (b.percent / BASE_SPEED_PERCENT);
  }

  const mined = UNITS_PER_SECOND * (baseSeconds + boostedSeconds);
  return Math.floor(Math.min(MINING_CAP, mined));
}

// 보상 추가. 같은 key가 이미 있으면 그대로 돌려준다 (같은 보상 재수령 방지)
// percent 0(룰렛 꽝)도 "참여 기록"으로 남긴다. 속도에는 영향이 없다
export function addBoost(boosts: Boost[], input: BoostInput, now: number): Boost[] {
  if (input.percent < 0) return boosts;
  if (boosts.some((b) => b.key === input.key)) return boosts;
  const boost: Boost = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    activatedAt: new Date(now).toISOString(),
  };
  return [boost, ...boosts];
}
