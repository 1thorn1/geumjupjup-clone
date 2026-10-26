import { gramsToUnits } from '@/features/wallet/gold';
import type { GoldUnits } from '@/features/wallet/types';

// 채굴 상한: 이만큼 차면 더 안 쌓임
export const MINING_CAP: GoldUnits = gramsToUnits('0.000120');

// 빈 상태에서 상한까지 차는 데 걸리는 시간 (초)
export const MINING_FILL_SECONDS = 60;

// 1초에 쌓이는 양 (알갱이)
const UNITS_PER_SECOND = MINING_CAP / MINING_FILL_SECONDS;

// startedAt부터 now까지 쌓인 채굴량 (둘 다 밀리초)
export function getMinedAmount(startedAt: number, now: number): GoldUnits {
  const elapsedSeconds = (now - startedAt) / 1000;
  const mined = UNITS_PER_SECOND * elapsedSeconds;
  return Math.floor(Math.min(MINING_CAP, mined));
}