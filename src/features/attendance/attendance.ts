import { gramsToUnits } from '@/features/wallet/gold';
import type { Transaction } from '@/features/wallet/types';

/** 출석 1회 보상 (mock) */
export const ATTENDANCE_REWARD = gramsToUnits('0.000010');

function isSameLocalDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** 오늘 출석 보상을 이미 받았는지 (적립 내역으로 판단) */
export function hasCheckedInToday(transactions: Transaction[], now = Date.now()): boolean {
  return transactions.some(
    (tx) => tx.type === 'earn' && tx.source === 'attendance' && isSameLocalDay(tx.createdAt, now),
  );
}
