// Mock 오퍼월 미션 (더미 데이터). 실제 게임 설치·회원가입 대신, 단계를 누르면 완료한 것으로 처리한다
// 홈의 미션 타일(드릴·폭발 등)은 외부 게임·광고와 연동되는 부분이라 "준비 중"으로 두고,
// 오퍼월 흐름은 "미션달성하고 보상받기" 카드의 냥탈출 하나로 보여 준다
// 보상은 실제 앱처럼 금이 아니라 채굴 속도(%)
export type OfferStep = {
  id: string;
  label: string;   // 예: '5레벨 클리어하고 채굴속도 받기'
  percent: number; // 기본 보상 (%)
};

export type Offer = {
  id: string;
  category: string;     // 상세 화면 제목. 예: '폭발 미션'
  title: string;        // 캠페인 이름. 예: '냥탈출'
  emoji: string;        // 게임 이미지 대신
  color: string;        // 상단 큰 배경색
  deadlineDays: number; // 참여 후 며칠 안에 완료해야 하는지
  multiplier?: number;  // 보상 배수 (없으면 1배)
  steps: OfferStep[];
};

const levelSteps = (levels: number[], percents: number[]): OfferStep[] =>
  levels.map((lv, i) => ({ id: `lv${lv}`, label: `${lv}레벨 클리어하고 채굴속도 받기`, percent: percents[i] }));

export const offers: Offer[] = [
  {
    id: 'nyang-escape',
    category: '폭발 미션',
    title: '냥탈출',
    emoji: '🐱🧱',
    color: '#FF8FB8',
    deadlineDays: 7,
    steps: levelSteps([5, 10, 15, 20, 25], [75, 15, 150, 75, 300]),
  },
];

// 홈 "미션달성하고 보상받기" 카드에 보여 줄 대표 미션
export const FEATURED_OFFER_ID = 'nyang-escape';

export function getOffer(id: string): Offer | undefined {
  return offers.find((o) => o.id === id);
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
