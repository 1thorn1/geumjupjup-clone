// 금 알갱이 개수. 1알갱이 = 0.000000000001g (10⁻¹²g). 항상 정수
export type GoldUnits = number;

// 내역의 종류: 적립 또는 차감
export type TransactionType = 'earn' | 'spend';

// 금이 어디서 생기거나 쓰였는지 (dev: 개발자 모드에서 테스트용으로 조정)
// 출석·룰렛은 금이 아니라 채굴 속도를 주므로 여기 없다
export type TransactionSource = 'mining' | 'message' | 'offer' | 'exchange' | 'dev';

// 금 내역 한 줄
export type Transaction = {
  id: string;                 // 내역 고유 번호
  type: TransactionType;      // 적립(earn) / 차감(spend)
  amount: GoldUnits;          // 알갱이 개수. 항상 양수 정수 (+/-는 type으로 구분)
  title: string;              // 화면에 보일 이름. 예: '출석 체크'
  source: TransactionSource;  // 출처. 예: 'mining'
  key: string;                // 중복 방지용 고유 키. 예: 'mining:1761530400000'
  createdAt: string;          // 생긴 시각 (ISO 문자열). 예: '2026-10-24T09:00:00.000Z'
};
