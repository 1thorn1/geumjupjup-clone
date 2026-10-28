import { gramsToUnits, KRW_PER_GRAM, krwToUnits } from '@/features/wallet/gold';
import type { GoldUnits } from '@/features/wallet/types';

// 교환 상품 한 개 (실제 앱 선물 탭 기준). 상품 이미지는 상표라서 색 카드 + 이모지 + 글자로 대신한다
export type ProductCategory = 'gold' | 'gifticon';

export type Product = {
  id: string;
  category: ProductCategory;
  group: string;        // 브랜드 묶음 제목. 예: '삼성금거래소', 'Kakao'
  subtitle: string;     // 카드 위쪽 작은 글자. 예: '카카오톡 선물하기 상품권'
  name: string;         // 카드 아래쪽 큰 글자. 예: '1 g', '10,000원'
  fullName: string;     // 확인 팝업·내역에 쓰는 전체 이름
  priceKrw: number;     // 원화 가치
  cost: GoldUnits;      // 교환에 필요한 금
  badgePercent: number; // 카드 오른쪽 위 배지 (뜻을 확인하지 못해 모양만 표시)
  emoji: string;        // 이미지 대신
  visual: string;       // 이미지 자리에 보여 줄 글자
  color: string;        // 이미지 자리 배경색
};

// 금 상품: g 단위 그대로 교환 (1g = 156,000원)
function goldBar(grams: number, badgePercent: number): Product {
  return {
    id: `gold-${grams}g`,
    category: 'gold',
    group: '삼성금거래소',
    subtitle: '삼성금거래소',
    name: `${grams} g`,
    fullName: `삼성금거래소 골드바 ${grams}g`,
    priceKrw: grams * KRW_PER_GRAM,
    cost: gramsToUnits(grams),
    badgePercent,
    emoji: '🪙',
    visual: `GOLD BAR\n${grams}g`,
    color: '#1F2A44',
  };
}

// 기프티콘: 원화 가격을 시세로 환산해 필요한 금 계산
function kakaoGift(priceKrw: number, badgePercent: number): Product {
  const price = `${String(priceKrw).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`;
  return {
    id: `kakao-${priceKrw}`,
    category: 'gifticon',
    group: 'Kakao',
    subtitle: '카카오톡 선물하기 상품권',
    name: price,
    fullName: `카카오톡 선물하기 상품권 ${price}`,
    priceKrw,
    cost: krwToUnits(priceKrw),
    badgePercent,
    emoji: '🎁',
    visual: price,
    color: '#BFE0FF',
  };
}

export const products: Product[] = [
  goldBar(1, 10_000),
  goldBar(2, 20_000),
  goldBar(3, 30_000),
  goldBar(5, 50_000),
  kakaoGift(10_000, 200),
  kakaoGift(20_000, 400),
  kakaoGift(30_000, 600),
];

// 선물 화면의 큰 분류 → 그 안의 브랜드 묶음 순서
export const productSections: { category: ProductCategory; title: string }[] = [
  { category: 'gold', title: '금 상품' },
  { category: 'gifticon', title: '기프티콘' },
];

// 분류 안의 브랜드 묶음 (나온 순서 유지)
export function groupsOf(category: ProductCategory): { group: string; items: Product[] }[] {
  const groups: { group: string; items: Product[] }[] = [];
  for (const p of products.filter((x) => x.category === category)) {
    const found = groups.find((g) => g.group === p.group);
    if (found) found.items.push(p);
    else groups.push({ group: p.group, items: [p] });
  }
  return groups;
}
