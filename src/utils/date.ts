// 기기(한국) 시간 기준 날짜 키. 예: '2026-10-27'
// toISOString()은 세계 표준시(UTC)라 한국 시간 오전 9시에 날짜가 바뀌므로 쓰지 않는다
export function toLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ISO 문자열 → 기기 시간 기준 날짜. 예: '10월 27일'
export function formatMonthDay(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// ISO 문자열 → 기기 시간 기준 시각. 예: '21:46'
export function formatTime(iso: string): string {
  const date = new Date(iso);
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}
