// 행동별 채굴 속도 보상 (더미 데이터)

// 출석 체크 1회 보상: 채굴 속도 +10% (영구). 광고를 본 뒤 받을 수 있다
export const ATTENDANCE_BOOST_PERCENT = 10;

// 룰렛은 하루 3번. 첫 번째는 무료, 나머지는 광고를 본 뒤 돌릴 수 있다
export const ROULETTE_DAILY_LIMIT = 3;
export const ROULETTE_FREE_SPINS = 1;

// 룰렛 칸 구성: 꽝 3칸 + 랜덤 3칸 (번갈아 배치)
export type RouletteSegment = 'random' | 'lose';
export const ROULETTE_SEGMENTS: RouletteSegment[] = ['random', 'lose', 'random', 'lose', 'random', 'lose'];

// 랜덤 칸에 멈추면 이 중 하나를 받는다: 채굴 속도 +5 ~ +20% (5 단위)
export const ROULETTE_RANDOM_PERCENTS = [5, 10, 15, 20];
