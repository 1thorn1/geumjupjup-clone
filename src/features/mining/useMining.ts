import { useEffect, useState } from 'react';

import { getMinedAmount, MINING_CAP } from './mining';

export function useMining() {
  // 채굴을 시작한 시각
  const [startedAt, setStartedAt] = useState(() => Date.now());
  // 지금 시각 (1초마다 갱신해서 화면을 다시 그리게 함)
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const mined = getMinedAmount(startedAt, now);
  const isFull = mined >= MINING_CAP;

  // 채굴량을 0으로 되돌리고 다시 시작 (금 줍기에서 쓸 예정)
  const restart = () => {
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
  };

  return { mined, isFull, restart };
}
