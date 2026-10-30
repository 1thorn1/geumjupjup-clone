import type { TransactionInput } from '@/features/wallet/store';
import type { GoldUnits, Transaction } from '@/features/wallet/types';

import { rpc, select } from './client';

// DB의 gold_transactions 한 줄
type GoldTransactionRow = {
  id: number;
  type: Transaction['type'];
  amount: number;
  title: string;
  source: Transaction['source'];
  idempotency_key: string;
  created_at: string;
};

function toTransaction(row: GoldTransactionRow): Transaction {
  return {
    id: String(row.id),
    type: row.type,
    amount: Number(row.amount),
    title: row.title,
    source: row.source,
    key: row.idempotency_key,
    createdAt: row.created_at,
  };
}

// GET /me/gold-transactions: 내 금 내역 (최신순). 잔액은 앱이 이 내역의 합으로 계산한다
export async function listGoldTransactions(): Promise<Transaction[]> {
  const rows = await select<GoldTransactionRow[]>((db) =>
    db
      .from('gold_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false }),
  );
  return rows.map(toTransaction);
}

// POST /me/gold-transactions: 금 적립 (금 줍기, 개발자 모드)
export async function earnGold(input: TransactionInput): Promise<Transaction> {
  const row = await rpc<GoldTransactionRow>('earn_gold', {
    p_amount: input.amount,
    p_title: input.title,
    p_source: input.source,
    p_key: input.key,
  });
  return toTransaction(row);
}

// POST /exchanges: 교환 신청. 가격은 서버가 상품 표에서 직접 읽는다
export async function exchangeProduct(productId: string, key: string): Promise<Transaction> {
  const row = await rpc<GoldTransactionRow>('exchange_product', { p_product_id: productId, p_key: key });
  return toTransaction(row);
}

// 개발자 모드: 금 차감
export async function devSpendGold(amount: GoldUnits, key: string): Promise<Transaction> {
  const row = await rpc<GoldTransactionRow>('dev_spend_gold', { p_amount: amount, p_key: key });
  return toTransaction(row);
}

// 개발자 모드: 처음 설치한 상태로
export function devReset(): Promise<void> {
  return rpc<void>('dev_reset');
}
