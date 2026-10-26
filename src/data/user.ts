// 더미 사용자 (서버 대신 사용)
export type User = {
  id: string;
  nickname: string;
};

export const dummyUser: User = {
  id: 'user-1',
  nickname: '줍줍이',
};
