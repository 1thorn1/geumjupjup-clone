import { krwToUnits } from '@/features/wallet/gold';
import type { GoldUnits } from '@/features/wallet/types';

// 교환 상품 한 개
export type Product = {
  id: string;
  brand: string;      // 예: '네이버페이'
  name: string;       // 예: '네이버페이 포인트 1,000원'
  priceKrw: number;   // 원화 가격
  cost: GoldUnits;    // 교환에 필요한 금 (원화 가격을 시세로 환산)
};

function product(id: string, brand: string, name: string, priceKrw: number): Product {
  return { id, brand, name, priceKrw, cost: krwToUnits(priceKrw) };
}

// 더미 교환 상품 목록 (가격 낮은 순)
export const products: Product[] = [
  product('naverpay-1000', '네이버페이', '네이버페이 포인트 1,000원', 1_000),
  product('cvs-3000', 'CU', '편의점 모바일 상품권 3,000원', 3_000),
  product('cafe-americano', '스타벅스', '아메리카노 Tall', 4_500),
  product('naverpay-5000', '네이버페이', '네이버페이 포인트 5,000원', 5_000),
  product('naverpay-10000', '네이버페이', '네이버페이 포인트 10,000원', 10_000),
];
