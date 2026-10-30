import { useEffect, useState } from 'react';

import { getMinedAmount, getSpeedPercent, MINING_CAP } from './mining';
import { useMiningContext } from './MiningProvider';

// 채굴량을 1초마다 다시 계산해서 보여 줄 때 쓰는 훅
// (공유 상태는 MiningProvider, 1초 갱신은 이 훅을 쓰는 화면만)
export function useMining() {
  const { state, restart, collect, undoCollect, addBoost, hasBoostKey } = useMiningContext();
  // 지금 시각 (1초마다 갱신해서 화면을 다시 그리게 함)
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isLoading = state === null;
  const boosts = state?.boosts ?? [];
  const mined = state === null ? 0 : getMinedAmount(state.startedAt, now, boosts);
  const isFull = mined >= MINING_CAP;
  const speedPercent = getSpeedPercent(boosts, now);

  return { mined, isFull, isLoading, speedPercent, boosts, restart, collect, undoCollect, addBoost, hasBoostKey };
}
