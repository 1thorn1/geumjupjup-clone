import type { GoldUnits } from './types';

/** 1g = 10¹² units */
export const UNITS_PER_GRAM = 1_000_000_000_000;

/** 금 1g당 원화 시세 (mock). 0.000044886287g → 7원 이 되도록 맞춤 */
export const KRW_PER_GRAM = 156_000;

const DECIMALS = 12;

/** g 단위 문자열/숫자 → 정수 units. 예: '0.000044886287' → 44886287 */
export function gramsToUnits(grams: string | number): GoldUnits {
  const [int = '0', frac = ''] = String(grams).split('.');
  const fracPadded = frac.padEnd(DECIMALS, '0').slice(0, DECIMALS);
  return Number(int) * UNITS_PER_GRAM + Number(fracPadded);
}

/** units → 소수점 12자리 g 표기. 예: 44886287 → '0.000044886287g' */
export function formatGold(units: GoldUnits): string {
  const int = Math.floor(units / UNITS_PER_GRAM);
  const frac = String(units % UNITS_PER_GRAM).padStart(DECIMALS, '0');
  return `${int}.${frac}g`;
}

/** units → 원화 환산 (원 미만 버림) */
export function unitsToKrw(units: GoldUnits): number {
  return Math.floor((units / UNITS_PER_GRAM) * KRW_PER_GRAM);
}

/** 원화 표기. 예: 10000 → '10,000원' */
export function formatKrw(krw: number): string {
  return `${String(krw).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`;
}
