import { gramsToUnits } from '@/features/wallet/gold';
import type { Transaction } from '@/features/wallet/types';

// 처음 실행했을 때 지갑에 들어 있는 샘플 내역 (최신순)
// 잔액 = 내역의 합 → 0.010130g (약 1,580원): 1,000원 상품은 교환 가능, 3,000원부터는 잔액 부족
// 출석·룰렛 보상은 금이 아니라 채굴 속도라서, 지갑 내역에는 금 줍기와 메시지 보상만 들어간다
export const initialTransactions: Transaction[] = [
  {
    id: 'seed-3',
    type: 'earn',
    amount: gramsToUnits('0.000120'),
    title: '금 줍기',
    source: 'mining',
    key: 'mining:seed-2',
    createdAt: '2026-10-26T03:00:00.000Z',
  },
  {
    id: 'seed-2',
    type: 'earn',
    amount: gramsToUnits('0.000010'),
    title: '금 줍기',
    source: 'mining',
    key: 'mining:seed-1',
    createdAt: '2026-10-25T01:00:00.000Z',
  },
  {
    id: 'seed-1',
    type: 'earn',
    amount: gramsToUnits('0.010000'),
    title: '신규 가입 축하 금',
    source: 'message',
    key: 'message:welcome',
    createdAt: '2026-10-25T00:30:00.000Z',
  },
];
