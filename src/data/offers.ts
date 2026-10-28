// Mock 오퍼월 미션 (더미 데이터). 실제 게임 설치·회원가입 대신, 단계를 누르면 완료한 것으로 처리한다
// 보상은 실제 앱처럼 금이 아니라 채굴 속도(%)
export type OfferStep = {
  id: string;
  label: string;   // 예: '5레벨 클리어하고 채굴속도 받기'
  percent: number; // 기본 보상 (%)
};

export type Offer = {
  id: string;
  tileId: string;       // 홈 미션 타일 id (missionTiles.ts)
  category: string;     // 상세 화면 제목. 예: '폭발 미션'
  title: string;        // 캠페인 이름. 예: '냥탈출'
  emoji: string;        // 게임 이미지 대신
  color: string;        // 상단 큰 배경색
  deadlineDays: number; // 참여 후 며칠 안에 완료해야 하는지
  multiplier?: number;  // 보상 배수 (타일 리본 '1.5배')
  steps: OfferStep[];
};

const levelSteps = (levels: number[], percents: number[]): OfferStep[] =>
  levels.map((lv, i) => ({ id: `lv${lv}`, label: `${lv}레벨 클리어하고 채굴속도 받기`, percent: percents[i] }));

export const offers: Offer[] = [
  {
    id: 'nyang-escape',
    tileId: 'bomb',
    category: '폭발 미션',
    title: '냥탈출',
    emoji: '🐱🧱',
    color: '#FF8FB8',
    deadlineDays: 7,
    steps: levelSteps([5, 10, 15, 20, 25], [75, 15, 150, 75, 300]),
  },
  {
    id: 'stock-signup',
    tileId: 'drill',
    category: '드릴 미션',
    title: '증권 앱 회원가입',
    emoji: '📈',
    color: '#7FB3FF',
    deadlineDays: 3,
    steps: [{ id: 'signup', label: '회원가입하고 채굴속도 받기', percent: 500 }],
  },
  {
    id: 'magic-puzzle',
    tileId: 'orb',
    category: '마법구슬 미션',
    title: '마법 퍼즐',
    emoji: '🔮✨',
    color: '#B79BFF',
    deadlineDays: 7,
    multiplier: 1.5,
    steps: levelSteps([3, 7, 12], [40, 80, 160]),
  },
  {
    id: 'shopping-install',
    tileId: 'pickaxe',
    category: '곡괭이 미션',
    title: '쇼핑 앱 설치하고 실행',
    emoji: '🛍️',
    color: '#FFB36B',
    deadlineDays: 1,
    steps: [{ id: 'open', label: '설치 후 실행하고 채굴속도 받기', percent: 120 }],
  },
  {
    id: 'card-apply',
    tileId: 'wand',
    category: '마법봉 미션',
    title: '카드 신청',
    emoji: '💳',
    color: '#8ED9B5',
    deadlineDays: 14,
    steps: [{ id: 'apply', label: '카드 신청 완료하고 채굴속도 받기', percent: 1000 }],
  },
  {
    id: 'mine-tycoon',
    tileId: 'cart',
    category: '광차 미션',
    title: '광산 키우기',
    emoji: '⛏️🏔️',
    color: '#C9A27A',
    deadlineDays: 7,
    steps: levelSteps([10, 20, 30], [60, 120, 240]),
  },
  {
    id: 'survey',
    tileId: 'pouch',
    category: '보따리 미션',
    title: '설문 참여',
    emoji: '📝',
    color: '#F4C95D',
    deadlineDays: 1,
    steps: [{ id: 'answer', label: '설문 응답하고 채굴속도 받기', percent: 30 }],
  },
];

// 홈 "미션달성하고 보상받기" 카드에 보여 줄 대표 미션
export const FEATURED_OFFER_ID = 'nyang-escape';

export function getOffer(id: string): Offer | undefined {
  return offers.find((o) => o.id === id);
}

export function getOfferByTile(tileId: string): Offer | undefined {
  return offers.find((o) => o.tileId === tileId);
}

// 배수까지 적용한 단계 보상 (%)
export function stepReward(offer: Offer, step: OfferStep): number {
  return Math.round(step.percent * (offer.multiplier ?? 1));
}

// 미션 전체를 다 하면 받는 속도 합계 (%)
export function totalReward(offer: Offer): number {
  return offer.steps.reduce((sum, step) => sum + stepReward(offer, step), 0);
}

// 단계 보상 기록의 key (중복 방지)
export function stepKey(offerId: string, stepId: string): string {
  return `offer:${offerId}:${stepId}`;
}
