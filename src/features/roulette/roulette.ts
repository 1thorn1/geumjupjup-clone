import { ROULETTE_DAILY_LIMIT, ROULETTE_FREE_SPINS } from '@/data/rewards';
import type { Boost } from '@/features/mining/mining';

// 그날 룰렛 기록의 key 앞부분. 예: 'roulette:2026-10-27' → 회차별 key는 'roulette:2026-10-27:1'
export function rouletteDayPrefix(dateKey: string): string {
  return `roulette:${dateKey}:`;
}

// 오늘 돌린 횟수 (꽝 포함). 보상 내역에서 오늘 룰렛 key를 센다
export function countTodaySpins(boosts: Boost[], dateKey: string): number {
  const prefix = rouletteDayPrefix(dateKey);
  return boosts.filter((b) => b.key.startsWith(prefix)).length;
}

// 오늘 남은 횟수
export function remainingSpins(spinsToday: number): number {
  return Math.max(0, ROULETTE_DAILY_LIMIT - spinsToday);
}

// 다음 회차가 광고를 봐야 하는지
export function needsAdForNextSpin(spinsToday: number): boolean {
  return spinsToday >= ROULETTE_FREE_SPINS;
}
