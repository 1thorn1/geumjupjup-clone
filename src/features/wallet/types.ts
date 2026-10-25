/** 금 수량. 1 = 0.000000000001g (10⁻¹²g) 인 정수로 저장한다. */
export type GoldUnits = number;

/** 금을 적립한 경로 */
export type EarnSource = 'attendance' | 'ad' | 'message';

/** 적립 내역 (금 내역 > 상세 내역) */
export type EarnTransaction = {
  id: string;
  type: 'earn';
  source: EarnSource;
  amount: GoldUnits;
  createdAt: number; // epoch ms
};

/** 교환 내역 (금 내역 > 구매 내역) */
export type PurchaseTransaction = {
  id: string;
  type: 'purchase';
  productId: string;
  productName: string;
  amount: GoldUnits; // 차감된 양 (양수)
  createdAt: number; // epoch ms
};

export type Transaction = EarnTransaction | PurchaseTransaction;
