import type { Transaction } from '@/features/wallet/types';

import { rpc, select } from './client';
import { toTransaction, type GoldTransactionRow } from './wallet';

// GET /me/mining: 이번 채굴을 시작한 시각 (밀리초). 서버 profiles에 저장돼 있다
export async function getMiningStartedAt(): Promise<number> {
  const row = await select<{ mining_started_at: string }>((db) =>
    db.from('profiles').select('mining_started_at').single(),
  );
  return Date.parse(row.mining_started_at);
}

// POST /me/mining/collections: 금 줍기. 금액은 보내지 않고, 서버가 계산해서 적립한 내역을 돌려준다
// 채굴은 이 내역이 만들어진 시각부터 다시 시작한다
export async function collectMining(): Promise<Transaction> {
  return toTransaction(await rpc<GoldTransactionRow>('collect_mining'));
}

// 개발자 모드: 채굴량을 바로 상한까지 채움. 새 시작 시각(밀리초)을 돌려준다
export async function devFillMining(): Promise<number> {
  return Date.parse(await rpc<string>('dev_fill_mining'));
}
