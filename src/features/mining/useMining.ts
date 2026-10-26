import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { getMinedAmount, MINING_CAP } from './mining';

const STARTED_AT_KEY = 'mining:startedAt';

export function useMining() {
  // 채굴을 시작한 시각 (저장소에서 불러오기 전에는 null)
  const [startedAt, setStartedAt] = useState<number | null>(null);
  // 지금 시각 (1초마다 갱신해서 화면을 다시 그리게 함)
  const [now, setNow] = useState(() => Date.now());

  // 앱이 켜지면 저장된 시작 시각을 불러옴. 없으면 지금을 시작 시각으로 저장
  useEffect(() => {
    async function load() {
      const saved = await AsyncStorage.getItem(STARTED_AT_KEY);
      if (saved !== null) {
        setStartedAt(Number(saved));
        return;
      }
      const t = Date.now();
      await AsyncStorage.setItem(STARTED_AT_KEY, String(t));
      setStartedAt(t);
    }
    load();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isLoading = startedAt === null;
  const mined = startedAt === null ? 0 : getMinedAmount(startedAt, now);
  const isFull = mined >= MINING_CAP;

  // 채굴량을 0으로 되돌리고 다시 시작 (금 줍기에서 쓸 예정)
  const restart = () => {
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
    AsyncStorage.setItem(STARTED_AT_KEY, String(t));
  };

  return { mined, isFull, isLoading, restart };
}
