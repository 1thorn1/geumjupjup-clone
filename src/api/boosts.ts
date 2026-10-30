import type { Boost, BoostInput } from '@/features/mining/mining';

import { rpc, select } from './client';

// DB의 boosts 한 줄
type BoostRow = {
  id: number;
  title: string;
  percent: number;
  idempotency_key: string;
  activated_at: string;
  expires_at: string | null;
};

function toBoost(row: BoostRow): Boost {
  return {
    id: String(row.id),
    title: row.title,
    percent: row.percent,
    key: row.idempotency_key,
    activatedAt: row.activated_at,
    expiresAt: row.expires_at,
  };
}

// GET /me/boosts: 내 채굴 속도 보상 (최신순)
export async function listBoosts(): Promise<Boost[]> {
  const rows = await select<BoostRow[]>((db) =>
    db.from('boosts').select('*').order('activated_at', { ascending: false }).order('id', { ascending: false }),
  );
  return rows.map(toBoost);
}

// POST /me/boosts: 속도 보상 받기 (출석, 룰렛, 개발자 모드). 출처는 서버가 key 앞부분으로 정한다
export async function addBoost(input: BoostInput): Promise<Boost> {
  const row = await rpc<BoostRow>('add_boost', {
    p_title: input.title,
    p_percent: input.percent,
    p_key: input.key,
    p_expires_at: input.expiresAt,
  });
  return toBoost(row);
}

// 개발자 모드: key가 이 글자로 시작하는 보상 삭제 (오퍼 보상은 지우지 않음)
export function devDeleteBoosts(keyPrefix: string): Promise<void> {
  return rpc<void>('dev_delete_boosts', { p_key_prefix: keyPrefix });
}
