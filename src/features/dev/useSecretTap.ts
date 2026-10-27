import { useEffect, useRef } from 'react';

// 연속으로 이 횟수만큼 누르면 onUnlock 실행
const REQUIRED_TAPS = 20;
// 이 시간(밀리초) 안에 다음 터치가 없으면 횟수를 처음부터 다시 센다
const RESET_AFTER_MS = 1500;

// 숨겨진 영역을 여러 번 눌러야 열리는 기능 (개발자 모드 진입)
export function useSecretTap(onUnlock: () => void) {
  const countRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    countRef.current += 1;
    if (countRef.current >= REQUIRED_TAPS) {
      countRef.current = 0;
      onUnlock();
      return;
    }
    timerRef.current = setTimeout(() => {
      countRef.current = 0;
    }, RESET_AFTER_MS);
  };
}
