import { gramsToUnits } from '@/features/wallet/gold';
import type { GoldUnits } from '@/features/wallet/types';

// 미션 한 개 (완료하면 reward만큼 적립)
export type Mission = {
  id: string;
  title: string;        // 예: '오늘의 금 퀴즈 풀기'
  description: string;
  reward: GoldUnits;
};

// 더미 미션 목록 (하루 1회씩 완료 가능)
export const missions: Mission[] = [
  {
    id: 'quiz',
    title: '오늘의 금 퀴즈 풀기',
    description: '금에 관한 퀴즈 한 문제를 풀어요',
    reward: gramsToUnits('0.000050'),
  },
  {
    id: 'gold-price',
    title: '오늘의 금 시세 확인하기',
    description: '오늘 금 1g이 얼마인지 확인해요',
    reward: gramsToUnits('0.000030'),
  },
  {
    id: 'share',
    title: '친구에게 금줍줍 공유하기',
    description: '친구에게 앱을 소개해요',
    reward: gramsToUnits('0.000100'),
  },
];
