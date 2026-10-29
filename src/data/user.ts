// 더미 사용자 (서버 대신 사용). 프로필 탭에서 보여 준다
export type User = {
  id: string;
  memberNo: number;    // 회원번호. 예: 47304
  nickname: string;
  avatar: string;      // 캐릭터 이미지는 저작권이 있어 이모지로 대신한다
  rankPercent: number; // "당신은 현재 상위 n% 입니다" 문구
};

export const dummyUser: User = {
  id: 'user-1',
  memberNo: 47304,
  nickname: '줍줍이',
  avatar: '🐥',
  rankPercent: 20,
};
