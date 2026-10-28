// 홈 "채굴 속도 증가시키기" 판의 미션 타일 (더미 데이터)
// 실제 앱의 3D 아이콘은 저작권이 있어 이모지로 대신한다
export type MissionTile = {
  id: string;
  name: string;    // 예: '드릴 미션'
  emoji: string;
  badge?: string;  // 타일 왼쪽 위 리본. 예: '1.5배'
};

export const missionTiles: MissionTile[] = [
  { id: 'drill', name: '드릴 미션', emoji: '🔧' },
  { id: 'bomb', name: '폭발 미션', emoji: '💣' },
  { id: 'orb', name: '마법구슬 미션', emoji: '🔮', badge: '1.5배' },
  { id: 'pickaxe', name: '곡괭이 미션', emoji: '⛏️' },
  { id: 'wand', name: '마법봉 미션', emoji: '🪄' },
  { id: 'cart', name: '광차 미션', emoji: '🛒' },
  { id: 'pouch', name: '보따리 미션', emoji: '💰' },
];

// "미션달성하고 보상받기" 카드에 보여 줄 대표 미션 (오퍼월 PR에서 실제 미션과 연결)
export const featuredMission = {
  title: '냥탈출',
  emoji: '🐱',
  totalPercent: 1_515, // 단계별 속도 보상의 합
};
